# Concept

RepoRacer turns real Git history into benchmark tasks.

For each selected historical commit, RepoRacer checks out the parent commit in an isolated worktree, asks an agent to recreate the change, runs tests, compares the patch with the human commit, scans for risks, and generates a local report.

The core loop is:

```text
Git history -> benchmark tasks -> isolated agent runs -> tests -> scoring -> report
```

RepoRacer is not a coding agent. It is the benchmark layer for coding agents.
