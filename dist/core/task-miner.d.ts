import { RepoRacerConfig, RepoRacerTask } from "../schemas/types.js";
export interface MineTasksOptions {
    maxTasks?: number;
    runId?: string;
}
export declare function mineTasks(repoRoot: string, config: RepoRacerConfig, options?: MineTasksOptions): Promise<RepoRacerTask[]>;
export declare function saveTasks(repoRoot: string, tasks: RepoRacerTask[], runId?: string): Promise<void>;
