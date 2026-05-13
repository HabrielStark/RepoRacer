import { readJsonFile } from "../utils/json.js";
import { repoRacerPath } from "../utils/paths.js";
import { getRepoRoot } from "../core/git.js";
import { generateReport } from "../core/report-generator.js";
import { writeShareArtifacts } from "../core/share-generator.js";
import { loadConfig } from "../core/config.js";
export async function generateShareArtifacts(cwd = process.cwd()) {
    const repoRoot = await getRepoRoot(cwd);
    const config = await loadConfig(repoRoot);
    const summary = await readJsonFile(repoRacerPath(repoRoot, "summary.json"));
    const artifacts = config.share.generateMarkdown || config.share.generateBadge
        ? await writeShareArtifacts(repoRoot, summary, {
            markdown: config.share.generateMarkdown,
            badge: config.share.generateBadge
        })
        : { markdownPath: null, badgePath: null };
    const publicReportPath = config.share.publicReportDefaults
        ? await generateReport(repoRoot, summary.run.id, summary, {
            ...config.report,
            audience: "public",
            includeLogs: false,
            includePatchPreview: false,
            redactReport: true
        }, "public-report.html")
        : null;
    if (artifacts.markdownPath === null && artifacts.badgePath === null && publicReportPath === null) {
        throw new Error("Share artifact generation is disabled by share.* config.");
    }
    return { ...artifacts, publicReportPath };
}
//# sourceMappingURL=share.js.map