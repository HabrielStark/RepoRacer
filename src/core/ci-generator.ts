import path from "node:path";
import { createRequire } from "node:module";
import { RepoRacerConfig } from "../schemas/types.js";
import { repoRacerPath } from "../utils/paths.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as { version: string };

export function renderGitHubAction(config: RepoRacerConfig): string {
  const agents = config.ci.defaultAgents.join(",");
  const tasks = String(config.ci.defaultTasks);
  return `name: RepoRacer

on:
  workflow_dispatch:
  pull_request:
    branches: [ main ]

permissions:
  contents: read

jobs:
  benchmark:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - name: Checkout
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
        with:
          fetch-depth: 200

      - name: Setup Node
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: 20

      - name: Run RepoRacer
        run: npx --yes reporacer@${packageJson.version} run --agents ${shellSafe(agents)} --tasks ${tasks}

      - name: Upload RepoRacer report
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: reporacer-report
          path: .reporacer/
`;
}

export async function writeGitHubActionTemplate(repoRoot: string, config: RepoRacerConfig): Promise<string> {
  const target = repoRacerPath(repoRoot, "github-action.yml");
  await ensureDir(path.dirname(target));
  await writeGeneratedFile(repoRoot, target, renderGitHubAction(config));
  return target;
}

function shellSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9,._-]/g, "");
}
