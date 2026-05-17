# Agent Adapters

RepoRacer agents are command templates.

```json
{
  "name": "my-agent",
  "command": "my-agent --prompt-file {{promptFile}}",
  "enabled": true
}
```

The command runs with its current working directory set to the task worktree. The agent should modify files in that worktree and leave changes unstaged.

## Template Variables

- `{{promptFile}}`: absolute path to the generated task prompt.
- `{{taskId}}`: task identifier such as `task-001`.
- `{{agentName}}`: configured agent name.
- `{{worktreePath}}`: absolute path to the isolated worktree.
- `{{testCommand}}`: configured test command, or an empty string when none is configured.

Variable values are shell-quoted. Unknown template variables are left unchanged.

## Built-In Agents

- `fake-success`: applies the historical human patch.
- `fake-noop`: exits with success and no changes.
- `fake-risky`: writes an `.env` file to exercise risk blocking.
- `fake-timeout`: simulates timeout handling.

## Preset Examples

These presets are built into RepoRacer and can be requested directly with `--agents codex,claude,gemini,aider,opencode`.

```json
[
  {
    "name": "codex",
    "command": "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}",
    "enabled": true
  },
  {
    "name": "claude",
    "command": "claude -p < {{promptFile}}",
    "enabled": true
  },
  {
    "name": "custom",
    "command": "node scripts/my-agent.js {{promptFile}}",
    "enabled": true
  }
]
```

RepoRacer does not add provider-specific network calls. Provider CLIs decide what they send externally.

## Verified CLI Versions

The 1.x release verifier has been checked against these installed CLI versions:

- Codex CLI: `codex-cli 0.129.0`.
- Claude Code: `2.1.92`.
- Gemini CLI: `@google/gemini-cli 0.42.0`.
- Aider: `aider-chat 0.86.2`.
- OpenCode: `opencode-ai 1.14.48`.

Run `pnpm agents:verify:strict` before publishing. On Windows, the verifier also checks the Python user Scripts directory so an `aider-chat --user` install is detected when `aider.exe` exists outside the interactive `PATH`.

## Docker Mode

When `sandbox.mode` is `docker`, RepoRacer wraps adapter commands in Docker and mounts the task worktree at `/workspace`. Keep adapter commands portable when you expect to run them in containers.
