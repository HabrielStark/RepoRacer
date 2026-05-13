# RepoRacer Runbook

## Local Smoke Test

```bash
pnpm install
pnpm check
pnpm test
pnpm test:coverage
pnpm build
pnpm release:audit
npm pack --json --dry-run --ignore-scripts
```

## Manual Fixture Test

Use any repository with at least one meaningful non-merge commit:

```bash
npx reporacer init
npx reporacer doctor
npx reporacer tasks --tasks 3
npx reporacer run --agents fake-success,fake-noop,fake-risky,fake-timeout --tasks 1
npx reporacer report
npx reporacer share
npx reporacer schema
npx reporacer ci
npx reporacer open
```

Expected result:

- `.reporacer/tasks.jsonl` exists.
- `.reporacer/results.jsonl` exists.
- `.reporacer/summary.json` exists.
- `.reporacer/report.html` exists.
- `.reporacer/public-report.html` exists after `share` or `run --public-report`.
- `.reporacer/share.md` and `.reporacer/badge.svg` exist after `share`.
- `.reporacer/config.schema.json` exists after `schema`.
- `.reporacer/github-action.yml` exists after `ci`.
- `fake-success` scores higher than `fake-noop`.
- `fake-risky` is blocked by risk scanning.
- `fake-timeout` is classified as `timed_out`.

## Hidden Target-Test Mode

Enable hidden test mining in config or pass the evaluation mode on the command line:

```bash
npx reporacer run --evaluation-mode hidden-target-tests --agents custom --tasks 3
```

Expected behavior:

- selected task metadata records hidden test files when target commits changed tests;
- agent diffs exclude hidden test patch files;
- hidden tests are applied only after the agent diff is collected;
- solved results require hidden tests to pass.

## Docker Sandbox Check

Set:

```json
{
  "sandbox": {
    "mode": "docker",
    "dockerImage": "node:20-bookworm",
    "network": "none",
    "cpus": 2,
    "memory": "4g"
  }
}
```

Then run:

```bash
npx reporacer doctor
npx reporacer run --agents fake-noop --tasks 1
```

`doctor` should report Docker availability. If Docker is not installed or not running, return to `sandbox.mode: "none"` or fix Docker locally.

## Clean Generated Data

```bash
npx reporacer clean
npx reporacer clean --all
```

`clean --all` preserves `.reporacer/config.json`. Add `--config` only when you want to remove the config too.

## Troubleshooting

If `run` fails with a dirty worktree error, commit or stash source changes. Use `--allow-dirty` only for intentional local experiments.

If baseline checks fail, the historical parent commit is unstable in the current environment. Increase filters, reduce task count, or set `baselineCheck` to false only when you intentionally accept that risk.

If no tasks are found, increase `commitSelection.lookback`, raise `maxChangedFiles`, or lower `minChangedFiles` in `.reporacer/config.json`.

If an agent command is missing, RepoRacer records that agent as failed and continues other selected agents.

If `reporacer ci` or `reporacer share` says generation is disabled, check `ci.generateGitHubAction` and `share.*` in `.reporacer/config.json`.

If `pnpm release:external-audit` fails on npm authentication or GitHub Pages status, finish the owner release setup first: configure `NPM_TOKEN`, publish the package through the release workflow, and enable Pages with GitHub Actions as the source.
