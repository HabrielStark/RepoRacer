import { execa } from "execa";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { RepoRacerError } from "../utils/errors.js";
import { matchesAnyPattern, toPosixPath } from "../utils/paths.js";
import { redactSecrets } from "./process-safe.js";
const worktreeOperationQueues = new Map();
export async function runGit(args, cwd) {
    const result = await execa("git", args, {
        cwd,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        stripFinalNewline: false,
        windowsHide: true,
        maxBuffer: 50 * 1024 * 1024
    });
    if (result.exitCode !== 0) {
        throw new RepoRacerError("GIT_COMMAND_FAILED", `git ${args.join(" ")} failed: ${redactSecrets(result.stderr || result.stdout || "no output")}`);
    }
    return result.stdout;
}
export async function isGitRepo(cwd) {
    const result = await execa("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        windowsHide: true
    });
    return result.exitCode === 0 && result.stdout.trim() === "true";
}
export async function getRepoRoot(cwd) {
    if (!(await isGitRepo(cwd))) {
        throw new RepoRacerError("NOT_GIT_REPO", `RepoRacer must run inside a Git repository: ${cwd}`);
    }
    return path.resolve((await runGit(["rev-parse", "--show-toplevel"], cwd)).trim());
}
export async function getHeadSha(repoRoot) {
    return (await runGit(["rev-parse", "HEAD"], repoRoot)).trim();
}
export async function getRepoName(repoRoot) {
    const topLevel = path.basename(repoRoot);
    const remote = await execa("git", ["config", "--get", "remote.origin.url"], {
        cwd: repoRoot,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        windowsHide: true
    });
    if (remote.exitCode !== 0 || remote.stdout.trim().length === 0) {
        return topLevel;
    }
    const name = remote.stdout
        .trim()
        .replace(/\.git$/, "")
        .split(/[/:\\]/)
        .filter(Boolean)
        .pop();
    return name ?? topLevel;
}
export async function isShallowRepository(repoRoot) {
    const result = await execa("git", ["rev-parse", "--is-shallow-repository"], {
        cwd: repoRoot,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        windowsHide: true
    });
    return result.exitCode === 0 && result.stdout.trim() === "true";
}
export async function listConfiguredSubmodules(repoRoot) {
    if (!existsSync(path.join(repoRoot, ".gitmodules"))) {
        return [];
    }
    const result = await execa("git", ["config", "--file", ".gitmodules", "--get-regexp", "path"], {
        cwd: repoRoot,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        windowsHide: true
    });
    if (result.exitCode !== 0) {
        return [];
    }
    return result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/).pop() ?? "")
        .filter((line) => line.length > 0)
        .map(toPosixPath);
}
export async function gitLfsDiagnostics(repoRoot) {
    const trackedPatterns = listGitLfsPatterns(repoRoot);
    const lfs = await execa("git", ["lfs", "version"], {
        cwd: repoRoot,
        env: cleanGitEnvironment(),
        extendEnv: false,
        reject: false,
        windowsHide: true
    });
    return {
        trackedPatterns,
        cliAvailable: lfs.exitCode === 0
    };
}
export async function dirtyEntries(repoRoot) {
    const output = await runGit(["status", "--porcelain=v1", "--untracked-files=normal"], repoRoot);
    return output
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => normalizeStatusPath(line.slice(3)))
        .filter((filePath) => !isGeneratedRepoRacerPath(filePath));
}
export async function ensureCleanWorkingTree(repoRoot, allowDirty) {
    if (allowDirty) {
        return;
    }
    const entries = await dirtyEntries(repoRoot);
    if (entries.length > 0) {
        throw new RepoRacerError("DIRTY_WORKTREE", `Working tree has uncommitted changes. Commit, stash, or rerun with --allow-dirty. Dirty paths: ${entries
            .slice(0, 12)
            .join(", ")}`);
    }
}
export async function listRecentCommitHeaders(repoRoot, lookback) {
    const output = await runGit(["log", `--max-count=${lookback}`, "--format=%H%x1f%P%x1f%ct%x1f%s"], repoRoot);
    return output
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        const [sha, parentsRaw, timestampRaw, ...messageParts] = line.split("\x1f");
        return {
            sha: sha ?? "",
            parentShas: (parentsRaw ?? "").split(/\s+/).filter(Boolean),
            timestamp: Number(timestampRaw ?? "0"),
            message: messageParts.join("\x1f")
        };
    })
        .filter((commit) => commit.sha.length > 0 && commit.parentShas.length > 0);
}
export async function getDiffStats(repoRoot, fromRef, toRef) {
    const [nameStatuses, numstat] = await Promise.all([
        runGit(["diff", "--name-status", fromRef, toRef, "--"], repoRoot),
        runGit(["diff", "--numstat", fromRef, toRef, "--"], repoRoot)
    ]);
    const parsedNameStatuses = parseNameStatus(nameStatuses);
    const parsedNumstat = parseNumstat(numstat);
    return {
        changedFiles: parsedNameStatuses.map((item) => item.path),
        nameStatuses: parsedNameStatuses,
        insertions: parsedNumstat.insertions,
        deletions: parsedNumstat.deletions,
        changedLines: parsedNumstat.insertions + parsedNumstat.deletions
    };
}
export async function getCommitPatch(repoRoot, commitSha) {
    return runGit(["show", "--format=", "--binary", commitSha], repoRoot);
}
export async function getPatchBetweenRefs(repoRoot, fromRef, toRef, paths) {
    if (paths.length === 0) {
        return "";
    }
    return runGit(["diff", "--binary", fromRef, toRef, "--", ...paths], repoRoot);
}
export async function applyPatch(worktreePath, patchPath) {
    await runGit(["apply", "--whitespace=nowarn", patchPath], worktreePath);
}
export async function collectWorktreeDiff(worktreePath, options = {}) {
    const ignored = new Set((options.ignoredUntrackedFiles ?? []).map(toPosixPath));
    const untracked = (await listUntrackedFiles(worktreePath)).filter((filePath) => !ignored.has(toPosixPath(filePath)));
    if (untracked.length > 0) {
        await runGit(["add", "--intent-to-add", "--", ...untracked], worktreePath);
    }
    const [patch, nameStatus, numstat] = await Promise.all([
        runGit(["diff", "--binary", "HEAD", "--"], worktreePath),
        runGit(["diff", "--name-status", "HEAD", "--"], worktreePath),
        runGit(["diff", "--numstat", "HEAD", "--"], worktreePath)
    ]);
    if (untracked.length > 0) {
        await runGit(["reset", "--", ...untracked], worktreePath);
    }
    const parsedNameStatuses = parseNameStatus(nameStatus);
    const parsedNumstat = parseNumstat(numstat);
    return {
        patch,
        stats: {
            changedFiles: parsedNameStatuses.map((item) => item.path),
            nameStatuses: parsedNameStatuses,
            insertions: parsedNumstat.insertions,
            deletions: parsedNumstat.deletions,
            changedLines: parsedNumstat.insertions + parsedNumstat.deletions
        }
    };
}
export async function listUntrackedFiles(worktreePath) {
    const output = await runGit(["ls-files", "--others", "--exclude-standard"], worktreePath);
    return output
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map(toPosixPath);
}
export async function createGitWorktree(repoRoot, worktreePath, commitSha) {
    await serializeWorktreeOperation(repoRoot, () => runGit(["worktree", "add", "--detach", worktreePath, commitSha], repoRoot));
}
export async function removeGitWorktree(repoRoot, worktreePath) {
    await serializeWorktreeOperation(repoRoot, async () => {
        const result = await execa("git", ["worktree", "remove", "--force", worktreePath], {
            cwd: repoRoot,
            env: cleanGitEnvironment(),
            extendEnv: false,
            reject: false,
            windowsHide: true
        });
        if (result.exitCode !== 0) {
            await execa("git", ["worktree", "prune"], {
                cwd: repoRoot,
                env: cleanGitEnvironment(),
                extendEnv: false,
                reject: false,
                windowsHide: true
            });
        }
    });
}
export async function buildCommitCandidate(repoRoot, header, excludePatterns, preferMessages) {
    const parentSha = header.parentShas[0];
    if (parentSha === undefined) {
        return null;
    }
    const stats = await getDiffStats(repoRoot, parentSha, header.sha);
    const visibleFiles = stats.changedFiles.filter((filePath) => !matchesAnyPattern(filePath, excludePatterns));
    if (visibleFiles.length !== stats.changedFiles.length) {
        return null;
    }
    const warnings = taskWarnings(header.message, stats.nameStatuses);
    return {
        sha: header.sha,
        parentSha,
        message: header.message.trim(),
        timestamp: header.timestamp,
        changedFiles: stats.changedFiles,
        nameStatuses: stats.nameStatuses,
        insertions: stats.insertions,
        deletions: stats.deletions,
        changedLines: stats.changedLines,
        qualityScore: scoreCommitQuality(header.message, stats.changedFiles, stats.changedLines, preferMessages),
        warnings
    };
}
export function parseNameStatus(output) {
    return output
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
        const parts = line.split("\t");
        const status = parts[0] ?? "";
        const targetPath = parts[parts.length - 1] ?? "";
        return {
            status,
            path: toPosixPath(targetPath)
        };
    })
        .filter((item) => item.status.length > 0 && item.path.length > 0);
}
export function parseNumstat(output) {
    return output
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .reduce((accumulator, line) => {
        const [insertionsRaw, deletionsRaw] = line.split("\t");
        const insertions = insertionsRaw === "-" ? 0 : Number(insertionsRaw ?? "0");
        const deletions = deletionsRaw === "-" ? 0 : Number(deletionsRaw ?? "0");
        return {
            insertions: accumulator.insertions + (Number.isFinite(insertions) ? insertions : 0),
            deletions: accumulator.deletions + (Number.isFinite(deletions) ? deletions : 0)
        };
    }, { insertions: 0, deletions: 0 });
}
function normalizeStatusPath(statusPath) {
    const renamed = statusPath.includes(" -> ") ? (statusPath.split(" -> ").pop() ?? statusPath) : statusPath;
    return toPosixPath(renamed.replace(/^"|"$/g, ""));
}
function isGeneratedRepoRacerPath(filePath) {
    const normalized = toPosixPath(filePath);
    return normalized === ".reporacer" || normalized.startsWith(".reporacer/");
}
function listGitLfsPatterns(repoRoot) {
    const attributeFiles = findGitAttributeFiles(repoRoot);
    const patterns = [];
    for (const filePath of attributeFiles) {
        const directory = path.dirname(path.relative(repoRoot, filePath));
        const prefix = directory === "." ? "" : `${toPosixPath(directory)}/`;
        const content = readFileSync(filePath, "utf8");
        for (const line of content.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (trimmed.length === 0 || trimmed.startsWith("#") || !/\bfilter=lfs\b/.test(trimmed)) {
                continue;
            }
            patterns.push(`${prefix}${trimmed.split(/\s+/)[0] ?? ""}`.trim());
        }
    }
    return [...new Set(patterns.filter((item) => item.length > 0))].sort();
}
function findGitAttributeFiles(repoRoot) {
    const ignoredDirs = new Set([".git", ".reporacer", "node_modules", "dist", "coverage", "artifacts"]);
    const files = [];
    walk(repoRoot);
    return files;
    function walk(currentDir) {
        for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                if (!ignoredDirs.has(entry.name)) {
                    walk(path.join(currentDir, entry.name));
                }
                continue;
            }
            if (entry.name === ".gitattributes") {
                files.push(path.join(currentDir, entry.name));
            }
        }
    }
}
function serializeWorktreeOperation(repoRoot, operation) {
    const key = path.resolve(repoRoot);
    const previous = worktreeOperationQueues.get(key) ?? Promise.resolve();
    const run = previous.catch(() => undefined).then(operation);
    const queued = run.then(() => undefined, () => undefined);
    const cleanup = queued.finally(() => {
        if (worktreeOperationQueues.get(key) === cleanup) {
            worktreeOperationQueues.delete(key);
        }
    });
    worktreeOperationQueues.set(key, cleanup);
    return run;
}
function cleanGitEnvironment() {
    return Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "GIT_CONFIG_PARAMETERS" && !key.startsWith("GIT_")));
}
function scoreCommitQuality(message, changedFiles, changedLines, preferMessages) {
    const normalizedMessage = message.toLowerCase();
    let score = 35;
    if (message.trim().length >= 16) {
        score += 20;
    }
    if (preferMessages.some((token) => normalizedMessage.includes(token.toLowerCase()))) {
        score += 25;
    }
    if (changedFiles.length >= 1 && changedFiles.length <= 6) {
        score += 10;
    }
    if (changedLines > 0 && changedLines <= 300) {
        score += 10;
    }
    return Math.max(0, Math.min(100, score));
}
function taskWarnings(message, nameStatuses) {
    const warnings = [];
    if (message.trim().length < 16) {
        warnings.push("Commit message is short; task intent may be weak.");
    }
    if (nameStatuses.some((entry) => isTestFile(entry.path))) {
        warnings.push("Historical commit modified tests; evaluation may be stricter or less stable.");
    }
    return warnings;
}
function isTestFile(filePath) {
    const normalized = toPosixPath(filePath).toLowerCase();
    return (normalized.includes("/test/") ||
        normalized.includes("/tests/") ||
        normalized.endsWith(".test.ts") ||
        normalized.endsWith(".spec.ts") ||
        normalized.endsWith(".test.js") ||
        normalized.endsWith(".spec.js"));
}
//# sourceMappingURL=git.js.map