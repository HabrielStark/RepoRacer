import path from "node:path";
import { getRepoRoot, runGit } from "../core/git.js";
import { pathExists, removeGeneratedPath } from "../core/fs-safe.js";
import { repoRacerDir, repoRacerPath } from "../utils/paths.js";
export async function cleanRepoRacer(options = {}) {
    const repoRoot = await getRepoRoot(options.cwd ?? process.cwd());
    const base = repoRacerDir(repoRoot);
    if (!(await pathExists(base))) {
        return [];
    }
    const fullTargets = [
        "current",
        "runs",
        "patches",
        "logs",
        "cache",
        "tasks.jsonl",
        "results.jsonl",
        "summary.json",
        "report.html",
        "public-report.html",
        "share.md",
        "badge.svg",
        "github-action.yml",
        "config.schema.json",
        "run-config.snapshot.json",
        "last-run.txt"
    ];
    const targets = options.all ? fullTargets : ["current"];
    if (options.config) {
        targets.push("config.json");
    }
    const removed = [];
    for (const target of targets) {
        const fullPath = repoRacerPath(repoRoot, target);
        if (await pathExists(fullPath)) {
            await removeGeneratedPath(repoRoot, fullPath);
            removed.push(path.relative(repoRoot, fullPath));
        }
    }
    await runGit(["worktree", "prune"], repoRoot);
    if (options.all && options.config) {
        const remaining = await pathExists(base);
        if (remaining) {
            await removeGeneratedPath(repoRoot, base);
            removed.push(path.relative(repoRoot, base));
        }
    }
    return removed;
}
//# sourceMappingURL=clean.js.map