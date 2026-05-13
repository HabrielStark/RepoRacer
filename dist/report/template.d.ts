import { RepoRacerSummary } from "../schemas/types.js";
export interface RenderReportOptions {
    includeLogs: boolean;
    includePatchPreview: boolean;
    redactSecrets: boolean;
    maxLogPreviewChars: number;
    maxPatchPreviewChars: number;
}
export declare function renderReportHtml(summary: RepoRacerSummary, options?: RenderReportOptions): string;
