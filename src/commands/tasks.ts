import { loadConfig } from "../core/config.js";
import { getRepoRoot } from "../core/git.js";
import { mineTasks } from "../core/task-miner.js";
import { RepoRacerTask } from "../schemas/types.js";
import { renderTable } from "../utils/table.js";

export interface TasksOptions {
  cwd?: string;
  maxTasks?: number;
}

export async function selectTasks(options: TasksOptions = {}): Promise<{ repoRoot: string; tasks: RepoRacerTask[] }> {
  const repoRoot = await getRepoRoot(options.cwd ?? process.cwd());
  const config = await loadConfig(repoRoot);
  const mineOptions = options.maxTasks === undefined ? {} : { maxTasks: options.maxTasks };
  const tasks = await mineTasks(repoRoot, config, mineOptions);
  return { repoRoot, tasks };
}

export function renderTasks(tasks: readonly RepoRacerTask[]): string {
  if (tasks.length === 0) {
    return "No suitable historical tasks found.";
  }
  return renderTable(
    ["Task", "Commit", "Score", "Files", "Lines", "Message"],
    tasks.map((task) => [
      task.id,
      task.targetCommit.slice(0, 10),
      String(task.qualityScore),
      String(task.changedFiles.length),
      String(task.changedLines),
      task.message
    ])
  );
}
