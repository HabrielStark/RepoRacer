import { renderCommandTemplate } from "../core/process-safe.js";

export interface AgentCommandVariables {
  promptFile: string;
  taskId: string;
  agentName: string;
  worktreePath: string;
  testCommand: string;
}

export function renderAgentCommand(template: string, variables: AgentCommandVariables): string {
  return renderCommandTemplate(template, {
    promptFile: variables.promptFile,
    taskId: variables.taskId,
    agentName: variables.agentName,
    worktreePath: variables.worktreePath,
    testCommand: variables.testCommand
  });
}
