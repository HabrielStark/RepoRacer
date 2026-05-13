import { mkdir, cp, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { renderReportHtml } from "../dist/report/template.js";

const root = process.cwd();
const outDir = path.join(root, ".reporacer-demo-site");
const docsDist = path.join(root, "docs", ".vitepress", "dist");

const summary = {
  version: 1,
  repo: {
    name: "buggy-todo-app",
    root: "/demo/buggy-todo-app",
    head: "demo"
  },
  run: {
    id: "demo-run",
    startedAt: "2026-05-12T00:00:00.000Z",
    finishedAt: "2026-05-12T00:02:00.000Z",
    tasks: 10,
    agents: ["codex", "claude", "fake-success"],
    evaluationMode: "hidden-target-tests",
    baselineCheck: true
  },
  winner: "codex",
  leaderboard: [
    {
      agent: "codex",
      solved: 8,
      total: 10,
      averageScore: 87,
      testsPassedRate: 0.9,
      riskFlags: 0,
      totalDurationMs: 84000
    },
    {
      agent: "claude",
      solved: 7,
      total: 10,
      averageScore: 82,
      testsPassedRate: 0.8,
      riskFlags: 1,
      totalDurationMs: 91000
    },
    {
      agent: "fake-success",
      solved: 10,
      total: 10,
      averageScore: 100,
      testsPassedRate: 1,
      riskFlags: 0,
      totalDurationMs: 1000
    }
  ],
  results: [
    {
      id: "task-001-codex",
      taskId: "task-001",
      agentName: "codex",
      status: "completed",
      startedAt: "2026-05-12T00:00:00.000Z",
      finishedAt: "2026-05-12T00:00:08.000Z",
      durationMs: 8000,
      worktreePath: "",
      promptPath: "",
      logPath: "",
      command: "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < <prompt>",
      agentExitCode: 0,
      agentError: null,
      install: null,
      baseline: null,
      tests: {
        skipped: false,
        command: "pnpm test",
        passed: true,
        exitCode: 0,
        durationMs: 1200,
        output: "ok",
        phase: "agent"
      },
      hiddenTests: {
        skipped: false,
        command: "pnpm test",
        passed: true,
        exitCode: 0,
        durationMs: 1200,
        output: "ok",
        phase: "hidden"
      },
      diff: {
        changedFiles: ["src/todos.ts"],
        nameStatuses: [{ status: "M", path: "src/todos.ts" }],
        insertions: 8,
        deletions: 2,
        changedLines: 10,
        patchPath: "",
        patchPreview: ""
      },
      risks: [],
      scores: {
        final: 91,
        tests: 100,
        hiddenTests: 100,
        patchSimilarity: 83,
        changedFilesOverlap: 100,
        diffSize: 100,
        minimality: 96,
        speed: 90,
        riskPenalty: 0,
        solved: true
      },
      hiddenTestPatchApplied: true
    }
  ]
};

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
await cp(docsDist, outDir, { recursive: true });
await writeFile(
  path.join(outDir, "demo-report.html"),
  renderReportHtml(summary, {
    includeLogs: false,
    includePatchPreview: false,
    redactSecrets: true,
    maxLogPreviewChars: 20000,
    maxPatchPreviewChars: 12000
  })
);
