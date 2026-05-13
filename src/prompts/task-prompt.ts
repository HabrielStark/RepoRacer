import { RepoRacerTask } from "../schemas/types.js";
import { buildRepairPrompt } from "./repair-prompt.js";

export function buildTaskPrompt(task: RepoRacerTask): string {
  return buildRepairPrompt(task);
}
