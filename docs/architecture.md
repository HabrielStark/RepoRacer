# Architecture

<img src="https://habrielstark.github.io/RepoRacer/architecture-pipeline.png" alt="RepoRacer architecture pipeline visualization" style="width:100%;border-radius:14px;border:1px solid rgba(125, 211, 252, 0.25);box-shadow:0 18px 54px rgba(2, 6, 23, 0.22);" />

The benchmark pipeline is intentionally linear: Git history becomes tasks, tasks become isolated worktrees, agents produce patches, tests and risk checks validate them, and the scorer turns the evidence into a static report.

## Modules

- `src/core/git.ts`: safe Git command helpers, commit scanning, patches, worktrees.
- `src/core/task-miner.ts`: converts historical commits into benchmark tasks.
- `src/core/agent-runner.ts`: creates worktrees, renders prompts, runs install/agent/test commands, records logs.
- `src/core/risk-scanner.ts`: rejects benchmark invalidation risks.
- `src/core/scorer.ts`: combines tests, hidden tests, patch similarity, changed files, minimality, speed, and risk penalties.
- `src/report/template.ts`: static HTML report generation with escaping and redaction.
- `src/commands/*.ts`: CLI command surfaces.

## Data Flow

RepoRacer writes owned artifacts under `.reporacer/`. Source checkouts are dirty-checked before runs, and generated paths are excluded from that check.

Hidden target-test mode mines test-file changes from the target commit, runs the agent without exposing those test changes, then applies the hidden patch before tests.
