import { execa } from "execa";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildCommitCandidate,
  gitLfsDiagnostics,
  isShallowRepository,
  listConfiguredSubmodules,
  listRecentCommitHeaders
} from "../../src/core/git.js";

describe("git repository diagnostics", () => {
  it("detects shallow status, configured submodules, and Git LFS attributes", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-git-diagnostics-"));
    await git(repoRoot, ["init"]);
    await git(repoRoot, ["config", "user.email", "test@example.com"]);
    await git(repoRoot, ["config", "user.name", "RepoRacer Test"]);
    await fs.mkdir(path.join(repoRoot, "assets", "raw"), { recursive: true });
    await fs.writeFile(path.join(repoRoot, "README.md"), "diagnostics\n", "utf8");
    await fs.writeFile(path.join(repoRoot, ".gitattributes"), "*.bin filter=lfs diff=lfs merge=lfs -text\n", "utf8");
    await fs.writeFile(
      path.join(repoRoot, "assets", ".gitattributes"),
      "*.png filter=lfs diff=lfs merge=lfs -text\n",
      "utf8"
    );
    await fs.writeFile(
      path.join(repoRoot, ".gitmodules"),
      '[submodule "libs/demo"]\n\tpath = libs/demo\n\turl = https://example.invalid/demo.git\n',
      "utf8"
    );
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "chore: diagnostics fixture"]);

    await fs.mkdir(path.join(repoRoot, ".reporacer", "ignored"), { recursive: true });
    await fs.writeFile(
      path.join(repoRoot, ".reporacer", "ignored", ".gitattributes"),
      "*.secret filter=lfs diff=lfs merge=lfs -text\n",
      "utf8"
    );

    await expect(isShallowRepository(repoRoot)).resolves.toBe(false);
    await expect(listConfiguredSubmodules(repoRoot)).resolves.toEqual(["libs/demo"]);
    await expect(gitLfsDiagnostics(repoRoot)).resolves.toMatchObject({
      trackedPatterns: ["*.bin", "assets/*.png"]
    });
  });

  it("treats repositories without .gitmodules or LFS attributes as plain repositories", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-plain-git-"));
    await git(repoRoot, ["init"]);
    await git(repoRoot, ["config", "user.email", "test@example.com"]);
    await git(repoRoot, ["config", "user.name", "RepoRacer Test"]);
    await fs.writeFile(path.join(repoRoot, "README.md"), "plain\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "chore: plain fixture"]);

    await expect(listConfiguredSubmodules(repoRoot)).resolves.toEqual([]);
    await expect(gitLfsDiagnostics(repoRoot)).resolves.toMatchObject({
      trackedPatterns: []
    });
  });

  it("cleans inherited Git hook environment and records weak-task warnings", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-hook-env-"));
    await git(repoRoot, ["init"]);
    await git(repoRoot, ["config", "user.email", "test@example.com"]);
    await git(repoRoot, ["config", "user.name", "RepoRacer Test"]);
    await fs.writeFile(path.join(repoRoot, "app.test.js"), "console.log('base');\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "chore: base fixture"]);
    await fs.writeFile(path.join(repoRoot, "app.test.js"), "console.log('changed');\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "fix"]);

    const previousGitDir = process.env.GIT_DIR;
    const previousGitWorkTree = process.env.GIT_WORK_TREE;
    const previousGitIndex = process.env.GIT_INDEX_FILE;
    try {
      process.env.GIT_DIR = "C:/definitely-not-a-real-git-dir";
      process.env.GIT_WORK_TREE = "C:/definitely-not-a-real-worktree";
      process.env.GIT_INDEX_FILE = "C:/definitely-not-a-real-index";

      const [header] = await listRecentCommitHeaders(repoRoot, 1);
      if (header === undefined) {
        throw new Error("Expected one recent commit header.");
      }
      const candidate = await buildCommitCandidate(repoRoot, header, [], []);

      expect(candidate?.warnings).toContain("Commit message is short; task intent may be weak.");
      expect(candidate?.warnings).toContain(
        "Historical commit modified tests; evaluation may be stricter or less stable."
      );
    } finally {
      restoreEnv("GIT_DIR", previousGitDir);
      restoreEnv("GIT_WORK_TREE", previousGitWorkTree);
      restoreEnv("GIT_INDEX_FILE", previousGitIndex);
    }
  });
});

async function git(cwd: string, args: string[]): Promise<string> {
  const result = await execa("git", args, {
    cwd,
    env: cleanGitEnvironment(),
    extendEnv: false,
    reject: false,
    windowsHide: true
  });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function cleanGitEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== "GIT_CONFIG_PARAMETERS" && !key.startsWith("GIT_"))
  );
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, key);
  } else {
    process.env[key] = value;
  }
}
