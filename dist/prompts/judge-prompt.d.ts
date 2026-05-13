import { RepoRacerResult, RepoRacerTask } from "../schemas/types.js";
export interface JudgePromptInput {
    task: RepoRacerTask;
    result: RepoRacerResult;
}
export declare function buildJudgePrompt(input: JudgePromptInput): string;
