import { promises as fs } from "node:fs";
import path from "node:path";
import { renderAgentCommand } from "../agents/custom.js";
import { buildTaskPrompt } from "../prompts/task-prompt.js";
import { runPath } from "../utils/paths.js";
import { nowIso } from "../utils/time.js";
import { collectDiffSummary } from "./diff-analyzer.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";
import { applyPatch, listUntrackedFiles, runGit } from "./git.js";
import { commandResultLog, redactSecrets, runCommand } from "./process-safe.js";
import { hasCriticalRisk, scanRisks } from "./risk-scanner.js";
import { scoreResult } from "./scorer.js";
import { runTests } from "./test-runner.js";
import { createRunWorktree, safeSegment } from "./worktree-manager.js";
export async function runAgentTask(options) {
    const started = Date.now();
    const startedAt = nowIso();
    const safeAgent = safeSegment(options.agent.name);
    const worktreePath = await createRunWorktree(options.repoRoot, options.runId, options.task.id, options.agent.name, options.task.parentCommit);
    const promptPath = runPath(options.repoRoot, options.runId, "prompts", `${options.task.id}-${safeAgent}.md`);
    const logPath = runPath(options.repoRoot, options.runId, "logs", `${options.task.id}-${safeAgent}.log`);
    const patchPath = runPath(options.repoRoot, options.runId, "patches", options.task.id, `${safeAgent}.patch`);
    const stdoutLogPath = runPath(options.repoRoot, options.runId, "logs", `${options.task.id}-${safeAgent}.stdout.log`);
    const stderrLogPath = runPath(options.repoRoot, options.runId, "logs", `${options.task.id}-${safeAgent}.stderr.log`);
    const testLogPath = runPath(options.repoRoot, options.runId, "logs", `${options.task.id}-${safeAgent}.test.log`);
    const baselineLogPath = runPath(options.repoRoot, options.runId, "logs", `${options.task.id}-${safeAgent}.baseline.log`);
    await ensureDir(path.dirname(promptPath));
    await writeGeneratedFile(options.repoRoot, promptPath, buildTaskPrompt(options.task));
    const timeoutMs = (options.agent.timeoutMinutes ?? options.config.timeoutMinutesPerAgent) * 60 * 1000;
    const install = await runInstallIfConfigured(options.repoRoot, worktreePath, options.config, timeoutMs);
    const installUntrackedFiles = install !== null ? await discardInstallSideEffects(worktreePath) : [];
    const baseline = options.baselineCheck
        ? await runTests(options.repoRoot, worktreePath, options.config.testCommand, timeoutMs, baselineLogPath, "baseline", options.config.sandbox)
        : null;
    const commandResult = install !== null && install.exitCode !== 0
        ? syntheticResult("install failed before agent", worktreePath, 1, install.output, false)
        : baseline !== null && !baseline.skipped && !baseline.passed
            ? syntheticResult("baseline check failed before agent", worktreePath, 1, baseline.output, false)
            : await runAgentCommand(options, worktreePath, promptPath, timeoutMs);
    const diff = await collectDiffSummary(options.repoRoot, worktreePath, patchPath, installUntrackedFiles);
    const rootPatchPath = path.join(options.repoRoot, ".reporacer", "patches", options.task.id, `${safeAgent}.patch`);
    await writeGeneratedFile(options.repoRoot, rootPatchPath, await fs.readFile(patchPath, "utf8"));
    const hiddenTestPatchPath = options.task.hiddenTestPatchPath;
    const hiddenTestPatchApplied = options.config.evaluationMode === "hidden-target-tests" && hiddenTestPatchPath !== null;
    let hiddenPatchError = null;
    if (hiddenTestPatchApplied && commandResult.exitCode === 0 && !commandResult.timedOut) {
        try {
            await applyPatch(worktreePath, hiddenTestPatchPath);
        }
        catch (error) {
            hiddenPatchError = redactSecrets(error instanceof Error ? error.message : "Hidden test patch failed to apply.");
        }
    }
    const tests = hiddenPatchError !== null
        ? failedHiddenPatchTests(options.config.testCommand, hiddenPatchError)
        : commandResult.exitCode === 0 && !commandResult.timedOut
            ? await runTests(options.repoRoot, worktreePath, options.config.testCommand, timeoutMs, testLogPath, hiddenTestPatchApplied ? "hidden" : "agent", options.config.sandbox)
            : skippedTestsAfterAgentFailure(options.config.testCommand);
    const hiddenTests = hiddenTestPatchApplied && commandResult.exitCode === 0 && !commandResult.timedOut
        ? {
            ...tests,
            phase: "hidden"
        }
        : null;
    const agentPatch = await fs.readFile(patchPath, "utf8");
    const risks = scanRisks(diff, options.config, agentPatch);
    const humanPatch = await fs.readFile(options.task.humanPatchPath, "utf8");
    const status = determineStatus(commandResult, diff.changedFiles.length, tests, risks, install, baseline, hiddenPatchError);
    const scores = scoreResult({
        task: options.task,
        humanPatch,
        agentPatch,
        diff,
        tests,
        hiddenTests,
        risks,
        status,
        durationMs: Date.now() - started,
        timeoutMs
    });
    await writeGeneratedFile(options.repoRoot, logPath, [
        install === null ? "" : commandResultLog(install, "install command"),
        baseline === null ? "" : testResultLog(baseline, "baseline check"),
        commandResultLog(commandResult, "agent command"),
        testResultLog(tests, hiddenTests === null ? "test command" : "hidden test command")
    ]
        .filter((section) => section.trim().length > 0)
        .join("\n\n---\n\n"));
    await writeGeneratedFile(options.repoRoot, stdoutLogPath, commandResult.stdout);
    await writeGeneratedFile(options.repoRoot, stderrLogPath, commandResult.stderr);
    return {
        id: `${options.task.id}-${options.agent.name}`,
        taskId: options.task.id,
        agentName: options.agent.name,
        status,
        startedAt,
        finishedAt: nowIso(),
        durationMs: Date.now() - started,
        worktreePath,
        promptPath,
        logPath,
        command: redactSecrets(commandResult.command),
        agentExitCode: commandResult.exitCode,
        agentError: commandResult.exitCode === 0 && !commandResult.timedOut ? null : commandResult.output.slice(0, 4000),
        install,
        baseline,
        tests,
        hiddenTests,
        diff,
        risks,
        scores,
        hiddenTestPatchApplied: hiddenTestPatchApplied && hiddenPatchError === null
    };
}
async function runInstallIfConfigured(_repoRoot, worktreePath, config, timeoutMs) {
    if (config.installCommand === null || config.installCommand.trim().length === 0) {
        return null;
    }
    return runCommand(config.installCommand, { cwd: worktreePath, timeoutMs, sandbox: config.sandbox });
}
async function discardInstallSideEffects(worktreePath) {
    await runGit(["reset", "--hard", "HEAD"], worktreePath);
    await runGit([
        "clean",
        "-fd",
        "--",
        "package-lock.json",
        "npm-shrinkwrap.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "bun.lock",
        "bun.lockb"
    ], worktreePath);
    return listUntrackedFiles(worktreePath);
}
async function runAgentCommand(options, worktreePath, promptPath, timeoutMs) {
    if (options.agent.builtIn === "fake-success") {
        const excludedPaths = options.config.evaluationMode === "hidden-target-tests" ? options.task.hiddenTestFiles : [];
        return applyHumanPatch(worktreePath, options.task.humanPatchPath, excludedPaths);
    }
    if (options.agent.builtIn === "fake-noop") {
        return syntheticResult("fake-noop", worktreePath, 0, "fake-noop made no changes.", false);
    }
    if (options.agent.builtIn === "fake-risky") {
        await fs.writeFile(path.join(worktreePath, ".env"), "OPENAI_API_KEY=sk-fake12345678901234567890\n", "utf8");
        return syntheticResult("fake-risky", worktreePath, 0, "fake-risky wrote an environment file.", false);
    }
    if (options.agent.builtIn === "fake-timeout") {
        return syntheticResult("fake-timeout", worktreePath, null, "fake-timeout simulated a timed out agent run.", true);
    }
    if (options.agent.command === null || options.agent.command.trim().length === 0) {
        return syntheticResult(options.agent.name, worktreePath, 127, `Agent command is not configured: ${options.agent.name}. Add a command in .reporacer/config.json or install/configure the matching CLI and run reporacer doctor.`, false);
    }
    const command = renderAgentCommand(options.agent.command, {
        promptFile: promptPath,
        taskId: options.task.id,
        agentName: options.agent.name,
        worktreePath,
        testCommand: options.config.testCommand ?? ""
    });
    return runCommand(command, { cwd: worktreePath, timeoutMs, sandbox: options.config.sandbox });
}
async function applyHumanPatch(worktreePath, patchPath, excludedPaths = []) {
    const started = Date.now();
    const excludeArgs = excludedPaths.flatMap((filePath) => ["--exclude", filePath]);
    const command = `git apply --whitespace=nowarn${excludedPaths.length === 0 ? "" : ` --exclude ${excludedPaths.join(" --exclude ")}`} ${patchPath}`;
    try {
        await runGit(["apply", "--whitespace=nowarn", ...excludeArgs, patchPath], worktreePath);
        return {
            command,
            cwd: worktreePath,
            exitCode: 0,
            stdout: "",
            stderr: "",
            output: "Applied historical human patch.",
            durationMs: Date.now() - started,
            timedOut: false,
            failedToStart: false
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Failed to apply historical patch.";
        return {
            command,
            cwd: worktreePath,
            exitCode: 1,
            stdout: "",
            stderr: redactSecrets(message),
            output: redactSecrets(message),
            durationMs: Date.now() - started,
            timedOut: false,
            failedToStart: false
        };
    }
}
function determineStatus(commandResult, changedFileCount, tests, risks, install, baseline, hiddenPatchError) {
    if (install !== null && install.exitCode !== 0) {
        return "internal_error";
    }
    if (baseline !== null && !baseline.skipped && !baseline.passed) {
        return "internal_error";
    }
    if (hiddenPatchError !== null) {
        return "internal_error";
    }
    if (hasCriticalRisk(risks)) {
        return "risk_blocked";
    }
    if (commandResult.timedOut) {
        return "timed_out";
    }
    if (commandResult.exitCode !== 0) {
        return "agent_failed";
    }
    if (changedFileCount === 0) {
        return "no_changes";
    }
    if (!tests.skipped && !tests.passed) {
        return "test_failed";
    }
    return "completed";
}
function failedHiddenPatchTests(command, error) {
    return {
        skipped: false,
        command,
        passed: false,
        exitCode: null,
        durationMs: 0,
        output: `Hidden target-test patch failed to apply before tests: ${error}`,
        phase: "hidden"
    };
}
function skippedTestsAfterAgentFailure(command) {
    return {
        skipped: true,
        command,
        passed: false,
        exitCode: null,
        durationMs: 0,
        output: "Skipped because the agent command did not complete successfully.",
        phase: "agent"
    };
}
function syntheticResult(command, cwd, exitCode, output, timedOut) {
    return {
        command,
        cwd,
        exitCode,
        stdout: redactSecrets(output),
        stderr: exitCode === 0 ? "" : redactSecrets(output),
        output: redactSecrets(output),
        durationMs: 0,
        timedOut,
        failedToStart: false
    };
}
function testResultLog(result, label) {
    return [
        `# ${label}`,
        `command: ${result.command ?? "none"}`,
        `skipped: ${String(result.skipped)}`,
        `passed: ${String(result.passed)}`,
        `exitCode: ${result.exitCode === null ? "null" : String(result.exitCode)}`,
        `durationMs: ${String(result.durationMs)}`,
        "",
        "## Output",
        redactSecrets(result.output)
    ].join("\n");
}
//# sourceMappingURL=agent-runner.js.map