import { RepoRacerSummary, RunRepoRacerOptions } from "../schemas/types.js";
export declare function runRepoRacer(options?: RunRepoRacerOptions): Promise<RepoRacerSummary>;
export declare function renderRunSummary(summary: RepoRacerSummary): string;
