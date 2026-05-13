import { z } from "zod";
export const agentConfigSchema = z.object({
    name: z.string().trim().min(1),
    command: z.string().trim().min(1).optional(),
    enabled: z.boolean().default(true),
    timeoutMinutes: z.number().int().positive().max(240).optional()
});
export const commitSelectionSchema = z.object({
    lookback: z.number().int().positive().max(5000).default(100),
    minChangedFiles: z.number().int().nonnegative().default(1),
    maxChangedFiles: z.number().int().positive().max(500).default(8),
    maxChangedLines: z.number().int().positive().max(50000).default(500),
    excludeMergeCommits: z.boolean().default(true),
    excludePatterns: z.array(z.string().trim().min(1)).default([]),
    preferMessages: z.array(z.string().trim().min(1)).default([])
});
export const riskRulesSchema = z.object({
    failOnTestDeletion: z.boolean().default(true),
    failOnTestWeakening: z.boolean().default(true),
    failOnCiWeakening: z.boolean().default(true),
    failOnEnvFileChanges: z.boolean().default(true),
    warnOnLargeDiff: z.boolean().default(true),
    maxDiffLines: z.number().int().positive().max(100000).default(800)
});
export const reportConfigSchema = z.object({
    openAfterRun: z.boolean().default(false),
    includeLogs: z.boolean().default(true),
    includePatchPreview: z.boolean().default(true),
    audience: z.enum(["private", "public"]).default("private"),
    redactReport: z.boolean().default(true),
    maxLogPreviewChars: z.number().int().positive().max(1000000).default(20000),
    maxPatchPreviewChars: z.number().int().positive().max(1000000).default(12000)
});
export const hiddenTestsConfigSchema = z.object({
    enabled: z.boolean().default(false),
    includePatterns: z
        .array(z.string().trim().min(1))
        .default(["**/*.test.ts", "**/*.spec.ts", "**/*.test.js", "**/*.spec.js", "tests/**", "test/**", "**/*_test.py"])
});
export const sandboxConfigSchema = z.object({
    mode: z.enum(["none", "docker"]).default("none"),
    dockerImage: z.string().trim().min(1).default("node:20-bookworm"),
    network: z.enum(["default", "none"]).default("default"),
    cpus: z.number().positive().max(64).default(2),
    memory: z.string().trim().min(1).default("4g")
});
export const ciConfigSchema = z.object({
    generateGitHubAction: z.boolean().default(true),
    defaultAgents: z.array(z.string().trim().min(1)).default(["fake-success", "fake-noop"]),
    defaultTasks: z.number().int().positive().max(100).default(5)
});
export const shareConfigSchema = z.object({
    generateMarkdown: z.boolean().default(true),
    generateBadge: z.boolean().default(true),
    publicReportDefaults: z.boolean().default(true)
});
export const repoRacerConfigSchema = z.object({
    version: z.literal(1),
    testCommand: z.string().trim().min(1).nullable().default(null),
    installCommand: z.string().trim().min(1).nullable().default(null),
    maxTasks: z.number().int().positive().max(100).default(10),
    timeoutMinutesPerAgent: z.number().int().positive().max(240).default(12),
    parallelAgents: z.number().int().positive().max(16).default(2),
    parallelTasks: z.number().int().positive().max(16).default(1),
    baselineCheck: z.boolean().default(true),
    evaluationMode: z.enum(["working-tree", "hidden-target-tests"]).default("working-tree"),
    keepWorktrees: z.boolean().default(false),
    commitSelection: commitSelectionSchema,
    hiddenTests: hiddenTestsConfigSchema,
    sandbox: sandboxConfigSchema,
    agents: z.array(agentConfigSchema).default([]),
    riskRules: riskRulesSchema,
    report: reportConfigSchema,
    ci: ciConfigSchema,
    share: shareConfigSchema
});
//# sourceMappingURL=config.schema.js.map