import { readJsonFile } from "../utils/json.js";
import { repoRacerPath } from "../utils/paths.js";
import { getRepoRoot } from "../core/git.js";
import { generateReport } from "../core/report-generator.js";
import { RepoRacerSummary } from "../schemas/types.js";
import { loadConfig } from "../core/config.js";

export async function regenerateReport(cwd = process.cwd()): Promise<string> {
  const repoRoot = await getRepoRoot(cwd);
  const config = await loadConfig(repoRoot);
  const summary = await readJsonFile<RepoRacerSummary>(repoRacerPath(repoRoot, "summary.json"));
  return generateReport(repoRoot, summary.run.id, summary, config.report);
}
