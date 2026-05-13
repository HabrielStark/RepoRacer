import { z } from "zod";
export const runStatusSchema = z.enum([
    "completed",
    "agent_failed",
    "test_failed",
    "timed_out",
    "no_changes",
    "risk_blocked",
    "internal_error"
]);
export const riskFlagSchema = z.object({
    level: z.enum(["low", "medium", "high", "critical"]),
    code: z.string(),
    message: z.string(),
    file: z.string().optional()
});
export const scoreBreakdownSchema = z.object({
    final: z.number().min(0).max(100),
    tests: z.number().min(0).max(100),
    hiddenTests: z.number().min(0).max(100),
    patchSimilarity: z.number().min(0).max(100),
    changedFilesOverlap: z.number().min(0).max(100),
    diffSize: z.number().min(0).max(100),
    minimality: z.number().min(0).max(100),
    speed: z.number().min(0).max(100),
    riskPenalty: z.number().min(0).max(100),
    solved: z.boolean()
});
export const nameStatusSchema = z.object({
    status: z.string(),
    path: z.string()
});
export const commandRunResultSchema = z.object({
    command: z.string(),
    cwd: z.string(),
    exitCode: z.number().int().nullable(),
    stdout: z.string(),
    stderr: z.string(),
    output: z.string(),
    durationMs: z.number().int().nonnegative(),
    timedOut: z.boolean(),
    failedToStart: z.boolean()
});
export const testRunResultSchema = z.object({
    skipped: z.boolean(),
    command: z.string().nullable(),
    passed: z.boolean(),
    exitCode: z.number().int().nullable(),
    durationMs: z.number().int().nonnegative(),
    output: z.string(),
    phase: z.enum(["baseline", "agent", "hidden"])
});
export const diffSummarySchema = z.object({
    changedFiles: z.array(z.string()),
    nameStatuses: z.array(nameStatusSchema),
    insertions: z.number().int().nonnegative(),
    deletions: z.number().int().nonnegative(),
    changedLines: z.number().int().nonnegative(),
    patchPath: z.string(),
    patchPreview: z.string()
});
export const repoRacerResultSchema = z.object({
    id: z.string(),
    taskId: z.string(),
    agentName: z.string(),
    status: runStatusSchema,
    startedAt: z.string(),
    finishedAt: z.string(),
    durationMs: z.number().int().nonnegative(),
    worktreePath: z.string(),
    promptPath: z.string(),
    logPath: z.string(),
    command: z.string(),
    agentExitCode: z.number().int().nullable(),
    agentError: z.string().nullable(),
    install: commandRunResultSchema.nullable(),
    baseline: testRunResultSchema.nullable(),
    tests: testRunResultSchema,
    hiddenTests: testRunResultSchema.nullable(),
    diff: diffSummarySchema,
    risks: z.array(riskFlagSchema),
    scores: scoreBreakdownSchema,
    hiddenTestPatchApplied: z.boolean()
});
//# sourceMappingURL=result.schema.js.map