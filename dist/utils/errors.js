export class RepoRacerError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "RepoRacerError";
        this.code = code;
    }
}
export function toErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return "Unknown error";
}
//# sourceMappingURL=errors.js.map