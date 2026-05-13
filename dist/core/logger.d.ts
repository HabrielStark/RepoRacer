export interface Logger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
    success(message: string): void;
}
export declare const logger: Logger;
