import { DiffSummary, RepoRacerTask, RiskFlag, RunStatus, ScoreBreakdown, TestRunResult } from "../schemas/types.js";
export interface ScoreInput {
    task: RepoRacerTask;
    humanPatch: string;
    agentPatch: string;
    diff: DiffSummary;
    tests: TestRunResult;
    hiddenTests: TestRunResult | null;
    risks: RiskFlag[];
    status: RunStatus;
    durationMs: number;
    timeoutMs: number;
}
export declare function scoreResult(input: ScoreInput): ScoreBreakdown;
export declare function testScore(result: TestRunResult): number;
export declare function changedFilesOverlapScore(expectedFiles: readonly string[], actualFiles: readonly string[]): number;
export declare function patchSimilarityScore(humanPatch: string, agentPatch: string): number;
export declare function diffSizeScore(expectedLines: number, actualLines: number): number;
export declare function minimalityScore(expectedFiles: number, actualFiles: number, expectedLines: number, actualLines: number): number;
export declare function speedScore(durationMs: number, timeoutMs: number): number;
export declare function riskPenaltyScore(risks: readonly RiskFlag[]): number;
