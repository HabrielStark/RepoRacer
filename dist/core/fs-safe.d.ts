export declare function pathExists(filePath: string): Promise<boolean>;
export declare function ensureDir(dirPath: string): Promise<void>;
export declare function writeGeneratedFile(repoRoot: string, targetPath: string, content: string): Promise<void>;
export declare function removeGeneratedPath(repoRoot: string, targetPath: string): Promise<void>;
export declare function removeEmptyGeneratedParents(repoRoot: string, startPath: string): Promise<void>;
export declare function readTextIfExists(filePath: string): Promise<string | null>;
