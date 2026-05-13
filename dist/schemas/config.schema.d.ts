import { z } from "zod";
export declare const agentConfigSchema: z.ZodObject<{
    name: z.ZodString;
    command: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    timeoutMinutes: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const commitSelectionSchema: z.ZodObject<{
    lookback: z.ZodDefault<z.ZodNumber>;
    minChangedFiles: z.ZodDefault<z.ZodNumber>;
    maxChangedFiles: z.ZodDefault<z.ZodNumber>;
    maxChangedLines: z.ZodDefault<z.ZodNumber>;
    excludeMergeCommits: z.ZodDefault<z.ZodBoolean>;
    excludePatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    preferMessages: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const riskRulesSchema: z.ZodObject<{
    failOnTestDeletion: z.ZodDefault<z.ZodBoolean>;
    failOnTestWeakening: z.ZodDefault<z.ZodBoolean>;
    failOnCiWeakening: z.ZodDefault<z.ZodBoolean>;
    failOnEnvFileChanges: z.ZodDefault<z.ZodBoolean>;
    warnOnLargeDiff: z.ZodDefault<z.ZodBoolean>;
    maxDiffLines: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const reportConfigSchema: z.ZodObject<{
    openAfterRun: z.ZodDefault<z.ZodBoolean>;
    includeLogs: z.ZodDefault<z.ZodBoolean>;
    includePatchPreview: z.ZodDefault<z.ZodBoolean>;
    audience: z.ZodDefault<z.ZodEnum<{
        private: "private";
        public: "public";
    }>>;
    redactReport: z.ZodDefault<z.ZodBoolean>;
    maxLogPreviewChars: z.ZodDefault<z.ZodNumber>;
    maxPatchPreviewChars: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const hiddenTestsConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    includePatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const sandboxConfigSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        none: "none";
        docker: "docker";
    }>>;
    dockerImage: z.ZodDefault<z.ZodString>;
    network: z.ZodDefault<z.ZodEnum<{
        default: "default";
        none: "none";
    }>>;
    cpus: z.ZodDefault<z.ZodNumber>;
    memory: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const ciConfigSchema: z.ZodObject<{
    generateGitHubAction: z.ZodDefault<z.ZodBoolean>;
    defaultAgents: z.ZodDefault<z.ZodArray<z.ZodString>>;
    defaultTasks: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const shareConfigSchema: z.ZodObject<{
    generateMarkdown: z.ZodDefault<z.ZodBoolean>;
    generateBadge: z.ZodDefault<z.ZodBoolean>;
    publicReportDefaults: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const repoRacerConfigSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    testCommand: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    installCommand: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    maxTasks: z.ZodDefault<z.ZodNumber>;
    timeoutMinutesPerAgent: z.ZodDefault<z.ZodNumber>;
    parallelAgents: z.ZodDefault<z.ZodNumber>;
    parallelTasks: z.ZodDefault<z.ZodNumber>;
    baselineCheck: z.ZodDefault<z.ZodBoolean>;
    evaluationMode: z.ZodDefault<z.ZodEnum<{
        "working-tree": "working-tree";
        "hidden-target-tests": "hidden-target-tests";
    }>>;
    keepWorktrees: z.ZodDefault<z.ZodBoolean>;
    commitSelection: z.ZodObject<{
        lookback: z.ZodDefault<z.ZodNumber>;
        minChangedFiles: z.ZodDefault<z.ZodNumber>;
        maxChangedFiles: z.ZodDefault<z.ZodNumber>;
        maxChangedLines: z.ZodDefault<z.ZodNumber>;
        excludeMergeCommits: z.ZodDefault<z.ZodBoolean>;
        excludePatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
        preferMessages: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    hiddenTests: z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        includePatterns: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    sandbox: z.ZodObject<{
        mode: z.ZodDefault<z.ZodEnum<{
            none: "none";
            docker: "docker";
        }>>;
        dockerImage: z.ZodDefault<z.ZodString>;
        network: z.ZodDefault<z.ZodEnum<{
            default: "default";
            none: "none";
        }>>;
        cpus: z.ZodDefault<z.ZodNumber>;
        memory: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>;
    agents: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        command: z.ZodOptional<z.ZodString>;
        enabled: z.ZodDefault<z.ZodBoolean>;
        timeoutMinutes: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>>;
    riskRules: z.ZodObject<{
        failOnTestDeletion: z.ZodDefault<z.ZodBoolean>;
        failOnTestWeakening: z.ZodDefault<z.ZodBoolean>;
        failOnCiWeakening: z.ZodDefault<z.ZodBoolean>;
        failOnEnvFileChanges: z.ZodDefault<z.ZodBoolean>;
        warnOnLargeDiff: z.ZodDefault<z.ZodBoolean>;
        maxDiffLines: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    report: z.ZodObject<{
        openAfterRun: z.ZodDefault<z.ZodBoolean>;
        includeLogs: z.ZodDefault<z.ZodBoolean>;
        includePatchPreview: z.ZodDefault<z.ZodBoolean>;
        audience: z.ZodDefault<z.ZodEnum<{
            private: "private";
            public: "public";
        }>>;
        redactReport: z.ZodDefault<z.ZodBoolean>;
        maxLogPreviewChars: z.ZodDefault<z.ZodNumber>;
        maxPatchPreviewChars: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    ci: z.ZodObject<{
        generateGitHubAction: z.ZodDefault<z.ZodBoolean>;
        defaultAgents: z.ZodDefault<z.ZodArray<z.ZodString>>;
        defaultTasks: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    share: z.ZodObject<{
        generateMarkdown: z.ZodDefault<z.ZodBoolean>;
        generateBadge: z.ZodDefault<z.ZodBoolean>;
        publicReportDefaults: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
