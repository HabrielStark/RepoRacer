import path from "node:path";
import open from "open";
import { repoRacerPath } from "../utils/paths.js";
import { pathExists, writeGeneratedFile } from "./fs-safe.js";
import { renderReportHtml } from "../report/template.js";
export async function generateReport(repoRoot, runId, summary, reportConfig, outputName = "report.html") {
    const safeOutputName = validateReportOutputName(outputName);
    const effectiveReportConfig = normalizeReportConfig(reportConfig);
    const html = renderReportHtml(summary, {
        includeLogs: effectiveReportConfig.includeLogs,
        includePatchPreview: effectiveReportConfig.includePatchPreview,
        redactSecrets: effectiveReportConfig.redactReport,
        maxLogPreviewChars: effectiveReportConfig.maxLogPreviewChars,
        maxPatchPreviewChars: effectiveReportConfig.maxPatchPreviewChars
    });
    const latest = repoRacerPath(repoRoot, safeOutputName);
    const current = repoRacerPath(repoRoot, "current", safeOutputName);
    const run = repoRacerPath(repoRoot, "runs", runId, safeOutputName);
    await Promise.all([
        writeGeneratedFile(repoRoot, latest, html),
        writeGeneratedFile(repoRoot, current, html),
        writeGeneratedFile(repoRoot, run, html)
    ]);
    return latest;
}
function normalizeReportConfig(reportConfig) {
    const base = {
        includeLogs: reportConfig?.includeLogs ?? true,
        includePatchPreview: reportConfig?.includePatchPreview ?? true,
        redactReport: reportConfig?.redactReport ?? true,
        maxLogPreviewChars: reportConfig?.maxLogPreviewChars ?? 20000,
        maxPatchPreviewChars: reportConfig?.maxPatchPreviewChars ?? 12000
    };
    if (reportConfig?.audience !== "public") {
        return base;
    }
    return {
        ...base,
        includeLogs: false,
        includePatchPreview: false,
        redactReport: true
    };
}
export async function openReport(repoRoot) {
    const reportPath = repoRacerPath(repoRoot, "report.html");
    if (!(await pathExists(reportPath))) {
        throw new Error(`Report not found: ${reportPath}`);
    }
    await open(reportPath);
    return reportPath;
}
function validateReportOutputName(outputName) {
    if (outputName.length === 0 ||
        path.isAbsolute(outputName) ||
        outputName !== path.basename(outputName) ||
        outputName.includes("/") ||
        outputName.includes("\\") ||
        !outputName.endsWith(".html")) {
        throw new Error(`Invalid report output filename: ${outputName}`);
    }
    return outputName;
}
//# sourceMappingURL=report-generator.js.map