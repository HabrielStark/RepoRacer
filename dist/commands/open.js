import { getRepoRoot } from "../core/git.js";
import { openReport } from "../core/report-generator.js";
export async function openRepoRacerReport(cwd = process.cwd()) {
    const repoRoot = await getRepoRoot(cwd);
    return openReport(repoRoot);
}
//# sourceMappingURL=open.js.map