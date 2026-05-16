# API

RepoRacer exposes a typed ESM API for embedding the same local benchmark engine used by the CLI.

```ts
import { createDefaultConfig, mineTasks, runRepoRacer } from "reporacer";

const config = createDefaultConfig();
const tasks = await mineTasks({ cwd: process.cwd(), config });
const result = await runRepoRacer({
  cwd: process.cwd(),
  config,
  tasks,
  agents: ["codex", "claude"]
});

console.log(result.summary.leaderboard);
```

## Stable Entry Points

| Area | Exports |
| --- | --- |
| Config | `createDefaultConfig`, `loadConfig`, `saveConfig`, `generateConfigSchema` |
| Tasks | `mineTasks`, `RepoRacerTask`, `CommitSelectionConfig` |
| Runs | `runRepoRacer`, `RunRepoRacerOptions`, `RepoRacerResult`, `RepoRacerSummary` |
| Reports | `generateReport`, `generateShareArtifacts`, `renderBadgeSvg` |
| CI | `generateCiTemplate`, `renderGitHubAction` |
| Plugins | `RepoRacerPluginHooks`, lifecycle event types |

## Reference

The generated TypeDoc reference is available at [API Reference](/api/reference/).

For stability rules, compatibility promises, and breaking-change policy, see [Public API Stability](/api-stability).
