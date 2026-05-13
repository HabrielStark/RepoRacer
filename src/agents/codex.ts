export const codexPreset = {
  name: "codex",
  command: "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}"
} as const;
