# Public API Stability

RepoRacer exposes a small ESM API from `reporacer`.

## Stable Surface

The following exports are public for `1.x`:

- CLI workflow helpers: `runRepoRacer`, `initRepoRacer`, `mineTasks`, `generateReport`, `generateCiTemplate`, `generateShareArtifacts`.
- Schema helpers: `repoRacerResultSchema`, `repoRacerSummarySchema`, `renderConfigJsonSchema`.
- Prompt helpers: `buildRepairPrompt`, `buildJudgePrompt`.
- TypeScript contracts exported from `src/index.ts`, including `RepoRacerConfig`, `RepoRacerTask`, `RepoRacerResult`, `RepoRacerSummary`, and plugin hook event types.

Patch and minor releases may add optional fields. They must not remove exported names, change required output fields, or change hook event meanings.

## Plugin Hooks

Programmatic callers can observe a run without loading arbitrary code from `.reporacer/config.json`:

```ts
import { runRepoRacer, type RepoRacerPluginHooks } from "reporacer";

const hooks: RepoRacerPluginHooks = {
  onRunStart(event) {
    console.log(event.runId, event.agents);
  },
  onAgentFinish(event) {
    console.log(event.task.id, event.agentName, event.result.status);
  }
};

await runRepoRacer({ repoRoot: process.cwd(), agents: ["codex"], plugins: [hooks] });
```

Hooks run in process and failures reject the current run. CLI config files intentionally do not load hook modules; that keeps public benchmark runs auditable and avoids executing unexpected local code.

`onAgentFinish` runs after the per-agent result has been written to `.reporacer`, and before RepoRacer removes the generated worktree when `keepWorktrees` is false.

## Breaking Changes

Breaking CLI flags, config fields, JSON summary fields, result status values, scoring semantics, or public TypeScript exports require:

1. an RFC issue;
2. a major version;
3. a migration note in `CHANGELOG.md`;
4. updated docs and tests.
