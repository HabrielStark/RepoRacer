# Governance

RepoRacer is maintained through public issues, pull requests, and release reviews.

## Decision Process

- Bug fixes and documentation improvements can be accepted by one maintainer after CI passes.
- New public CLI flags, config fields, scoring signals, report schema fields, or agent presets require an RFC issue before implementation.
- Breaking changes require a major version, a migration note, and a changelog entry.
- Security fixes follow `SECURITY.md` and can be prepared privately before disclosure.

## RFC Scope

Open an RFC for:

- new benchmark task-selection logic;
- scoring or risk-rule changes that affect leaderboard results;
- public API or config changes;
- new official agent presets;
- release, provenance, or report-format changes.

Each RFC must state the problem, proposed design, compatibility impact, test plan, and rollout plan.

## Triage Labels

Suggested labels for the public repository:

- `type: bug`
- `type: feature`
- `type: docs`
- `type: question`
- `type: rfc`
- `area: cli`
- `area: scoring`
- `area: reports`
- `area: agents`
- `area: ci`
- `security`
- `good first issue`
- `help wanted`

## Release Authority

Before public launch, list actual maintainer handles and npm package owners in `MAINTAINERS.md`.
