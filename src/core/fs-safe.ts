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
  await assertNoGeneratedPathEscape(base, path.dirname(targetPath));
  await ensureDir(path.dirname(targetPath));
  await assertNoGeneratedPathEscape(base, path.dirname(targetPath));
  if (await pathExists(targetPath)) {
    await assertNotLink(targetPath);
  }
  await fs.writeFile(targetPath, content, "utf8");
}

export async function removeGeneratedPath(repoRoot: string, targetPath: string): Promise<void> {
  const base = repoRacerDir(repoRoot);
  assertInside(base, targetPath);
  await assertNoGeneratedPathEscape(base, path.dirname(targetPath));
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

async function assertNoGeneratedPathEscape(base: string, targetParent: string): Promise<void> {
  const resolvedBase = path.resolve(base);
  const resolvedParent = path.resolve(targetParent);
  assertInside(resolvedBase, resolvedParent);

  if (await pathExists(resolvedBase)) {
    await assertNotLink(resolvedBase);
  }

  let current = resolvedBase;
  const relativeParts = path.relative(resolvedBase, resolvedParent).split(path.sep).filter(Boolean);
  for (const part of relativeParts) {
    current = path.join(current, part);
    if (await pathExists(current)) {
      await assertNotLink(current);
    }
  }
}

async function assertNotLink(filePath: string): Promise<void> {
  const stat = await fs.lstat(filePath);
  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing to access generated path through symlink or junction: ${filePath}`);
  }
}
