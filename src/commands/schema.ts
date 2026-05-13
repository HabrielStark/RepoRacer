import { getRepoRoot } from "../core/git.js";
import { writeConfigJsonSchema } from "../core/schema-generator.js";

export async function generateConfigSchema(cwd = process.cwd()): Promise<string> {
  const repoRoot = await getRepoRoot(cwd);
  return writeConfigJsonSchema(repoRoot);
}
