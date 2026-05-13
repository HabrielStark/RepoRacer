import path from "node:path";
import { repoRacerPath } from "../utils/paths.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";
export function renderConfigJsonSchema() {
    return `${JSON.stringify({
        $schema: "https://json-schema.org/draft/2020-12/schema",
        title: "RepoRacer Config",
        type: "object",
        required: ["version"],
        properties: {
            version: { const: 1 },
            testCommand: { type: ["string", "null"] },
            installCommand: { type: ["string", "null"] },
            maxTasks: { type: "integer", minimum: 1, maximum: 100 },
            timeoutMinutesPerAgent: { type: "integer", minimum: 1 },
            parallelAgents: { type: "integer", minimum: 1 },
            parallelTasks: { type: "integer", minimum: 1 },
            baselineCheck: { type: "boolean" },
            evaluationMode: { enum: ["working-tree", "hidden-target-tests"] },
            keepWorktrees: { type: "boolean" },
            agents: {
                type: "array",
                items: {
                    type: "object",
                    required: ["name", "enabled"],
                    properties: {
                        name: { type: "string" },
                        command: { type: "string" },
                        enabled: { type: "boolean" },
                        timeoutMinutes: { type: "integer", minimum: 1 }
                    },
                    additionalProperties: false
                }
            },
            commitSelection: {
                type: "object",
                properties: {
                    lookback: { type: "integer", minimum: 1, maximum: 5000 },
                    minChangedFiles: { type: "integer", minimum: 0 },
                    maxChangedFiles: { type: "integer", minimum: 1, maximum: 500 },
                    maxChangedLines: { type: "integer", minimum: 1, maximum: 50000 },
                    excludeMergeCommits: { type: "boolean" },
                    excludePatterns: { type: "array", items: { type: "string" } },
                    preferMessages: { type: "array", items: { type: "string" } }
                },
                additionalProperties: false
            },
            hiddenTests: {
                type: "object",
                properties: {
                    enabled: { type: "boolean" },
                    includePatterns: { type: "array", items: { type: "string" } }
                },
                additionalProperties: false
            },
            sandbox: {
                type: "object",
                properties: {
                    mode: { enum: ["none", "docker"] },
                    dockerImage: { type: "string" },
                    network: { enum: ["default", "none"] },
                    cpus: { type: "number" },
                    memory: { type: "string" }
                },
                additionalProperties: false
            },
            report: {
                type: "object",
                properties: {
                    openAfterRun: { type: "boolean" },
                    audience: { enum: ["private", "public"] },
                    redactReport: { type: "boolean" },
                    includeLogs: { type: "boolean" },
                    includePatchPreview: { type: "boolean" },
                    maxLogPreviewChars: { type: "integer", minimum: 1, maximum: 1000000 },
                    maxPatchPreviewChars: { type: "integer", minimum: 1, maximum: 1000000 }
                },
                additionalProperties: false
            },
            riskRules: {
                type: "object",
                properties: {
                    failOnTestDeletion: { type: "boolean" },
                    failOnTestWeakening: { type: "boolean" },
                    failOnCiWeakening: { type: "boolean" },
                    failOnEnvFileChanges: { type: "boolean" },
                    warnOnLargeDiff: { type: "boolean" },
                    maxDiffLines: { type: "integer", minimum: 1, maximum: 100000 }
                },
                additionalProperties: false
            },
            ci: {
                type: "object",
                properties: {
                    generateGitHubAction: { type: "boolean" },
                    defaultAgents: { type: "array", items: { type: "string" } },
                    defaultTasks: { type: "integer", minimum: 1, maximum: 100 }
                },
                additionalProperties: false
            },
            share: {
                type: "object",
                properties: {
                    generateMarkdown: { type: "boolean" },
                    generateBadge: { type: "boolean" },
                    publicReportDefaults: { type: "boolean" }
                },
                additionalProperties: false
            }
        },
        additionalProperties: false
    }, null, 2)}\n`;
}
export async function writeConfigJsonSchema(repoRoot) {
    const target = repoRacerPath(repoRoot, "config.schema.json");
    await ensureDir(path.dirname(target));
    await writeGeneratedFile(repoRoot, target, renderConfigJsonSchema());
    return target;
}
//# sourceMappingURL=schema-generator.js.map