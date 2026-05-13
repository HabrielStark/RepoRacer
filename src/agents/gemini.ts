export const geminiPreset = {
  name: "gemini",
  command: "gemini --approval-mode auto_edit < {{promptFile}}"
} as const;
