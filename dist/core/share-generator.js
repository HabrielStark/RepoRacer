import path from "node:path";
import { repoRacerPath } from "../utils/paths.js";
import { ensureDir, writeGeneratedFile } from "./fs-safe.js";
import { redactSecrets } from "./process-safe.js";
export function renderShareMarkdown(summary) {
    const winner = redactSecrets(summary.winner ?? "none");
    const rows = summary.leaderboard
        .map((row) => `| ${escapePipe(redactSecrets(row.agent))} | ${row.solved}/${row.total} | ${row.averageScore} | ${Math.round(row.testsPassedRate * 100)}% | ${row.riskFlags} |`)
        .join("\n");
    return `# RepoRacer Results

Winner: **${escapeMarkdown(winner)}**

| Agent | Solved | Score | Tests | Risks |
| --- | ---: | ---: | ---: | ---: |
${rows}

Generated locally by RepoRacer. Review private code, logs, and patches before publishing any report artifacts.
`;
}
export function renderBadgeSvg(summary) {
    const winner = encodeXml(redactSecrets(summary.winner ?? "none"));
    const label = "RepoRacer";
    const value = `winner: ${winner}`;
    const labelWidth = 78;
    const valueWidth = Math.max(88, value.length * 7);
    const totalWidth = labelWidth + valueWidth;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-color="#000" stop-opacity=".3"/>
    <stop offset="1" stop-color="#000" stop-opacity=".5"/>
  </linearGradient>
  <rect rx="3" width="${totalWidth}" height="20" fill="#08111f"/>
  <rect rx="3" x="${labelWidth}" width="${valueWidth}" height="20" fill="#1769e0"/>
  <rect rx="3" width="${totalWidth}" height="20" fill="url(#s)"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15">${value}</text>
  </g>
</svg>
`;
}
export async function writeShareArtifacts(repoRoot, summary, options = { markdown: true, badge: true }) {
    const markdownPath = repoRacerPath(repoRoot, "share.md");
    const badgePath = repoRacerPath(repoRoot, "badge.svg");
    await ensureDir(path.dirname(markdownPath));
    if (options.markdown) {
        await writeGeneratedFile(repoRoot, markdownPath, renderShareMarkdown(summary));
    }
    if (options.badge) {
        await writeGeneratedFile(repoRoot, badgePath, renderBadgeSvg(summary));
    }
    return {
        markdownPath: options.markdown ? markdownPath : null,
        badgePath: options.badge ? badgePath : null
    };
}
function escapePipe(value) {
    return escapeMarkdown(value).replace(/\|/g, "\\|");
}
function escapeMarkdown(value) {
    return value.replace(/[\\`*_{}[\]()#+.!-]/g, "\\$&");
}
function encodeXml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
//# sourceMappingURL=share-generator.js.map