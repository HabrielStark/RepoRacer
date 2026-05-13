import { RepoRacerConfig } from "../schemas/types.js";
export declare function renderGitHubAction(config: RepoRacerConfig): string;
export declare function writeGitHubActionTemplate(repoRoot: string, config: RepoRacerConfig): Promise<string>;
