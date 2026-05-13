import { AgentRuntime } from "../agents/types.js";
import { RepoRacerConfig, RepoRacerResult, RepoRacerTask } from "../schemas/types.js";
export interface RunAgentTaskOptions {
    repoRoot: string;
    runId: string;
    config: RepoRacerConfig;
    task: RepoRacerTask;
    agent: AgentRuntime;
    baselineCheck: boolean;
}
export declare function runAgentTask(options: RunAgentTaskOptions): Promise<RepoRacerResult>;
