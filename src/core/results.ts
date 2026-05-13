import path from "node:path";
import { LeaderboardRow, RepoRacerResult, RepoRacerSummary } from "../schemas/types.js";
import { appendJsonlFile, writeJsonFile, writeJsonlFile } from "../utils/json.js";
import { currentPath, repoRacerPath } from "../utils/paths.js";
import { ensureDir } from "./fs-safe.js";

export async function writeResult(repoRoot: string, runId: string, result: RepoRacerResult): Promise<void> {
  const latest = repoRacerPath(repoRoot, "results.jsonl");
  const current = currentPath(repoRoot, "results.jsonl");
  const run = repoRacerPath(repoRoot, "runs", runId, "results.jsonl");
  await Promise.all([ensureDir(path.dirname(latest)), ensureDir(path.dirname(current)), ensureDir(path.dirname(run))]);
  await Promise.all([appendJsonlFile(latest, result), appendJsonlFile(current, result), appendJsonlFile(run, result)]);
}

export async function resetResultFiles(repoRoot: string, runId: string): Promise<void> {
  const paths = [
    repoRacerPath(repoRoot, "results.jsonl"),
    currentPath(repoRoot, "results.jsonl"),
    repoRacerPath(repoRoot, "runs", runId, "results.jsonl")
  ];
  for (const filePath of paths) {
    await ensureDir(path.dirname(filePath));
    await writeJsonlFile(filePath, []);
  }
}

export function buildLeaderboard(results: RepoRacerResult[]): LeaderboardRow[] {
  const groups = new Map<string, RepoRacerResult[]>();
  for (const result of results) {
    const group = groups.get(result.agentName) ?? [];
    group.push(result);
    groups.set(result.agentName, group);
  }
  return [...groups.entries()]
    .map(([agent, agentResults]) => {
      const solved = agentResults.filter((result) => result.scores.solved).length;
      const testsWithCommand = agentResults.filter((result) => !result.tests.skipped);
      const testsPassed = testsWithCommand.filter(
        (result) =>
          result.tests.passed &&
          (result.hiddenTests === null || result.hiddenTests.skipped || result.hiddenTests.passed)
      ).length;
      const totalScore = agentResults.reduce((total, result) => total + result.scores.final, 0);
      const riskFlags = agentResults.reduce((total, result) => total + result.risks.length, 0);
      const totalDurationMs = agentResults.reduce((total, result) => total + result.durationMs, 0);
      return {
        agent,
        solved,
        total: agentResults.length,
        averageScore: agentResults.length === 0 ? 0 : Math.round(totalScore / agentResults.length),
        testsPassedRate: testsWithCommand.length === 0 ? 0 : testsPassed / testsWithCommand.length,
        riskFlags,
        totalDurationMs
      };
    })
    .sort(
      (left, right) =>
        right.solved - left.solved || right.averageScore - left.averageScore || left.riskFlags - right.riskFlags
    );
}

export function winnerFromLeaderboard(leaderboard: LeaderboardRow[]): string | null {
  return leaderboard[0]?.agent ?? null;
}

export async function writeSummary(repoRoot: string, runId: string, summary: RepoRacerSummary): Promise<void> {
  const latest = repoRacerPath(repoRoot, "summary.json");
  const current = currentPath(repoRoot, "summary.json");
  const run = repoRacerPath(repoRoot, "runs", runId, "summary.json");
  await Promise.all([ensureDir(path.dirname(latest)), ensureDir(path.dirname(current)), ensureDir(path.dirname(run))]);
  await Promise.all([writeJsonFile(latest, summary), writeJsonFile(current, summary), writeJsonFile(run, summary)]);
}
