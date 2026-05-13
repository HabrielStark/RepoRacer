import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { generateReport } from "../../src/core/report-generator.js";
import {
  buildDockerCommand,
  commandResultLog,
  posixShellQuote,
  redactSecrets,
  renderCommandTemplate,
  runCommand,
  shellQuote,
  stripAnsi
} from "../../src/core/process-safe.js";
import { renderReportHtml } from "../../src/report/template.js";
import { RepoRacerSummary } from "../../src/schemas/types.js";

describe("security helpers", () => {
  it("redacts common secret shapes without masking normal hashes", () => {
    const input = [
      "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456",
      "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
      "token: ghp_abcdefghijklmnopqrstuvwxyz123456",
      "aws=AKIA1234567890ABCDEF",
      "commit abc123def4567890"
    ].join("\n");

    const output = redactSecrets(input);

    expect(output).toContain("[REDACTED");
    expect(output).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(output).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz123456");
    expect(output).toContain("abc123def4567890");
  });

  it("does not inject prompt text into command templates", () => {
    const rendered = renderCommandTemplate("agent --prompt {{promptFile}} --task {{taskId}}", {
      promptFile: "C:/repo/.reporacer/runs/run-1/prompts/task.md",
      taskId: "task-001",
      promptText: "malicious && rm -rf"
    });

    expect(rendered).toContain("--prompt");
    expect(rendered).toContain("C:/repo/.reporacer/runs/run-1/prompts/task.md");
    expect(rendered).toContain("--task");
    expect(rendered).toContain("task-001");
    expect(rendered).not.toContain("malicious");
  });

  it("keeps templated command values inside one shell argument", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-command-"));
    const scriptPath = path.join(tempDir, "print-args.cjs");
    const marker = "REPO_RACER_INJECTION_CHECK";
    const attackerValue = `safe" & echo ${marker} & rem "`;
    await fs.writeFile(scriptPath, "process.stdout.write(JSON.stringify(process.argv.slice(2)));");

    const command = renderCommandTemplate("node {{scriptFile}} {{promptFile}}", {
      scriptFile: scriptPath,
      promptFile: attackerValue
    });
    const result = await runCommand(command, { cwd: tempDir, timeoutMs: 10_000 });
    const expectedArgs = [process.platform === "win32" ? attackerValue.replace(/\r?\n/g, " ") : attackerValue];
    const expectedStdout = JSON.stringify(expectedArgs);

    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe(expectedStdout);
    expect(result.output.trim()).toBe(expectedStdout);
  });

  it("covers shell quoting and command logging edge cases", () => {
    expect(shellQuote("")).toBe('""');
    expect(posixShellQuote("")).toBe("''");
    expect(posixShellQuote("can't")).toBe("'can'\\''t'");
    expect(stripAnsi("\u001b[31mred\u001b[0m")).toBe("red");
    expect(
      commandResultLog(
        {
          command: "echo OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456",
          cwd: "/tmp/repo",
          exitCode: null,
          stdout: "",
          stderr: "",
          output: "done",
          durationMs: 3,
          timedOut: false,
          failedToStart: false
        },
        "Agent"
      )
    ).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
  });

  it("captures failed shell command output without throwing", async () => {
    const command =
      process.platform === "win32"
        ? 'cmd /d /c "echo REPO_RACER_STDERR 1>&2 & exit /b 7"'
        : 'sh -c "echo REPO_RACER_STDERR >&2; exit 7"';
    const result = await runCommand(command, { cwd: process.cwd(), timeoutMs: 10_000 });

    expect(result.exitCode).toBe(7);
    expect(result.failedToStart).toBe(false);
    expect(result.stderr).toContain("REPO_RACER_STDERR");
    expect(result.output).toContain("REPO_RACER_STDERR");
  });

  it("renders Docker sandbox command with mounted workspace and network controls", () => {
    const command = buildDockerCommand("npm test && echo done", "C:/repo with spaces/project", {
      mode: "docker",
      dockerImage: "node:20-bookworm",
      network: "none",
      cpus: 2,
      memory: "4g"
    });

    expect(command).toContain("docker run --rm");
    expect(command).toContain("--network none");
    expect(command).toContain("--cap-drop ALL");
    expect(command).toContain("--security-opt no-new-privileges");
    expect(command).toContain("--pids-limit 512");
    expect(command).toContain("node:20-bookworm");
    expect(command).toContain("repo with spaces");
    expect(command).toContain("npm test");
    expect(command).not.toContain(`"'npm test`);
    expect(command).not.toContain(`"'npm test`);
  });

  it("escapes attacker-controlled report content", () => {
    const summary: RepoRacerSummary = {
      version: 1,
      repo: { name: "<script>alert(1)</script>", root: "/tmp/repo", head: "abc" },
      run: {
        id: "run-1",
        startedAt: "now",
        finishedAt: "later",
        tasks: 1,
        agents: ["evil"],
        evaluationMode: "working-tree",
        baselineCheck: false
      },
      winner: "<img src=x onerror=alert(1)> sk-abcdefghijklmnopqrstuvwxyz123456",
      leaderboard: [
        {
          agent: "<b>evil</b>",
          solved: 0,
          total: 1,
          averageScore: 0,
          testsPassedRate: 0,
          riskFlags: 1,
          totalDurationMs: 1
        }
      ],
      results: [
        {
          id: "task-001-evil",
          taskId: "task-001",
          agentName: "<script>agent()</script>",
          status: "risk_blocked",
          startedAt: "now",
          finishedAt: "later",
          durationMs: 1,
          worktreePath: "/tmp/worktree",
          promptPath: "/tmp/prompt",
          logPath: "/tmp/log",
          command: "evil",
          agentExitCode: 0,
          agentError: null,
          install: null,
          baseline: null,
          tests: {
            skipped: true,
            command: null,
            passed: false,
            exitCode: null,
            durationMs: 0,
            output: "<script>test()</script>",
            phase: "agent"
          },
          hiddenTests: null,
          diff: {
            changedFiles: ["src/<x>.ts"],
            nameStatuses: [{ status: "M", path: "src/<x>.ts" }],
            insertions: 1,
            deletions: 0,
            changedLines: 1,
            patchPath: "/tmp/patch",
            patchPreview: "+<script>patch()</script>"
          },
          risks: [{ level: "critical", code: "XSS", message: "<script>risk()</script>" }],
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
        }
      ]
    };

    const html = renderReportHtml(summary);

    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<script>patch()</script>");
    expect(html).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
  });

  it("honors report privacy toggles for logs and patch previews", () => {
    const summary: RepoRacerSummary = {
      version: 1,
      repo: { name: "repo", root: "/tmp/repo", head: "abc" },
      run: {
        id: "run-1",
        startedAt: "now",
        finishedAt: "later",
        tasks: 1,
        agents: ["agent"],
        evaluationMode: "working-tree",
        baselineCheck: false
      },
      winner: "agent",
      leaderboard: [
        { agent: "agent", solved: 1, total: 1, averageScore: 100, testsPassedRate: 1, riskFlags: 0, totalDurationMs: 1 }
      ],
      results: [
        {
          id: "task-001-agent",
          taskId: "task-001",
          agentName: "agent",
          status: "completed",
          startedAt: "now",
          finishedAt: "later",
          durationMs: 1,
          worktreePath: "/tmp/worktree",
          promptPath: "/tmp/prompt",
          logPath: "/tmp/log",
          command: "agent",
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
            output: "PRIVATE TEST LOG",
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
            patchPreview: "PRIVATE PATCH"
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
        }
      ]
    };

    const html = renderReportHtml(summary, {
      includeLogs: false,
      includePatchPreview: false,
      redactSecrets: true,
      maxLogPreviewChars: 20000,
      maxPatchPreviewChars: 12000
    });

    expect(html).not.toContain("PRIVATE TEST LOG");
    expect(html).not.toContain("PRIVATE PATCH");
  });

  it("enforces public report audience and report output containment", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-report-"));
    const summary: RepoRacerSummary = {
      version: 1,
      repo: { name: "repo", root: repoRoot, head: "abc" },
      run: {
        id: "run-1",
        startedAt: "now",
        finishedAt: "later",
        tasks: 1,
        agents: ["agent"],
        evaluationMode: "working-tree",
        baselineCheck: false
      },
      winner: "agent",
      leaderboard: [
        { agent: "agent", solved: 1, total: 1, averageScore: 100, testsPassedRate: 1, riskFlags: 0, totalDurationMs: 1 }
      ],
      results: [
        {
          id: "task-001-agent",
          taskId: "task-001",
          agentName: "agent",
          status: "completed",
          startedAt: "now",
          finishedAt: "later",
          durationMs: 1,
          worktreePath: "/tmp/worktree",
          promptPath: "/tmp/prompt",
          logPath: "/tmp/log",
          command: "agent",
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
            output: "PRIVATE TEST LOG",
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
            patchPreview: "PRIVATE PATCH"
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
        }
      ]
    };

    const reportPath = await generateReport(
      repoRoot,
      "run-1",
      summary,
      {
        openAfterRun: false,
        includeLogs: true,
        includePatchPreview: true,
        audience: "public",
        redactReport: false,
        maxLogPreviewChars: 20000,
        maxPatchPreviewChars: 12000
      },
      "public-report.html"
    );
    const report = await fs.readFile(reportPath, "utf8");

    expect(report).not.toContain("PRIVATE TEST LOG");
    expect(report).not.toContain("PRIVATE PATCH");
    await expect(generateReport(repoRoot, "run-1", summary, undefined, "../escape.html")).rejects.toThrow(
      /Invalid report output/
    );
  });

  it("rejects generated writes through .reporacer symlink or junction escapes", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-junction-"));
    const repoRoot = path.join(tempDir, "repo");
    const outside = path.join(tempDir, "outside");
    await fs.mkdir(repoRoot);
    await fs.mkdir(outside);
    await fs.symlink(outside, path.join(repoRoot, ".reporacer"), process.platform === "win32" ? "junction" : "dir");

    const summary: RepoRacerSummary = {
      version: 1,
      repo: { name: "repo", root: repoRoot, head: "abc" },
      run: {
        id: "run-1",
        startedAt: "now",
        finishedAt: "later",
        tasks: 0,
        agents: [],
        evaluationMode: "working-tree",
        baselineCheck: false
      },
      winner: null,
      leaderboard: [],
      results: []
    };

    await expect(generateReport(repoRoot, "run-1", summary)).rejects.toThrow(/symlink or junction/);
    await expect(fs.access(path.join(outside, "report.html"))).rejects.toThrow();
  });
});
