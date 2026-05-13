import { getRepoRoot } from "../core/git.js";
import { openReport } from "../core/report-generator.js";

export async function openRepoRacerReport(cwd = process.cwd()): Promise<string> {
  const repoRoot = await getRepoRoot(cwd);
  return openReport(repoRoot);
}
