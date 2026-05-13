import { ReportConfig, RepoRacerSummary } from "../schemas/types.js";
export declare function generateReport(repoRoot: string, runId: string, summary: RepoRacerSummary, reportConfig?: ReportConfig, outputName?: string): Promise<string>;
export declare function openReport(repoRoot: string): Promise<string>;
