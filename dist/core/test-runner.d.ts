import { TestRunResult } from "../schemas/types.js";
import { SandboxConfig } from "../schemas/types.js";
export declare function runTests(repoRoot: string, worktreePath: string, command: string | null, timeoutMs: number, logPath: string, phase?: TestRunResult["phase"], sandbox?: SandboxConfig): Promise<TestRunResult>;
