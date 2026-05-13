import { DiffSummary } from "../schemas/types.js";
export declare function collectDiffSummary(repoRoot: string, worktreePath: string, patchPath: string, ignoredUntrackedFiles?: readonly string[]): Promise<DiffSummary>;
export declare function readPatchPreview(patchPath: string): Promise<string>;
export declare function previewPatch(patch: string): string;
