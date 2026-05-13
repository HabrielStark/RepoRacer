# Agent Compatibility

RepoRacer ships command presets for common agent CLIs, but provider CLIs change over time.

| Agent    | Preset command                                                                                   | Verification status                                                                     |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Codex    | `codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}` | `codex exec --help` verified locally with Codex CLI 0.129.0; account run still required |
| Claude   | `claude -p < {{promptFile}}`                                                                     | `claude --help` verified locally with Claude Code 2.1.92; account run still required    |
| Gemini   | `gemini --approval-mode auto_edit < {{promptFile}}`                                              | Requires local Gemini CLI and account                                                   |
| Aider    | `aider --message-file {{promptFile}}`                                                            | Requires local Aider CLI and model configuration                                        |
| OpenCode | `opencode run --file {{promptFile}} "Follow the attached RepoRacer task prompt exactly."`        | Requires local OpenCode CLI and account                                                 |

Before publishing benchmark claims, run:

```bash
pnpm agents:verify
pnpm agents:verify:strict
reporacer doctor
reporacer run --agents <agent> --tasks 1
```

`pnpm agents:verify` checks whether the provider binaries are installed and report a version. Missing optional CLIs are reported as `SKIP` so contributors can still validate the rest of the repository on a normal workstation. Use `pnpm agents:verify:strict` on a release machine where every provider CLI is installed and authenticated.

A real compatibility claim still requires the full `reporacer run` command because provider accounts, network access, model selection, and interactive-login behavior cannot be proven by a static preset.

Do not claim a public comparison unless the command, account, network access, and resulting report were verified in the target environment.
