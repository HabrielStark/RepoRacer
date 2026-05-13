import { loadConfig } from "../core/config.js";
import { writeGitHubActionTemplate } from "../core/ci-generator.js";
import { getRepoRoot } from "../core/git.js";
export async function generateCiTemplate(cwd = process.cwd()) {
    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    if (!config.ci.generateGitHubAction) {
        throw new Error("GitHub Action generation is disabled by ci.generateGitHubAction.");
    }
    return writeGitHubActionTemplate(repoRoot, config);
}
//# sourceMappingURL=ci.js.map