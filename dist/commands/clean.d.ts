export interface CleanOptions {
    cwd?: string;
    all?: boolean;
    config?: boolean;
}
export declare function cleanRepoRacer(options?: CleanOptions): Promise<string[]>;
