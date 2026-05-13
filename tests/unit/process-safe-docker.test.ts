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
});
