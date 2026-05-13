import { promises as fs } from "node:fs";
import path from "node:path";
import { assertInside, repoRacerDir } from "../utils/paths.js";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeGeneratedFile(repoRoot: string, targetPath: string, content: string): Promise<void> {
  const base = repoRacerDir(repoRoot);
  assertInside(base, targetPath);
  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, content, "utf8");
}

export async function removeGeneratedPath(repoRoot: string, targetPath: string): Promise<void> {
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

export async function readTextIfExists(filePath: string): Promise<string | null> {
  if (!(await pathExists(filePath))) {
    return null;
  }
  return fs.readFile(filePath, "utf8");
}
