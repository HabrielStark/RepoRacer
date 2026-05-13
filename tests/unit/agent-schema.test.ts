import { describe, expect, it } from "vitest";
import { renderAgentCommand } from "../../src/agents/custom.js";
import { isBuiltInAgent, isPresetAgent, resolveAgents } from "../../src/agents/types.js";
import { buildJudgePrompt } from "../../src/prompts/judge-prompt.js";
import { repoRacerResultSchema } from "../../src/schemas/result.schema.js";
import { repoRacerSummarySchema } from "../../src/schemas/report.schema.js";
import { RepoRacerResult, RepoRacerTask } from "../../src/schemas/types.js";
import { readJsonFile, readJsonlFile } from "../../src/utils/json.js";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const result: RepoRacerResult = {
  id: "task-001-custom",
  taskId: "task-001",
  agentName: "custom",
  status: "completed",
  startedAt: "now",
  finishedAt: "later",
  durationMs: 1,
  worktreePath: "/tmp/worktree",
  promptPath: "/tmp/prompt",
  logPath: "/tmp/log",
  command: "node agent.js",
  agentExitCode: 0,
  agentError: null,
  install: null,
  baseline: null,
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
  diff: {
    changedFiles: ["src/app.ts"],
    nameStatuses: [{ status: "M", path: "src/app.ts" }],
    insertions: 1,
    deletions: 1,
    changedLines: 2,
    patchPath: "/tmp/patch",
    patchPreview: "+fixed"
  },
  risks: [],
  scores: {
    final: 100,
    tests: 100,
    hiddenTests: 100,
    patchSimilarity: 100,
    changedFilesOverlap: 100,
    diffSize: 100,
    minimality: 100,
    speed: 100,
    riskPenalty: 0,
    solved: true
  },
  hiddenTestPatchApplied: false
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

describe("agent presets and runtime schemas", () => {
  it("classifies built-in, preset, configured, and missing agents", () => {
    expect(isBuiltInAgent("fake-success")).toBe(true);
    expect(isBuiltInAgent("codex")).toBe(false);
    expect(isPresetAgent("codex")).toBe(true);
    expect(isPresetAgent("local-agent")).toBe(false);

    const agents = resolveAgents(
      [
        { name: "fake-success", enabled: true, timeoutMinutes: 3 },
        { name: "local-agent", command: "node local.js {{promptFile}}", enabled: true }
      ],
      ["fake-success", "local-agent", "unknown-agent"]
    );

    expect(agents).toMatchObject([
      { name: "fake-success", source: "config", builtIn: "fake-success", timeoutMinutes: 3 },
      { name: "local-agent", source: "config", command: "node local.js {{promptFile}}" },
      { name: "unknown-agent", source: "missing", command: null }
    ]);
  });

  it("renders custom agent command variables through shell-safe templating", () => {
    const rendered = renderAgentCommand("agent --task {{taskId}} --prompt {{promptFile}} --unknown {{missing}}", {
      promptFile: "C:/repo path/task.md",
      taskId: "task-001",
      agentName: "local",
      worktreePath: "C:/repo path/worktree",
      testCommand: "npm test"
    });

    expect(rendered).toContain("task-001");
    expect(rendered).toContain("C:/repo path/task.md");
    expect(rendered).toContain("{{missing}}");
  });

  it("resolves real agent presets even when they are not in config", () => {
    const agents = resolveAgents([], ["codex", "claude", "gemini", "aider", "opencode"]);

    expect(agents.map((agent) => agent.source)).toEqual(["preset", "preset", "preset", "preset", "preset"]);
    expect(agents.map((agent) => agent.command)).toEqual([
      "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}",
      "claude -p < {{promptFile}}",
      "gemini --approval-mode auto_edit < {{promptFile}}",
      "aider --message-file {{promptFile}}",
      'opencode run --file {{promptFile}} "Follow the attached RepoRacer task prompt exactly."'
    ]);
  });

  it("validates complete result and summary contracts", () => {
    expect(repoRacerResultSchema.parse(result).id).toBe("task-001-custom");
    expect(
      repoRacerSummarySchema.parse({
        version: 1,
        repo: { name: "repo", root: "/tmp/repo", head: "abc" },
        run: {
          id: "run-1",
          startedAt: "now",
          finishedAt: "later",
          tasks: 1,
          agents: ["custom"],
          evaluationMode: "working-tree",
          baselineCheck: true
        },
        winner: "custom",
        leaderboard: [
          {
            agent: "custom",
            solved: 1,
            total: 1,
            averageScore: 100,
            testsPassedRate: 1,
            riskFlags: 0,
            totalDurationMs: 1
          }
        ],
        results: [result]
      }).winner
    ).toBe("custom");
  });

  it("builds a concrete judge prompt from a result", () => {
    expect(buildJudgePrompt({ task, result })).toContain("RepoRacer Result Review");
    expect(buildJudgePrompt({ task, result })).toContain("custom");
  });

  it("reads UTF-8 BOM JSON files produced by Windows editors", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-json-"));
    const jsonPath = path.join(dir, "config.json");
    const jsonlPath = path.join(dir, "items.jsonl");
    await fs.writeFile(jsonPath, `\uFEFF{"version":1}`, "utf8");
    await fs.writeFile(jsonlPath, `\uFEFF{"id":1}\n{"id":2}\n`, "utf8");

    expect(await readJsonFile<{ version: number }>(jsonPath)).toEqual({ version: 1 });
    expect(await readJsonlFile<{ id: number }>(jsonlPath)).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
