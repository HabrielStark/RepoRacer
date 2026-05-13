import { DiffSummary, RepoRacerConfig, RiskFlag } from "../schemas/types.js";
export declare function scanRisks(diff: DiffSummary, config: RepoRacerConfig, fullPatch?: string): RiskFlag[];
export declare function hasCriticalRisk(flags: readonly RiskFlag[]): boolean;
