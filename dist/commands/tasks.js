import { loadConfig } from "../core/config.js";
import { getRepoRoot } from "../core/git.js";
import { mineTasks } from "../core/task-miner.js";
import { renderTable } from "../utils/table.js";
export async function selectTasks(options = {}) {
    const repoRoot = await getRepoRoot(options.cwd ?? process.cwd());
    const config = await loadConfig(repoRoot);
    const mineOptions = options.maxTasks === undefined ? {} : { maxTasks: options.maxTasks };
    const tasks = await mineTasks(repoRoot, config, mineOptions);
    return { repoRoot, tasks };
}
export function renderTasks(tasks) {
    if (tasks.length === 0) {
        return "No suitable historical tasks found.";
    }
    return renderTable(["Task", "Commit", "Score", "Files", "Lines", "Message"], tasks.map((task) => [
        task.id,
        task.targetCommit.slice(0, 10),
        String(task.qualityScore),
        String(task.changedFiles.length),
        String(task.changedLines),
        task.message
    ]));
}
//# sourceMappingURL=tasks.js.map