import { RepoRacerSummary } from "../schemas/types.js";
import { redactSecrets } from "../core/process-safe.js";
import { formatDuration } from "../utils/time.js";
import { reportStyles } from "./styles.js";

export interface RenderReportOptions {
  includeLogs: boolean;
  includePatchPreview: boolean;
  redactSecrets: boolean;
  maxLogPreviewChars: number;
  maxPatchPreviewChars: number;
}

export function renderReportHtml(
  summary: RepoRacerSummary,
  options: RenderReportOptions = {
    includeLogs: true,
    includePatchPreview: true,
    redactSecrets: true,
    maxLogPreviewChars: 20000,
    maxPatchPreviewChars: 12000
  }
): string {
  const winner = summary.winner ?? "No winner";
  const taskCount = summary.run.tasks;
  const agentCount = summary.run.agents.length;
  const resultCount = summary.results.length;
  const riskCount = summary.results.reduce((total, result) => total + result.risks.length, 0);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RepoRacer Report</title>
  <style>${reportStyles}</style>
</head>
<body>
  <header>
    <div class="wrap">
      <div class="eyebrow">RepoRacer</div>
      <h1>Your git history is the benchmark.</h1>
      <div class="subtitle">Local benchmark results for ${escapeHtml(scrub(summary.repo.name, options))}. Winner: ${escapeHtml(scrub(winner, options))}.</div>
      <div class="meta">
        <span class="pill">Run ${escapeHtml(summary.run.id)}</span>
        <span class="pill">${taskCount} tasks</span>
        <span class="pill">${agentCount} agents</span>
        <span class="pill">${resultCount} results</span>
      </div>
    </div>
  </header>
  <main>
    <div class="wrap">
      <section class="grid" aria-label="Summary metrics">
        <div class="card"><div class="metric">Winner</div><div class="value">${escapeHtml(scrub(winner, options))}</div></div>
        <div class="card"><div class="metric">Tasks</div><div class="value">${taskCount}</div></div>
        <div class="card"><div class="metric">Agents</div><div class="value">${agentCount}</div></div>
        <div class="card"><div class="metric">Risk Flags</div><div class="value">${riskCount}</div></div>
      </section>
      <h2>Leaderboard</h2>
      ${renderLeaderboard(summary, options)}
      <h2>Task Results</h2>
      ${renderResults(summary, options)}
    </div>
  </main>
</body>
</html>`;
}

function renderLeaderboard(summary: RepoRacerSummary, options: RenderReportOptions): string {
  const rows = summary.leaderboard
    .map(
      (row) => `<tr>
        <td><strong>${escapeHtml(scrub(row.agent, options))}</strong></td>
        <td>${row.solved}/${row.total}</td>
        <td>${row.averageScore}</td>
        <td>${Math.round(row.testsPassedRate * 100)}%</td>
        <td>${row.riskFlags}</td>
        <td>${formatDuration(row.totalDurationMs)}</td>
      </tr>`
    )
    .join("");
  return `<table>
    <thead><tr><th>Agent</th><th>Solved</th><th>Avg Score</th><th>Tests</th><th>Risks</th><th>Time</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderResults(summary: RepoRacerSummary, options: RenderReportOptions): string {
  const rows = summary.results
    .map(
      (result) => `<tr>
        <td>${escapeHtml(scrub(result.taskId, options))}</td>
        <td><strong>${escapeHtml(scrub(result.agentName, options))}</strong></td>
        <td><span class="status ${escapeAttribute(result.status)}">${escapeHtml(result.status)}</span></td>
        <td>${result.scores.final}</td>
        <td>${result.scores.patchSimilarity}%</td>
        <td>${result.scores.changedFilesOverlap}%</td>
        <td>${renderTestCell(result)}</td>
        <td>${renderRisks(result.risks)}</td>
        <td>
          <div class="muted">${escapeHtml(scrub(result.diff.changedFiles.join(", ") || "no changed files", options))}</div>
          ${options.includePatchPreview ? `<details><summary>Patch preview</summary><pre>${escapeHtml(truncate(scrub(result.diff.patchPreview, options), options.maxPatchPreviewChars))}</pre></details>` : ""}
          ${options.includeLogs ? `<details><summary>Test output</summary><pre>${escapeHtml(truncate(scrub(result.tests.output, options), options.maxLogPreviewChars))}</pre></details>` : ""}
        </td>
      </tr>`
    )
    .join("");
  return `<table>
    <thead><tr><th>Task</th><th>Agent</th><th>Status</th><th>Score</th><th>Patch</th><th>Files</th><th>Tests</th><th>Risks</th><th>Details</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderRisks(risks: readonly { level: string; code: string; message: string; file?: string }[]): string {
  if (risks.length === 0) {
    return '<span class="muted">none</span>';
  }
  return risks
    .map(
      (risk) =>
        `<div class="risk"><strong>${escapeHtml(risk.level)}</strong> ${escapeHtml(risk.code)}<br /><span class="muted">${escapeHtml(risk.message)}${risk.file === undefined ? "" : `: ${escapeHtml(risk.file)}`}</span></div>`
    )
    .join("");
}

function renderTestCell(result: {
  tests: { skipped: boolean; passed: boolean };
  hiddenTests: { skipped: boolean; passed: boolean } | null;
}): string {
  const primary = result.tests.skipped ? "skipped" : result.tests.passed ? "passed" : "failed";
  if (result.hiddenTests === null) {
    return primary;
  }
  const hidden = result.hiddenTests.skipped
    ? "hidden skipped"
    : result.hiddenTests.passed
      ? "hidden passed"
      : "hidden failed";
  return `${escapeHtml(primary)}<br /><span class="muted">${escapeHtml(hidden)}</span>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function scrub(value: string, options: RenderReportOptions): string {
  return options.redactSecrets ? redactSecrets(value) : value;
}

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, maxChars)}\n... truncated ${value.length - maxChars} characters ...`;
}
