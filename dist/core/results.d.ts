import { LeaderboardRow, RepoRacerResult, RepoRacerSummary } from "../schemas/types.js";
export declare function writeResult(repoRoot: string, runId: string, result: RepoRacerResult): Promise<void>;
export declare function resetResultFiles(repoRoot: string, runId: string): Promise<void>;
export declare function buildLeaderboard(results: RepoRacerResult[]): LeaderboardRow[];
export declare function winnerFromLeaderboard(leaderboard: LeaderboardRow[]): string | null;
export declare function writeSummary(repoRoot: string, runId: string, summary: RepoRacerSummary): Promise<void>;
