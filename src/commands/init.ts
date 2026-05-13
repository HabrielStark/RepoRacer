import { getRepoRoot } from "../core/git.js";
import { createDefaultConfig, saveConfig } from "../core/config.js";

export interface InitOptions {
  cwd?: string;
  force?: boolean;
}

export async function initRepoRacer(options: InitOptions = {}): Promise<string> {
  const repoRoot = await getRepoRoot(options.cwd ?? process.cwd());
  const config = await createDefaultConfig(repoRoot);
  return saveConfig(repoRoot, config, Boolean(options.force));
}
