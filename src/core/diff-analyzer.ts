import { promises as fs } from "node:fs";
import { DiffSummary } from "../schemas/types.js";
import { writeGeneratedFile } from "./fs-safe.js";
import { collectWorktreeDiff } from "./git.js";
import { redactSecrets } from "./process-safe.js";

const PATCH_PREVIEW_LIMIT = 12000;

export async function collectDiffSummary(
  repoRoot: string,
  worktreePath: string,
  patchPath: string,
  ignoredUntrackedFiles: readonly string[] = []
): Promise<DiffSummary> {
  const diff = await collectWorktreeDiff(worktreePath, { ignoredUntrackedFiles });
  await writeGeneratedFile(repoRoot, patchPath, diff.patch);
  return {
    changedFiles: diff.stats.changedFiles,
    nameStatuses: diff.stats.nameStatuses,
    insertions: diff.stats.insertions,
    deletions: diff.stats.deletions,
    changedLines: diff.stats.changedLines,
    patchPath,
    patchPreview: previewPatch(diff.patch)
  };
}

export async function readPatchPreview(patchPath: string): Promise<string> {
  const content = await fs.readFile(patchPath, "utf8");
  return previewPatch(content);
}

export function previewPatch(patch: string): string {
  const redacted = redactSecrets(patch);
  if (redacted.length <= PATCH_PREVIEW_LIMIT) {
    return redacted;
  }
  return `${redacted.slice(0, PATCH_PREVIEW_LIMIT)}\n... truncated ${redacted.length - PATCH_PREVIEW_LIMIT} characters ...`;
}
