import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

const execaCommand = vi.fn((command: string) =>
  Promise.resolve({
    all: `ran: ${command}`,
    stdout: "ok",
    stderr: "",
    exitCode: 0,
    timedOut: false
  })
);

vi.mock("execa", () => ({
  execaCommand
}));

const { runCommand } = await import("../../src/core/process-safe.js");

describe("docker sandbox command execution", () => {
  const tempDirs: string[] = [];

  afterEach(async () => {
    execaCommand.mockClear();
    for (const dir of tempDirs.splice(0)) {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it("runs docker commands through a temporary script and removes empty generated parents", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-docker-script-"));
    tempDirs.push(repoRoot);

    const result = await runCommand('node -e "console.log(40 + 2)"', {
      cwd: repoRoot,
      sandbox: {
        mode: "docker",
        dockerImage: "node:24-bookworm-slim",
        network: "none",
        cpus: 1,
        memory: "256m"
      },
      timeoutMs: 10_000
    });

    const renderedCommand = execaCommand.mock.calls[0]?.[0] ?? "";
    expect(result.exitCode).toBe(0);
    expect(renderedCommand).toContain("docker run --rm");
    expect(renderedCommand).toContain("sh -lc");
    expect(renderedCommand).toContain(".reporacer/tmp/docker-commands/");
    expect(renderedCommand).not.toContain('node -e "console.log(40 + 2)"');
    await expect(fs.access(path.join(repoRoot, ".reporacer"))).rejects.toThrow();
  });

  it("normalizes failed process starts and redacts captured secret output", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-process-failure-"));
    tempDirs.push(repoRoot);
    execaCommand.mockRejectedValueOnce({
      stdout: "OPENAI_API_KEY=sk-abcdefghijklmnopqrstuvwxyz123456\n",
      stderr: ["fatal: nope\n"],
      all: undefined,
      message: "spawn failed",
      timedOut: false,
      exitCode: null
    });

    const result = await runCommand("agent --run", { cwd: repoRoot, timeoutMs: 1_000 });

    expect(result.exitCode).toBeNull();
    expect(result.failedToStart).toBe(true);
    expect(result.stdout).toContain("OPENAI_API_KEY=[REDACTED]");
    expect(result.stderr).toContain("spawn failed");
    expect(result.output).toContain("OPENAI_API_KEY=[REDACTED]");
  });

  it("normalizes timed-out rejected process results without marking them as start failures", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-process-timeout-"));
    tempDirs.push(repoRoot);
    execaCommand.mockRejectedValueOnce({
      stdout: "",
      stderr: "",
      all: "timed out",
      message: "timeout",
      timedOut: true,
      exitCode: null
    });

    const result = await runCommand("agent --slow", { cwd: repoRoot, timeoutMs: 1 });

    expect(result.timedOut).toBe(true);
    expect(result.failedToStart).toBe(false);
    expect(result.output).toBe("timed out");
  });
});
