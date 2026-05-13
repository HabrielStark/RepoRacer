# Security

RepoRacer is local-first. It does not upload repository content, patches, logs, summaries, prompts, or reports.

## Main Risks

Custom agent commands run with local permissions by default. Treat them like any other shell command that can read and write files.

AI provider CLIs may send prompt content and repository context to their providers. RepoRacer does not control those tools. Review each provider's settings before running it on private code.

Generated private reports and patches may contain private source code. Do not publish `.reporacer/report.html`, patches, logs, or summaries unless you have reviewed them. Use `reporacer run --public-report` or `reporacer share` for reduced public artifacts.

## Built-In Protections

- Generated files are written under `.reporacer/`.
- Worktrees are created under `.reporacer/runs/<run-id>/worktrees/`.
- Source checkout dirty paths cause `run` to fail by default.
- `.reporacer/` changes are ignored for the source dirty check.
- Command template values are shell-quoted.
- Prompt text is written to a prompt file instead of embedded in shell commands.
- Logs, summaries, share artifacts, badges, and report previews redact common secret patterns.
- HTML reports escape dynamic content.
- Critical risks block a result from counting as solved.
- Hidden target-test patches are applied after collecting agent diffs.
- Optional Docker mode wraps install, agent, and test commands with network, CPU, and memory controls.
- `clean` removes only owned paths under `.reporacer/`.
- Generated GitHub Actions templates use least-privilege permissions and pinned action SHAs.

## Current Limitations

RepoRacer worktrees isolate Git state, not operating-system access. Agent commands can still read files your user can read and can use the network if the command does so.

Docker mode reduces accidental host mutation but is not a complete security boundary for hostile code. The task worktree is mounted writable by design, and Docker daemon access can be powerful.

Secret redaction uses pattern matching. It reduces accidental exposure but cannot prove that every secret shape is removed.

The report is static HTML and generated with escaping, but the code and patches it describes may still be private.

## Reporting Issues

Open a private report through [GitHub Security Advisories](https://github.com/HabrielStark/RepoRacer/security/advisories/new) or contact [@HabrielStark](https://github.com/HabrielStark) before publishing exploit details.
