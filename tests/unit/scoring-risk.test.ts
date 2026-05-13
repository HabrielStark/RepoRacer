import { describe, expect, it } from "vitest";
import { scanRisks } from "../../src/core/risk-scanner.js";
import { patchSimilarityScore, scoreResult } from "../../src/core/scorer.js";
import { RepoRacerConfig, RepoRacerTask } from "../../src/schemas/types.js";

const config: RepoRacerConfig = {
  version: 1,
  testCommand: "npm test",
  installCommand: null,
  maxTasks: 1,
  timeoutMinutesPerAgent: 1,
  parallelAgents: 1,
  parallelTasks: 1,
  baselineCheck: false,
  evaluationMode: "working-tree",
  keepWorktrees: false,
  commitSelection: {
    lookback: 10,
    minChangedFiles: 1,
    maxChangedFiles: 10,
    maxChangedLines: 500,
    excludeMergeCommits: true,
    excludePatterns: [],
    preferMessages: ["fix"]
  },
  hiddenTests: {
    enabled: false,
    includePatterns: ["tests/**"]
  },
  sandbox: {
    mode: "none",
    dockerImage: "node:20-bookworm",
    network: "default",
    cpus: 2,
    memory: "4g"
  },
  agents: [],
  riskRules: {
    failOnTestDeletion: true,
    failOnTestWeakening: true,
    failOnCiWeakening: true,
    failOnEnvFileChanges: true,
    warnOnLargeDiff: true,
    maxDiffLines: 10
  },
  report: {
    openAfterRun: false,
    includeLogs: true,
    includePatchPreview: true,
    audience: "private",
    redactReport: true,
    maxLogPreviewChars: 20000,
    maxPatchPreviewChars: 12000
  },
  ci: {
    generateGitHubAction: true,
    defaultAgents: ["fake-success"],
    defaultTasks: 1
  },
  share: {
    generateMarkdown: true,
    generateBadge: true,
    publicReportDefaults: true
  }
};

const task: RepoRacerTask = {
  id: "task-001",
  targetCommit: "target",
  parentCommit: "parent",
  message: "fix: app",
  prompt: "fix app",
  changedFiles: ["src/app.ts"],
  nameStatuses: [{ status: "M", path: "src/app.ts" }],
  insertions: 1,
  deletions: 1,
  changedLines: 2,
  qualityScore: 90,
  warnings: [],
  humanPatchPath: "/tmp/human.patch",
  hiddenTestPatchPath: null,
  hiddenTestFiles: [],
  createdAt: "now"
};

describe("risk scanning and scoring", () => {
  it("flags critical benchmark invalidation risks", () => {
    const risks = scanRisks(
      {
        changedFiles: [".env", ".reporacer/results.jsonl", ".github/workflows/ci.yml", "tests/app.test.ts"],
        nameStatuses: [{ status: "D", path: "tests/app.test.ts" }],
        insertions: 20,
        deletions: 1,
        changedLines: 21,
        patchPath: "/tmp/patch",
        patchPreview: "+continue-on-error: true\n+OPENAI_API_KEY=[REDACTED_API_KEY]\n+test.skip('important')"
      },
      config
    );

    expect(risks.map((risk) => risk.code)).toEqual(
      expect.arrayContaining([
        "ENV_FILE_CHANGED",
        "REPORACER_CHANGED",
        "CI_WEAKENED",
        "TEST_DELETED",
        "TEST_WEAKENED",
        "LARGE_DIFF",
        "SECRET_PATTERN"
      ])
    );
    expect(risks.some((risk) => risk.level === "critical")).toBe(true);
  });

  it("scans full patches for risks beyond the redacted preview", () => {
    const largePrefix = `+${"x".repeat(13000)}\n`;
    const fullPatch = `${largePrefix}+test.skip('late hidden failure')\n+OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\n`;
    const risks = scanRisks(
      {
        changedFiles: ["tests/app.test.ts"],
        nameStatuses: [{ status: "M", path: "tests/app.test.ts" }],
        insertions: 3,
        deletions: 0,
        changedLines: 3,
        patchPath: "/tmp/patch",
        patchPreview: largePrefix.slice(0, 12000)
      },
      config,
      fullPatch
    );

    expect(risks.map((risk) => risk.code)).toEqual(expect.arrayContaining(["TEST_WEAKENED", "SECRET_PATTERN"]));
  });

  it("scores passing similar patches above noop patches", () => {
    const humanPatch = "diff --git a/src/app.ts b/src/app.ts\n-old\n+fixed\n";
    const agentPatch = "diff --git a/src/app.ts b/src/app.ts\n-old\n+fixed\n";
    const noopPatch = "";

    expect(patchSimilarityScore(humanPatch, agentPatch)).toBeGreaterThan(patchSimilarityScore(humanPatch, noopPatch));

    const success = scoreResult({
      task,
      humanPatch,
      agentPatch,
      diff: {
        changedFiles: ["src/app.ts"],
        nameStatuses: [{ status: "M", path: "src/app.ts" }],
        insertions: 1,
        deletions: 1,
        changedLines: 2,
        patchPath: "/tmp/agent.patch",
        patchPreview: agentPatch
      },
      tests: {
        skipped: false,
        command: "npm test",
        passed: true,
        exitCode: 0,
        durationMs: 1,
        output: "ok",
        phase: "agent"
      },
      hiddenTests: null,
      risks: [],
      status: "completed",
      durationMs: 1000,
      timeoutMs: 60000
    });

    const noop = scoreResult({
      task,
      humanPatch,
      agentPatch: noopPatch,
      diff: {
        changedFiles: [],
        nameStatuses: [],
        insertions: 0,
        deletions: 0,
        changedLines: 0,
        patchPath: "/tmp/noop.patch",
        patchPreview: ""
      },
      tests: {
        skipped: false,
        command: "npm test",
        passed: false,
        exitCode: 1,
        durationMs: 1,
        output: "fail",
        phase: "agent"
      },
      hiddenTests: null,
      risks: [],
      status: "no_changes",
      durationMs: 1000,
      timeoutMs: 60000
    });

    expect(success.final).toBeGreaterThan(noop.final);
    expect(success.solved).toBe(true);
    expect(noop.solved).toBe(false);
  });
});
