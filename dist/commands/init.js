import { getRepoRoot } from "../core/git.js";
import { createDefaultConfig, saveConfig } from "../core/config.js";
export async function initRepoRacer(options = {}) {
    const repoRoot = await getRepoRoot(options.cwd ?? process.cwd());
    const config = await createDefaultConfig(repoRoot);
    return saveConfig(repoRoot, config, Boolean(options.force));
}
//# sourceMappingURL=init.js.map