export declare function stringifyJson(value: unknown): string;
export declare function readJsonFile<T>(filePath: string): Promise<T>;
export declare function writeJsonFile(filePath: string, value: unknown): Promise<void>;
export declare function encodeJsonl(value: unknown): string;
export declare function writeJsonlFile(filePath: string, values: readonly unknown[]): Promise<void>;
export declare function appendJsonlFile(filePath: string, value: unknown): Promise<void>;
export declare function readJsonlFile<T>(filePath: string): Promise<T[]>;
