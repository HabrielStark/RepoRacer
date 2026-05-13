import { RepoRacerTask } from "../schemas/types.js";

export function buildRepairPrompt(task: RepoRacerTask): string {
  return [
    "You are running inside an isolated Git worktree created by RepoRacer.",
    "",
    "Your job is to recreate the historical change described below.",
    "",
    `Task ID: ${task.id}`,
    `Historical commit message: ${task.message}`,
    `Historical commit: ${task.targetCommit}`,
    `Base commit: ${task.parentCommit}`,
    "",
    "Files touched by the historical commit:",
    ...task.changedFiles.map((filePath) => `- ${filePath}`),
    "",
    "Instructions:",
    "- Modify the repository in the current working directory only.",
    "- Implement the behavior implied by the historical commit message.",
    "- Keep the diff focused and avoid unrelated rewrites.",
    "- Do not edit .reporacer files.",
    "- Do not delete or weaken tests.",
    "- Do not weaken CI.",
    "- Do not commit secrets.",
    "- Leave the final changes unstaged.",
    "",
    "RepoRacer will run the configured test command and compare your patch with the historical human patch."
  ].join("\n");
}
