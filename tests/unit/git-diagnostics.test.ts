import { execa } from "execa";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyPatch,
  buildCommitCandidate,
  collectWorktreeDiff,
  createGitWorktree,
  dirtyEntries,
  ensureCleanWorkingTree,
  getCommitPatch,
  getDiffStats,
  getHeadSha,
  getPatchBetweenRefs,
  getRepoName,
  getRepoRoot,
  gitLfsDiagnostics,
  isGitRepo,
  isShallowRepository,
  listConfiguredSubmodules,
  listRecentCommitHeaders,
  removeGitWorktree
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

  it("serializes concurrent worktree add and remove operations for one repository", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-worktree-queue-"));
    await git(repoRoot, ["init"]);
    await git(repoRoot, ["config", "user.email", "test@example.com"]);
    await git(repoRoot, ["config", "user.name", "RepoRacer Test"]);
    await fs.writeFile(path.join(repoRoot, "README.md"), "worktree queue\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "chore: worktree queue fixture"]);
    const head = (await git(repoRoot, ["rev-parse", "HEAD"])).trim();

    const worktrees = await Promise.all(
      ["one", "two", "three"].map(async (name) => {
        const worktreePath = path.join(repoRoot, ".reporacer", "worktrees", name);
        await createGitWorktree(repoRoot, worktreePath, head);
        return worktreePath;
      })
    );

    await Promise.all(worktrees.map((worktreePath) => fs.access(path.join(worktreePath, "README.md"))));

    await Promise.all(worktrees.map((worktreePath) => removeGitWorktree(repoRoot, worktreePath)));
    await expect(Promise.all(worktrees.map((worktreePath) => fs.access(worktreePath)))).rejects.toThrow();
  });

  it("reports roots, names, diffs, patches, and dirty paths through the public git helpers", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-git-helpers-"));
    await git(repoRoot, ["init"]);
    await git(repoRoot, ["config", "user.email", "test@example.com"]);
    await git(repoRoot, ["config", "user.name", "RepoRacer Test"]);
    await fs.mkdir(path.join(repoRoot, "src"), { recursive: true });
    await fs.writeFile(path.join(repoRoot, "src", "app.txt"), "before\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "chore: base helper fixture"]);
    const base = (await git(repoRoot, ["rev-parse", "HEAD"])).trim();

    await fs.writeFile(path.join(repoRoot, "src", "app.txt"), "after\n", "utf8");
    await git(repoRoot, ["add", "."]);
    await git(repoRoot, ["commit", "-m", "fix: update helper fixture"]);
    const head = await getHeadSha(repoRoot);

    const subdir = path.join(repoRoot, "src");
    await expect(isGitRepo(repoRoot)).resolves.toBe(true);
    expect(await fs.realpath(await getRepoRoot(subdir))).toBe(await fs.realpath(repoRoot));
    await expect(getRepoName(repoRoot)).resolves.toBe(path.basename(repoRoot));
    await git(repoRoot, ["remote", "add", "origin", "https://github.com/example/reporacer-demo.git"]);
    await expect(getRepoName(repoRoot)).resolves.toBe("reporacer-demo");

    await expect(getDiffStats(repoRoot, base, head)).resolves.toMatchObject({
      changedFiles: ["src/app.txt"],
      insertions: 1,
      deletions: 1
    });
    await expect(getCommitPatch(repoRoot, head)).resolves.toContain("+after");
    const patch = await getPatchBetweenRefs(repoRoot, base, head, ["src/app.txt"]);
    expect(patch).toContain("-before");
    expect(patch).toContain("+after");

    const worktreePath = path.join(repoRoot, ".reporacer", "apply-target");
    const patchPath = path.join(repoRoot, ".reporacer", "patch.diff");
    await fs.mkdir(path.dirname(patchPath), { recursive: true });
    await fs.writeFile(patchPath, patch, "utf8");
    await createGitWorktree(repoRoot, worktreePath, base);
    await applyPatch(worktreePath, patchPath);
    const appliedText = await fs.readFile(path.join(worktreePath, "src", "app.txt"), "utf8");
    expect(appliedText.replace(/\r\n/g, "\n")).toBe("after\n");
    await removeGitWorktree(repoRoot, worktreePath);

    await fs.writeFile(path.join(repoRoot, "dirty.txt"), "dirty\n", "utf8");
    await fs.mkdir(path.join(repoRoot, ".reporacer", "ignored"), { recursive: true });
    await fs.writeFile(path.join(repoRoot, ".reporacer", "ignored", "ignored.txt"), "ignored\n", "utf8");
    await expect(dirtyEntries(repoRoot)).resolves.toEqual(["dirty.txt"]);
    await expect(ensureCleanWorkingTree(repoRoot, false)).rejects.toThrow(/Dirty paths: dirty\.txt/);
    await expect(ensureCleanWorkingTree(repoRoot, true)).resolves.toBeUndefined();

    const diff = await collectWorktreeDiff(repoRoot);
    expect(diff.stats.changedFiles).toContain("dirty.txt");
    expect(diff.patch).toContain("+dirty");
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
