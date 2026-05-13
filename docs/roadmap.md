# Roadmap

## Implemented In 1.0

- CLI commands: `init`, `doctor`, `tasks`, `run`, `report`, `open`, `clean`, `ci`, `schema`, and `share`.
- Git history mining with commit quality filters and patch generation.
- Isolated Git worktree execution.
- Custom command adapters with quoted template variables.
- Built-in fake agents for success, no-op, risky, and timeout scenarios.
- Install command runner, baseline check, agent runner, test runner, and timeout handling.
- Working-tree evaluation mode.
- Hidden target-test evaluation mode.
- Diff analysis, patch similarity, changed-file overlap, minimality, speed, and risk scoring.
- Risk scanner for test deletion, test weakening, CI weakening, secret/env changes, RepoRacer artifact access, and giant diffs.
- JSONL task/result output, JSON summary, config snapshot, and reproducible run folders.
- Private HTML report and public report mode.
- Share markdown and SVG badge generation.
- GitHub Actions template generation.
- JSON schema generation.
- Optional Docker command sandbox with network, CPU, and memory controls.
- README, examples, security notes, runbook, scoring docs, and adapter docs.

## Future Enhancements

- Historical run comparison across multiple summaries.
- Language-aware task filters beyond generic filename and patch-size heuristics.
- Optional hosted gallery for users who explicitly opt in.
- Richer visual report charts while keeping static HTML output.
