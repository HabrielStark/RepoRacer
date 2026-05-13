export declare class RepoRacerError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
export declare function toErrorMessage(error: unknown): string;
