import { RepoRacerSummary } from "../schemas/types.js";
export declare function renderShareMarkdown(summary: RepoRacerSummary): string;
export declare function renderBadgeSvg(summary: RepoRacerSummary): string;
export declare function writeShareArtifacts(repoRoot: string, summary: RepoRacerSummary, options?: {
    markdown: boolean;
    badge: boolean;
}): Promise<{
    markdownPath: string | null;
    badgePath: string | null;
}>;
