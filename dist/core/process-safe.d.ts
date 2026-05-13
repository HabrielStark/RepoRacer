import { CommandRunResult, SandboxConfig } from "../schemas/types.js";
export interface RunCommandOptions {
    cwd: string;
    timeoutMs?: number;
    env?: Record<string, string>;
    sandbox?: SandboxConfig;
}
export declare function runCommand(command: string, options: RunCommandOptions): Promise<CommandRunResult>;
export declare function renderCommandTemplate(template: string, variables: Record<string, string>): string;
export declare function shellQuote(value: string): string;
export declare function posixShellQuote(value: string): string;
export declare function buildDockerCommand(command: string, cwd: string, sandbox: SandboxConfig): string;
export declare function redactSecrets(input: string): string;
export declare function stripAnsi(input: string): string;
export declare function commandResultLog(result: CommandRunResult, label: string): string;
