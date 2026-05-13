import path from "node:path";
import { createGitWorktree } from "./git.js";
import { ensureDir, pathExists, removeGeneratedPath } from "./fs-safe.js";
import { assertInside, runPath } from "../utils/paths.js";

export async function createRunWorktree(
  repoRoot: string,
  runId: string,
  taskId: string,
  agentName: string,
  commitSha: string
): Promise<string> {
  const worktreesRoot = runPath(repoRoot, runId, "worktrees");
  const worktreePath = path.join(worktreesRoot, `${taskId}-${safeSegment(agentName)}`);
  assertInside(worktreesRoot, worktreePath);
  if (await pathExists(worktreePath)) {
    await removeGeneratedPath(repoRoot, worktreePath);
  }
  await ensureDir(path.dirname(worktreePath));
  await createGitWorktree(repoRoot, worktreePath, commitSha);
  return worktreePath;
}

export function safeSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
