import { GitCommitCandidate, NameStatus } from "../schemas/types.js";
export interface GitCommitHeader {
    sha: string;
    parentShas: string[];
    timestamp: number;
    message: string;
}
export interface DiffStats {
    changedFiles: string[];
    nameStatuses: NameStatus[];
    insertions: number;
    deletions: number;
    changedLines: number;
}
export declare function runGit(args: string[], cwd: string): Promise<string>;
export declare function isGitRepo(cwd: string): Promise<boolean>;
export declare function getRepoRoot(cwd: string): Promise<string>;
export declare function getHeadSha(repoRoot: string): Promise<string>;
export declare function getRepoName(repoRoot: string): Promise<string>;
export declare function isShallowRepository(repoRoot: string): Promise<boolean>;
export declare function listConfiguredSubmodules(repoRoot: string): Promise<string[]>;
export declare function gitLfsDiagnostics(repoRoot: string): Promise<{
    trackedPatterns: string[];
    cliAvailable: boolean;
}>;
export declare function dirtyEntries(repoRoot: string): Promise<string[]>;
export declare function ensureCleanWorkingTree(repoRoot: string, allowDirty: boolean): Promise<void>;
export declare function listRecentCommitHeaders(repoRoot: string, lookback: number): Promise<GitCommitHeader[]>;
export declare function getDiffStats(repoRoot: string, fromRef: string, toRef: string): Promise<DiffStats>;
export declare function getCommitPatch(repoRoot: string, commitSha: string): Promise<string>;
export declare function getPatchBetweenRefs(repoRoot: string, fromRef: string, toRef: string, paths: readonly string[]): Promise<string>;
export declare function applyPatch(worktreePath: string, patchPath: string): Promise<void>;
export interface CollectWorktreeDiffOptions {
    ignoredUntrackedFiles?: readonly string[];
}
export declare function collectWorktreeDiff(worktreePath: string, options?: CollectWorktreeDiffOptions): Promise<{
    patch: string;
    stats: DiffStats;
}>;
export declare function listUntrackedFiles(worktreePath: string): Promise<string[]>;
export declare function createGitWorktree(repoRoot: string, worktreePath: string, commitSha: string): Promise<void>;
export declare function removeGitWorktree(repoRoot: string, worktreePath: string): Promise<void>;
export declare function buildCommitCandidate(repoRoot: string, header: GitCommitHeader, excludePatterns: string[], preferMessages: string[]): Promise<GitCommitCandidate | null>;
export declare function parseNameStatus(output: string): NameStatus[];
export declare function parseNumstat(output: string): {
    insertions: number;
    deletions: number;
};
