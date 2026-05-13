import { renderCommandTemplate } from "../core/process-safe.js";
export function renderAgentCommand(template, variables) {
    return renderCommandTemplate(template, {
        promptFile: variables.promptFile,
        taskId: variables.taskId,
        agentName: variables.agentName,
        worktreePath: variables.worktreePath,
        testCommand: variables.testCommand
    });
}
//# sourceMappingURL=custom.js.map