import { promises as fs } from "node:fs";
import { resolveAgents } from "../agents/types.js";
import { runAgentTask } from "../core/agent-runner.js";
import { loadConfig } from "../core/config.js";
import { ensureDir, removeGeneratedPath, writeGeneratedFile } from "../core/fs-safe.js";
import { ensureCleanWorkingTree, getHeadSha, getRepoName, getRepoRoot, removeGitWorktree } from "../core/git.js";
import { generateReport } from "../core/report-generator.js";
import { buildLeaderboard, resetResultFiles, winnerFromLeaderboard, writeResult, writeSummary } from "../core/results.js";
import { mineTasks } from "../core/task-miner.js";
import { stringifyJson } from "../utils/json.js";
import { currentPath, repoRacerPath, runPath } from "../utils/paths.js";
import { renderTable } from "../utils/table.js";
import { makeRunId, nowIso, formatDuration } from "../utils/time.js";
import { openReport } from "../core/report-generator.js";
import { redactSecrets } from "../core/process-safe.js";
import { safeSegment } from "../core/worktree-manager.js";
export async function runRepoRacer(options = {}) {
    const repoRoot = await getRepoRoot(options.repoRoot ?? process.cwd());
    const config = await loadConfig(repoRoot);
    const reportConfig = options.redactReport === undefined
        ? config.report
        : {
            ...config.report,
            redactReport: options.redactReport
        };
    const effectiveConfig = {
        ...config,
        evaluationMode: options.evaluationMode ?? config.evaluationMode,
        keepWorktrees: options.keepWorktrees ?? config.keepWorktrees,
        report: options.publicReport
            ? {
                ...reportConfig,
                audience: "public",
                includeLogs: false,
                includePatchPreview: false,
                redactReport: true
            }
            : reportConfig
    };
    await ensureCleanWorkingTree(repoRoot, Boolean(options.allowDirty));
    const agents = resolveAgents(effectiveConfig.agents, options.agents);
    if (agents.length === 0) {
        throw new Error("No agents selected. Enable agents in .reporacer/config.json or pass --agents.");
    }
    const runId = makeRunId();
    const startedAt = nowIso();
    await prepareRunDirectories(repoRoot, runId);
    await writeConfigSnapshot(repoRoot, runId, effectiveConfig);
    await resetResultFiles(repoRoot, runId);
    await emitPluginHook(options, "onRunStart", {
        repoRoot,
        runId,
        config: effectiveConfig,
        agents: agents.map((agent) => agent.name)
    });
    const mineOptions = options.maxTasks === undefined ? { runId } : { maxTasks: options.maxTasks, runId };
    const tasks = await mineTasks(repoRoot, effectiveConfig, mineOptions);
    if (tasks.length === 0) {
        throw new Error("No suitable historical tasks found. Try lowering commit filters or using a repository with more commits.");
    }
    await emitPluginHook(options, "onTasksMined", { repoRoot, runId, tasks });
    const results = [];
    const runItems = tasks.flatMap((task) => agents.map((agent) => ({ task, agent })));
    const limit = Math.max(1, Math.min(runItems.length, effectiveConfig.parallelAgents * effectiveConfig.parallelTasks));
    let completedItems = 0;
    await runLimited(runItems, limit, async ({ task, agent }) => {
        await emitPluginHook(options, "onAgentStart", { repoRoot, runId, task, agentName: agent.name });
        emitProgress(options, {
            event: "agent_start",
            completed: completedItems,
            total: runItems.length,
            taskId: task.id,
            agentName: agent.name
        });
        const result = await runAgentSafely(repoRoot, runId, effectiveConfig, task, agent, options.baselineCheck ?? effectiveConfig.baselineCheck);
        completedItems += 1;
        emitProgress(options, {
            event: "agent_finish",
            completed: completedItems,
            total: runItems.length,
            taskId: task.id,
            agentName: agent.name,
            status: result.status,
            score: result.scores.final,
            solved: result.scores.solved
        });
        results.push(result);
        await writeResult(repoRoot, runId, result);
        await emitPluginHook(options, "onAgentFinish", { repoRoot, runId, task, agentName: agent.name, result });
        if (!effectiveConfig.keepWorktrees && result.worktreePath.length > 0) {
            await removeGitWorktree(repoRoot, result.worktreePath);
        }
    });
    const leaderboard = buildLeaderboard(results);
    const summary = {
        version: 1,
        repo: {
            name: await getRepoName(repoRoot),
            root: repoRoot,
            head: await getHeadSha(repoRoot)
        },
        run: {
            id: runId,
            startedAt,
            finishedAt: nowIso(),
            tasks: tasks.length,
            agents: agents.map((agent) => agent.name),
            evaluationMode: effectiveConfig.evaluationMode,
            baselineCheck: options.baselineCheck ?? effectiveConfig.baselineCheck
        },
        winner: winnerFromLeaderboard(leaderboard),
        leaderboard,
        results: results.sort((left, right) => left.taskId.localeCompare(right.taskId) || left.agentName.localeCompare(right.agentName))
    };
    await writeSummary(repoRoot, runId, summary);
    const reportPath = await generateReport(repoRoot, runId, summary, effectiveConfig.report);
    const publicReportPath = effectiveConfig.report.audience === "public"
        ? await generateReport(repoRoot, runId, summary, effectiveConfig.report, "public-report.html")
        : null;
    if (options.openReport ?? effectiveConfig.report.openAfterRun) {
        await openReport(repoRoot);
    }
    await emitPluginHook(options, "onRunFinish", { repoRoot, runId, summary });
    await fs.writeFile(repoRacerPath(repoRoot, "last-run.txt"), `${runId}\n${reportPath}\n${publicReportPath === null ? "" : `${publicReportPath}\n`}`, "utf8");
    return summary;
}
async function emitPluginHook(options, hookName, event) {
    for (const plugin of options.plugins ?? []) {
        const hook = plugin[hookName];
        if (hook !== undefined) {
            await hook(event);
        }
    }
}
function emitProgress(options, event) {
    if (!options.progress) {
        return;
    }
    if (options.logFormat === "json") {
        process.stderr.write(`${JSON.stringify({ type: "reporacer_progress", ...event })}\n`);
        return;
    }
    const prefix = `[${event.completed}/${event.total}]`;
    if (event.event === "agent_start") {
        process.stderr.write(`${prefix} ${event.taskId} ${event.agentName} running...\n`);
        return;
    }
    const result = `${prefix} ${event.taskId} ${event.agentName} ${event.status ?? "unknown"} score=${event.score ?? 0}`;
    process.stderr.write(`${options.verbose ? `${result} solved=${String(event.solved)}` : result}\n`);
}
async function runAgentSafely(repoRoot, runId, config, task, agent, baselineCheck) {
    try {
        return await runAgentTask({
            repoRoot,
            runId,
            config,
            task,
            agent,
            baselineCheck
        });
    }
    catch (error) {
        const message = redactSecrets(error instanceof Error ? error.message : String(error));
        const safeAgent = safeSegment(agent.name) || "agent";
        const logPath = runPath(repoRoot, runId, "logs", `${task.id}-${safeAgent}.internal-error.log`);
        await writeGeneratedFile(repoRoot, logPath, [`# internal error`, `task: ${task.id}`, `agent: ${agent.name}`, "", message].join("\n"));
        return {
            id: `${task.id}-${agent.name}`,
            taskId: task.id,
            agentName: agent.name,
            status: "internal_error",
            startedAt: nowIso(),
            finishedAt: nowIso(),
            durationMs: 0,
            worktreePath: "",
            promptPath: "",
            logPath,
            command: agent.command ?? agent.builtIn ?? agent.name,
            agentExitCode: null,
            agentError: message,
            install: null,
            baseline: null,
            tests: {
                skipped: true,
                command: config.testCommand,
                passed: false,
                exitCode: null,
                durationMs: 0,
                output: "Skipped because RepoRacer hit an internal per-result error.",
                phase: "agent"
            },
            hiddenTests: null,
            diff: {
                changedFiles: [],
                nameStatuses: [],
                insertions: 0,
                deletions: 0,
                changedLines: 0,
                patchPath: "",
                patchPreview: ""
            },
            risks: [
                {
                    level: "critical",
                    code: "INTERNAL_ERROR",
                    message
                }
            ],
            scores: {
                final: 0,
                tests: 0,
                hiddenTests: 0,
                patchSimilarity: 0,
                changedFilesOverlap: 0,
                diffSize: 0,
                minimality: 0,
                speed: 0,
                riskPenalty: 100,
                solved: false
            },
            hiddenTestPatchApplied: false
        };
    }
}
export function renderRunSummary(summary) {
    const rows = summary.leaderboard.map((row) => [
        row.agent,
        `${row.solved}/${row.total}`,
        String(row.averageScore),
        `${Math.round(row.testsPassedRate * 100)}%`,
        String(row.riskFlags),
        formatDuration(row.totalDurationMs)
    ]);
    return [
        "Benchmark complete.",
        "",
        renderTable(["Agent", "Solved", "Score", "Tests", "Risk", "Time"], rows),
        "",
        `Winner for this repo: ${summary.winner ?? "none"}`,
        `Report: ${repoRacerPath(summary.repo.root, "report.html")}`
    ].join("\n");
}
async function prepareRunDirectories(repoRoot, runId) {
    const current = currentPath(repoRoot);
    await removeGeneratedPath(repoRoot, current);
    await ensureDir(current);
    await ensureDir(repoRacerPath(repoRoot, "runs", runId));
    await ensureDir(repoRacerPath(repoRoot, "patches"));
}
async function writeConfigSnapshot(repoRoot, runId, config) {
    const redacted = redactSecrets(stringifyJson(config));
    await writeGeneratedFile(repoRoot, repoRacerPath(repoRoot, "run-config.snapshot.json"), redacted);
    await writeGeneratedFile(repoRoot, currentPath(repoRoot, "run-config.snapshot.json"), redacted);
    await writeGeneratedFile(repoRoot, repoRacerPath(repoRoot, "runs", runId, "run-config.snapshot.json"), redacted);
}
async function runLimited(items, limit, worker) {
    const executing = new Set();
    for (const item of items) {
        const promise = worker(item).finally(() => {
            executing.delete(promise);
        });
        executing.add(promise);
        if (executing.size >= limit) {
            await Promise.race(executing);
        }
    }
    await Promise.all(executing);
}
//# sourceMappingURL=run.js.map