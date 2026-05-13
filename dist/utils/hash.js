import { createHash } from "node:crypto";
export function sha256Short(value) {
    return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
//# sourceMappingURL=hash.js.map