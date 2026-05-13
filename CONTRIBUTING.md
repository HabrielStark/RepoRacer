# Contributing

Thanks for helping improve RepoRacer.

## Development Setup

```bash
pnpm install
pnpm lint
pnpm format:check
pnpm check
pnpm test
pnpm build
npm pack --dry-run
```

## Pull Requests

- Keep changes focused.
- Add tests for agent execution, scoring, security, reports, config, and CLI behavior changes.
- Update docs when behavior changes.
- Do not include generated `.reporacer/` data, private logs, `.env` files, API keys, or proprietary benchmark output.
- Open an RFC issue first for public CLI flags, config fields, scoring/risk-rule changes, report schema changes, or official agent presets.

## Issue Triage

Use the labels in `GOVERNANCE.md` when triaging public issues. Security reports must follow `SECURITY.md`, not public issue discussion.

## Commit Style

Use Conventional Commits:

```text
feat: add new scoring signal
fix: handle shallow clone task mining
docs: clarify Docker sandbox limits
```

Commit hooks run lint, format check, typecheck, tests, and commit message validation.

## DCO

RepoRacer uses Developer Certificate of Origin sign-off. Add:

```text
Signed-off-by: Your Name <you@example.com>
```

to each commit.
