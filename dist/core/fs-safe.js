import { promises as fs } from "node:fs";
import path from "node:path";
import { assertInside, repoRacerDir } from "../utils/paths.js";
export async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export async function ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
}
export async function writeGeneratedFile(repoRoot, targetPath, content) {
    const base = repoRacerDir(repoRoot);
    assertInside(base, targetPath);
    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, content, "utf8");
}
export async function removeGeneratedPath(repoRoot, targetPath) {
    const base = repoRacerDir(repoRoot);
    assertInside(base, targetPath);
    if (!(await pathExists(targetPath))) {
        return;
    }
    const stat = await fs.lstat(targetPath);
    if (stat.isSymbolicLink() || stat.isFile()) {
        await fs.unlink(targetPath);
        return;
    }
    await fs.rm(targetPath, { recursive: true, force: true, maxRetries: 3 });
}
export async function readTextIfExists(filePath) {
    if (!(await pathExists(filePath))) {
        return null;
    }
    return fs.readFile(filePath, "utf8");
}
//# sourceMappingURL=fs-safe.js.map