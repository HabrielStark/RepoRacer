# Guide

## Install

```bash
npm install -g reporacer
```

For local development in this repository:

```bash
pnpm install
pnpm build
node dist/cli.js doctor
```

## First Run

```bash
reporacer init
reporacer doctor
reporacer tasks --tasks 5
reporacer run --agents fake-success,fake-noop --tasks 2
reporacer open
```

## Real Agents

Enable a real agent in `.reporacer/config.json`, then run:

```bash
reporacer run --agents codex --tasks 3
```

Use `reporacer doctor` before a public benchmark. It checks Git, Node, shallow-clone status, configured submodules, Git LFS attributes, configured commands, Docker availability when enabled, and a create/remove worktree smoke.

## Public Reports

```bash
reporacer run --public-report --agents codex,claude --tasks 5
reporacer share
```

Review generated files before publishing results from proprietary repositories.
