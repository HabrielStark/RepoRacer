import { promises as fs } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { cleanRepoRacer } from "../../src/commands/clean.js";
import { generateCiTemplate } from "../../src/commands/ci.js";
import { runDoctor } from "../../src/commands/doctor.js";
import { initRepoRacer } from "../../src/commands/init.js";
import { regenerateReport } from "../../src/commands/report.js";
import { runRepoRacer } from "../../src/commands/run.js";
import { generateConfigSchema } from "../../src/commands/schema.js";
import { generateShareArtifacts } from "../../src/commands/share.js";
import { selectTasks } from "../../src/commands/tasks.js";
import { createBenchmarkFixtureRepo, createHiddenTestsFixtureRepo, git } from "../helpers/git-fixture.js";

describe("RepoRacer integration flow", () => {
  it("initializes config, mines tasks, runs fake agents, writes report, and cleans generated data", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const configPath = await initRepoRacer({ cwd: repo.root, force: true });
    const config = JSON.parse(await fs.readFile(configPath, "utf8")) as Record<string, unknown>;
    config.installCommand = null;
    config.testCommand = "node test.js";
    config.baselineCheck = false;
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    await expectSamePath(configPath, path.join(repo.root, ".reporacer", "config.json"));

    const selected = await selectTasks({ cwd: repo.root, maxTasks: 1 });
    expect(selected.tasks).toHaveLength(1);
    expect(selected.tasks[0]?.targetCommit).toBe(repo.targetCommit);
    expect(selected.tasks[0]?.parentCommit).toBe(repo.initialCommit);

    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["fake-success", "fake-noop", "fake-risky"],
      maxTasks: 1
    });

    const success = summary.results.find((result) => result.agentName === "fake-success");
    const noop = summary.results.find((result) => result.agentName === "fake-noop");
    const risky = summary.results.find((result) => result.agentName === "fake-risky");

    expect(success?.status).toBe("completed");
    expect(success?.scores.solved).toBe(true);
    expect(noop?.status).toBe("no_changes");
    expect(noop?.scores.solved).toBe(false);
    expect(risky?.status).toBe("risk_blocked");
    expect(risky?.risks.map((risk) => risk.code)).toContain("ENV_FILE_CHANGED");
    expect(success?.scores.final ?? 0).toBeGreaterThan(noop?.scores.final ?? 100);

    const reportPath = path.join(repo.root, ".reporacer", "report.html");
    const report = await fs.readFile(reportPath, "utf8");
    expect(report).toContain("RepoRacer");
    expect(report).toContain("fake-success");
    expect(report).not.toContain("sk-fake12345678901234567890");

    const sourceText = await fs.readFile(path.join(repo.root, "src", "app.txt"), "utf8");
    expect(sourceText).toBe("fixed\n");

    const regenerated = await regenerateReport(repo.root);
    await expectSamePath(regenerated, reportPath);

    const ciPath = await generateCiTemplate(repo.root);
    const ci = await fs.readFile(ciPath, "utf8");
    expect(ci).toContain("RepoRacer");
    expect(ci).toContain("actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5");
    expect(ci).toContain("npx --yes reporacer@1.0.0");

    const schemaPath = await generateConfigSchema(repo.root);
    const schema = await fs.readFile(schemaPath, "utf8");
    expect(schema).toContain("RepoRacer Config");
    expect(schema).toContain("hiddenTests");

    const share = await generateShareArtifacts(repo.root);
    expect(share.markdownPath).not.toBeNull();
    expect(share.badgePath).not.toBeNull();
    expect(share.publicReportPath).not.toBeNull();
    if (share.markdownPath === null || share.badgePath === null || share.publicReportPath === null) {
      throw new Error("Expected share artifacts to be generated.");
    }
    expect(await fs.readFile(share.markdownPath, "utf8")).toContain("Winner");
    expect(await fs.readFile(share.badgePath, "utf8")).toContain("<svg");
    expect(share.publicReportPath).toContain("public-report.html");
    expect(await fs.readFile(share.publicReportPath, "utf8")).not.toContain("Patch preview");

    const cleanedCurrent = await cleanRepoRacer({ cwd: repo.root });
    expect(cleanedCurrent).toContain(path.join(".reporacer", "current"));
    expect(await exists(reportPath)).toBe(true);

    const removed = await cleanRepoRacer({ cwd: repo.root, all: true });
    expect(removed).toContain(path.join(".reporacer", "report.html"));
    expect(removed).toContain(path.join(".reporacer", "public-report.html"));
    expect(removed).toContain(path.join(".reporacer", "share.md"));
    expect(removed).toContain(path.join(".reporacer", "badge.svg"));
    expect(removed).toContain(path.join(".reporacer", "github-action.yml"));
    expect(removed).toContain(path.join(".reporacer", "config.schema.json"));
    expect(await exists(reportPath)).toBe(false);
    expect(await exists(path.join(repo.root, ".reporacer", "config.json"))).toBe(true);
  });

  it("classifies fake-timeout as timed_out", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["fake-timeout"],
      maxTasks: 1
    });

    expect(summary.results[0]?.status).toBe("timed_out");
    expect(summary.results[0]?.scores.solved).toBe(false);
  });

  it("emits stable public plugin hook events for programmatic integrations", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const events: string[] = [];
    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["fake-noop"],
      maxTasks: 1,
      plugins: [
        {
          onRunStart: (event) => {
            events.push(`run:${event.runId}:${event.agents.join(",")}`);
          },
          onTasksMined: (event) => {
            events.push(`tasks:${event.tasks.length}:${event.tasks[0]?.id ?? "none"}`);
          },
          onAgentStart: (event) => {
            events.push(`start:${event.task.id}:${event.agentName}`);
          },
          onAgentFinish: (event) => {
            events.push(`finish:${event.result.taskId}:${event.result.agentName}:${event.result.status}`);
          },
          onRunFinish: (event) => {
            events.push(`finish-run:${event.summary.results.length}:${event.summary.winner ?? "none"}`);
          }
        }
      ]
    });

    expect(summary.results).toHaveLength(1);
    expect(events).toEqual([
      expect.stringMatching(/^run:run-/),
      "tasks:1:task-001",
      "start:task-001:fake-noop",
      "finish:task-001:fake-noop:no_changes",
      "finish-run:1:fake-noop"
    ]);
  });

  it("runs a configured custom agent command", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["custom"],
      maxTasks: 1
    });

    const custom = summary.results[0];
    expect(custom?.agentName).toBe("custom");
    expect(custom?.status).toBe("completed");
    expect(custom?.tests.passed).toBe(true);
    expect(custom?.scores.solved).toBe(true);
  });

  it("runs a configured custom agent command when repository path contains spaces", async () => {
    const repo = await createBenchmarkFixtureRepo("reporacer fixture with spaces ");
    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["custom"],
      maxTasks: 1
    });

    const custom = summary.results[0];
    expect(custom?.agentName).toBe("custom");
    expect(custom?.status).toBe("completed");
    expect(custom?.tests.passed).toBe(true);
    expect(custom?.scores.solved).toBe(true);
  });

  it("fails dirty worktrees by default but allows explicit override", async () => {
    const repo = await createBenchmarkFixtureRepo();
    await fs.writeFile(path.join(repo.root, "src", "dirty.txt"), "dirty\n", "utf8");

    await expect(runRepoRacer({ repoRoot: repo.root, agents: ["fake-noop"], maxTasks: 1 })).rejects.toThrow(
      /Working tree has uncommitted changes/
    );

    await git(repo.root, ["add", "src/dirty.txt"]);
    await git(repo.root, ["commit", "-m", "chore: add dirty file"]);
    const summary = await runRepoRacer({ repoRoot: repo.root, agents: ["fake-noop"], maxTasks: 1 });
    expect(summary.results[0]?.status).toBe("no_changes");
  });

  it("reports repository-shape diagnostics for shallow clones, submodules, and Git LFS", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const cleanDoctor = await runDoctor(repo.root);

    expect(cleanDoctor).toContain("Shallow clone");
    expect(cleanDoctor).toContain("false");
    expect(cleanDoctor).toContain("Submodules");
    expect(cleanDoctor).toContain("none");
    expect(cleanDoctor).toContain("Git LFS");

    await fs.writeFile(
      path.join(repo.root, ".gitmodules"),
      '[submodule "libs/demo"]\n\tpath = libs/demo\n\turl = https://example.invalid/demo.git\n',
      "utf8"
    );
    await fs.writeFile(path.join(repo.root, ".gitattributes"), "*.bin filter=lfs diff=lfs merge=lfs -text\n", "utf8");

    const doctor = await runDoctor(repo.root);

    expect(doctor).toContain("libs/demo");
    expect(doctor).toContain("tracked pattern");
    expect(doctor).toMatch(/git-lfs missing|ok/);
  });

  it("does not count install-only untracked files as agent changes", async () => {
    const repo = await createBenchmarkFixtureRepo();
    const configPath = path.join(repo.root, ".reporacer", "config.json");
    const config = JSON.parse(await fs.readFile(configPath, "utf8")) as Record<string, unknown>;
    config.installCommand = "node scripts/install-side-effect.cjs";
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["fake-noop"],
      maxTasks: 1
    });

    const result = summary.results[0];
    expect(result?.status).toBe("no_changes");
    expect(result?.diff.changedFiles).toEqual([]);
  });

  it("runs hidden target tests after the agent patch without exposing them in the agent diff", async () => {
    const repo = await createHiddenTestsFixtureRepo();
    const selected = await selectTasks({ cwd: repo.root, maxTasks: 1 });

    expect(selected.tasks[0]?.hiddenTestFiles).toContain("test.js");
    expect(selected.tasks[0]?.hiddenTestPatchPath).not.toBeNull();

    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["custom", "fake-success", "fake-noop"],
      maxTasks: 1,
      evaluationMode: "hidden-target-tests",
      baselineCheck: true,
      parallelAgents: 1
    });

    const custom = summary.results.find((result) => result.agentName === "custom");
    const success = summary.results.find((result) => result.agentName === "fake-success");
    const noop = summary.results.find((result) => result.agentName === "fake-noop");

    expect(custom?.hiddenTestPatchApplied).toBe(true);
    expect(custom?.hiddenTests?.passed).toBe(true);
    expect(custom?.diff.changedFiles).toEqual(["src/app.txt"]);
    expect(custom?.scores.solved).toBe(true);
    expect(success?.hiddenTestPatchApplied).toBe(true);
    expect(success?.hiddenTests?.passed).toBe(true);
    expect(success?.diff.changedFiles).toEqual(["src/app.txt"]);
    expect(success?.scores.solved).toBe(true);
    expect(noop?.hiddenTests?.passed).toBe(false);
    expect(noop?.scores.solved).toBe(false);
  });

  it("records hidden test patch conflicts without aborting the rest of the benchmark", async () => {
    const repo = await createHiddenTestsFixtureRepo();
    const configPath = path.join(repo.root, ".reporacer", "config.json");
    const config = JSON.parse(await fs.readFile(configPath, "utf8")) as Record<string, unknown>;
    config.agents = [
      { name: "custom", command: "node scripts/agent.cjs {{promptFile}}", enabled: true },
      { name: "test-mutator", command: "node scripts/test-mutating-agent.cjs {{promptFile}}", enabled: true }
    ];
    await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

    const summary = await runRepoRacer({
      repoRoot: repo.root,
      agents: ["custom", "test-mutator"],
      maxTasks: 1,
      evaluationMode: "hidden-target-tests",
      baselineCheck: true
    });

    const custom = summary.results.find((result) => result.agentName === "custom");
    const mutator = summary.results.find((result) => result.agentName === "test-mutator");

    expect(custom?.status).toBe("completed");
    expect(custom?.scores.solved).toBe(true);
    expect(mutator?.status).toBe("internal_error");
    expect(mutator?.tests.output).toContain("Hidden target-test patch failed to apply");
    expect(summary.results).toHaveLength(2);
  });
});

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function expectSamePath(actual: string, expected: string): Promise<void> {
  expect(await fs.realpath(actual)).toBe(await fs.realpath(expected));
}
