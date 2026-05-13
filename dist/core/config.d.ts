import { RepoRacerConfig } from "../schemas/types.js";
export declare function configPath(repoRoot: string): string;
export declare function createDefaultConfig(repoRoot: string): Promise<RepoRacerConfig>;
export declare function saveConfig(repoRoot: string, config: RepoRacerConfig, force: boolean): Promise<string>;
export declare function loadConfig(repoRoot: string): Promise<RepoRacerConfig>;
export declare function parseConfig(value: unknown): RepoRacerConfig;
