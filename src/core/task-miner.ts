import path from "node:path";
import { RepoRacerConfig, RepoRacerTask } from "../schemas/types.js";
import { writeJsonlFile } from "../utils/json.js";
import { currentPath, matchesAnyPattern, repoRacerPath } from "../utils/paths.js";
import { nowIso } from "../utils/time.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";
import { buildCommitCandidate, getCommitPatch, getPatchBetweenRefs, listRecentCommitHeaders } from "./git.js";

export interface MineTasksOptions {
  maxTasks?: number;
  runId?: string;
}

export async function mineTasks(
  repoRoot: string,
  config: RepoRacerConfig,
  options: MineTasksOptions = {}
): Promise<RepoRacerTask[]> {
  const maxTasks = options.maxTasks ?? config.maxTasks;
  const selection = config.commitSelection;
  const headers = await listRecentCommitHeaders(repoRoot, selection.lookback);
  const candidates = [];
  for (const header of headers) {
    if (selection.excludeMergeCommits && header.parentShas.length > 1) {
      continue;
    }
    const candidate = await buildCommitCandidate(repoRoot, header, selection.excludePatterns, selection.preferMessages);
    if (candidate === null) {
      continue;
    }
    if (candidate.changedFiles.length < selection.minChangedFiles) {
      continue;
    }
    if (candidate.changedFiles.length > selection.maxChangedFiles) {
      continue;
    }
    if (candidate.changedLines > selection.maxChangedLines) {
      continue;
    }
    candidates.push(candidate);
  }

  const selected = candidates
    .sort((left, right) => right.qualityScore - left.qualityScore || right.timestamp - left.timestamp)
    .slice(0, maxTasks);

  await ensureDir(repoRacerPath(repoRoot, "patches"));
  const tasks: RepoRacerTask[] = [];
  for (const [index, candidate] of selected.entries()) {
    const id = `task-${String(index + 1).padStart(3, "0")}`;
    const humanPatchPath = repoRacerPath(repoRoot, "patches", id, "human.patch");
    const patch = await getCommitPatch(repoRoot, candidate.sha);
    await writeGeneratedFile(repoRoot, humanPatchPath, patch);
    const hiddenTestFiles = config.hiddenTests.enabled
      ? candidate.changedFiles.filter((filePath) => isHiddenTestFile(filePath, config.hiddenTests.includePatterns))
      : [];
    const hiddenTestPatchPath =
      hiddenTestFiles.length > 0 ? repoRacerPath(repoRoot, "patches", id, "hidden-tests.patch") : null;
    if (hiddenTestPatchPath !== null) {
      const hiddenPatch = await getPatchBetweenRefs(repoRoot, candidate.parentSha, candidate.sha, hiddenTestFiles);
      await writeGeneratedFile(repoRoot, hiddenTestPatchPath, hiddenPatch);
    }
    tasks.push({
      id,
      targetCommit: candidate.sha,
      parentCommit: candidate.parentSha,
      message: candidate.message,
      prompt: candidate.message,
      changedFiles: candidate.changedFiles,
      nameStatuses: candidate.nameStatuses,
      insertions: candidate.insertions,
      deletions: candidate.deletions,
      changedLines: candidate.changedLines,
      qualityScore: candidate.qualityScore,
      warnings: candidate.warnings,
      humanPatchPath,
      hiddenTestPatchPath,
      hiddenTestFiles,
      createdAt: nowIso()
    });
  }

  await saveTasks(repoRoot, tasks, options.runId);
  return tasks;
}

function isHiddenTestFile(filePath: string, patterns: readonly string[]): boolean {
  return (
    matchesAnyPattern(filePath, [...patterns]) ||
    /(^|\/)(test|tests)\//i.test(filePath) ||
    /\.(test|spec)\.[cm]?[jt]sx?$/i.test(filePath) ||
    /_test\.py$/i.test(filePath)
  );
}

export async function saveTasks(repoRoot: string, tasks: RepoRacerTask[], runId?: string): Promise<void> {
  const latestPath = repoRacerPath(repoRoot, "tasks.jsonl");
  await ensureDir(path.dirname(latestPath));
  await writeJsonlFile(latestPath, tasks);
  const currentTasksPath = currentPath(repoRoot, "tasks.jsonl");
  await ensureDir(path.dirname(currentTasksPath));
  await writeJsonlFile(currentTasksPath, tasks);
  if (runId !== undefined) {
    const runTasksPath = repoRacerPath(repoRoot, "runs", runId, "tasks.jsonl");
    await ensureDir(path.dirname(runTasksPath));
    await writeJsonlFile(runTasksPath, tasks);
  }
}
