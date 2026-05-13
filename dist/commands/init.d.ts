export interface InitOptions {
    cwd?: string;
    force?: boolean;
}
export declare function initRepoRacer(options?: InitOptions): Promise<string>;
