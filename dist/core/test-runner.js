import { commandResultLog, runCommand } from "./process-safe.js";
import { writeGeneratedFile } from "./fs-safe.js";
export async function runTests(repoRoot, worktreePath, command, timeoutMs, logPath, phase = "agent", sandbox) {
    if (command === null || command.trim().length === 0) {
        return {
            skipped: true,
            command: null,
            passed: false,
            exitCode: null,
            durationMs: 0,
            output: "No test command configured.",
            phase
        };
    }
    const result = await runCommand(command, {
        cwd: worktreePath,
        timeoutMs,
        ...(sandbox === undefined ? {} : { sandbox })
    });
    await writeGeneratedFile(repoRoot, logPath, commandResultLog(result, "test command"));
    return {
        skipped: false,
        command,
        passed: result.exitCode === 0 && !result.timedOut,
        exitCode: result.exitCode,
        durationMs: result.durationMs,
        output: result.output,
        phase
    };
}
//# sourceMappingURL=test-runner.js.map