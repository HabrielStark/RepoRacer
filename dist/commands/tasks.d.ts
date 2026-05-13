import { RepoRacerTask } from "../schemas/types.js";
export interface TasksOptions {
    cwd?: string;
    maxTasks?: number;
}
export declare function selectTasks(options?: TasksOptions): Promise<{
    repoRoot: string;
    tasks: RepoRacerTask[];
}>;
export declare function renderTasks(tasks: readonly RepoRacerTask[]): string;
