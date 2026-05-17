import path from "node:path";
import { repoRacerPath } from "../utils/paths.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";
const REPORACER_CI_VERSION = "1.0.1";
export function renderGitHubAction(config) {
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
        run: npx --yes reporacer@${REPORACER_CI_VERSION} run --agents ${shellSafe(agents)} --tasks ${tasks}

      - name: Upload RepoRacer report
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: reporacer-report
          path: .reporacer/
`;
}
export async function writeGitHubActionTemplate(repoRoot, config) {
    const target = repoRacerPath(repoRoot, "github-action.yml");
    await ensureDir(path.dirname(target));
    await writeGeneratedFile(repoRoot, target, renderGitHubAction(config));
    return target;
}
function shellSafe(value) {
    return value.replace(/[^a-zA-Z0-9,._-]/g, "");
}
//# sourceMappingURL=ci-generator.js.map