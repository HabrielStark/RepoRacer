# Security Model

RepoRacer is local-first and does not include telemetry, uploads, hosted storage, auth, payments, or a backend.

## Filesystem

RepoRacer writes generated files under `.reporacer/`. Worktrees are created under `.reporacer/runs/<run-id>/worktrees/`.

The source checkout is protected by a dirty-tree check before benchmark runs. `.reporacer/` is ignored for that check because RepoRacer manages it.

## Commands

Agent, install, and test commands run as local child processes by default. They inherit normal local process permissions. Use only commands you trust.

Command template variables are shell-quoted. The task prompt is written to a file, so RepoRacer does not inject prompt text directly into shell commands.

## Docker Sandbox

Set `sandbox.mode` to `docker` to wrap install, agent, and test commands in:

```text
docker run --rm -v <worktree>:/workspace -w /workspace ...
```

Docker mode supports:

- configured image;
- `network: "none"` or default Docker networking;
- CPU limit;
- memory limit.

Docker mode is not a full security boundary for hostile code. The worktree is mounted writable, and Docker daemon access is powerful on many systems.

## Release Container

The root `Dockerfile` pins `node:24-bookworm-slim` by digest and builds the published CLI in a multi-stage image. The image runs as the non-root `node` user and is smoke-tested in CI with `reporacer --version`.

## Secrets

Logs, summaries, config snapshots, patch previews, share markdown, badges, and HTML reports are redacted for common token and secret patterns.

Redaction is defense-in-depth, not a mathematical guarantee. Review generated files before sharing reports or patches.

## Reports

HTML reports escape commit messages, file paths, logs, patches, commands, risk messages, agent names, repository names, and winner names. Reports work offline.

Use `reporacer run --public-report`, `report.audience: "public"`, or `reporacer share` when preparing artifacts for publication. Public reports omit logs and patch previews even if private-report toggles are set differently.

## CI Template

`reporacer ci` writes a GitHub Actions template with `contents: read` permissions, pinned action SHAs, and pinned RepoRacer package version metadata. It is generated under `.reporacer/` for review before copying into `.github/workflows/`.

## Cleanup

`reporacer clean --all` removes generated run data, patches, logs, reports, summaries, public reports, share files, badges, CI templates, and schemas. It preserves config unless `--config` is passed.

## Vulnerability Reports

Use [GitHub Security Advisories](https://github.com/HabrielStark/RepoRacer/security/advisories/new) for private reports. Public exploit details should wait until maintainers have had a reasonable chance to investigate and coordinate a fix.
