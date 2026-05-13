import path from "node:path";

export const REPORACER_DIR = ".reporacer";

export function toPosixPath(value: string): string {
  return value.replace(/\\/g, "/");
}

export function repoRacerDir(repoRoot: string): string {
  return path.join(repoRoot, REPORACER_DIR);
}

export function repoRacerPath(repoRoot: string, ...parts: string[]): string {
  return path.join(repoRacerDir(repoRoot), ...parts);
}

export function currentPath(repoRoot: string, ...parts: string[]): string {
  return repoRacerPath(repoRoot, "current", ...parts);
}

export function runPath(repoRoot: string, runId: string, ...parts: string[]): string {
  return repoRacerPath(repoRoot, "runs", runId, ...parts);
}

export function isInside(parent: string, child: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function assertInside(parent: string, child: string): void {
  if (!isInside(parent, child)) {
    throw new Error(`Refusing to access path outside ${parent}: ${child}`);
  }
}

export function gitRelativePath(repoRoot: string, absolutePath: string): string {
  return toPosixPath(path.relative(repoRoot, absolutePath));
}

export function matchesAnyPattern(filePath: string, patterns: string[]): boolean {
  const normalized = toPosixPath(filePath);
  const basename = normalized.split("/").pop() ?? normalized;
  return patterns.some((pattern) => matchesPattern(normalized, basename, pattern));
}

function matchesPattern(normalizedPath: string, basename: string, pattern: string): boolean {
  const normalizedPattern = toPosixPath(pattern.trim());
  if (normalizedPattern.length === 0) {
    return false;
  }
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedPath === prefix.slice(0, -1) || normalizedPath.startsWith(prefix);
  }
  if (!normalizedPattern.includes("*")) {
    return normalizedPath === normalizedPattern || normalizedPath.startsWith(`${normalizedPattern}/`);
  }
  const target = normalizedPattern.includes("/") ? normalizedPath : basename;
  return globToRegExp(normalizedPattern).test(target);
}

function globToRegExp(pattern: string): RegExp {
  let output = "^";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    const next = pattern[index + 1];
    if (char === "*" && next === "*") {
      output += ".*";
      index += 1;
      continue;
    }
    if (char === "*") {
      output += "[^/]*";
      continue;
    }
    output += escapeRegExp(char ?? "");
  }
  output += "$";
  return new RegExp(output);
}

function escapeRegExp(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}
