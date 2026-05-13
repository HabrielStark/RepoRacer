export interface AgentCommandVariables {
    promptFile: string;
    taskId: string;
    agentName: string;
    worktreePath: string;
    testCommand: string;
}
export declare function renderAgentCommand(template: string, variables: AgentCommandVariables): string;
