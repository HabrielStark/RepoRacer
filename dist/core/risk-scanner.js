import { toPosixPath } from "../utils/paths.js";
export function scanRisks(diff, config, fullPatch = diff.patchPreview) {
    const flags = [];
    for (const filePath of diff.changedFiles) {
        const normalized = toPosixPath(filePath);
        if (normalized === ".reporacer" || normalized.startsWith(".reporacer/")) {
            flags.push({
                level: "critical",
                code: "REPORACER_CHANGED",
                message: "Agent modified RepoRacer generated data.",
                file: filePath
            });
        }
        if (config.riskRules.failOnEnvFileChanges && isEnvFile(normalized)) {
            flags.push({
                level: "critical",
                code: "ENV_FILE_CHANGED",
                message: "Agent changed an environment or secret-bearing file.",
                file: filePath
            });
        }
        if (config.riskRules.failOnCiWeakening && isCiFile(normalized) && ciLooksWeakened(fullPatch)) {
            flags.push({
                level: "critical",
                code: "CI_WEAKENED",
                message: "Agent changed CI in a way that may weaken validation.",
                file: filePath
            });
        }
        if (config.riskRules.failOnTestWeakening && isTestFile(normalized) && testLooksWeakened(fullPatch)) {
            flags.push({
                level: "critical",
                code: "TEST_WEAKENED",
                message: "Agent changed tests in a way that may weaken validation.",
                file: filePath
            });
        }
    }
    for (const nameStatus of diff.nameStatuses) {
        if (config.riskRules.failOnTestDeletion && nameStatus.status.startsWith("D") && isTestFile(nameStatus.path)) {
            flags.push({
                level: "critical",
                code: "TEST_DELETED",
                message: "Agent deleted a test file.",
                file: nameStatus.path
            });
        }
    }
    if (config.riskRules.warnOnLargeDiff && diff.changedLines > config.riskRules.maxDiffLines) {
        flags.push({
            level: "medium",
            code: "LARGE_DIFF",
            message: `Agent diff has ${diff.changedLines} changed lines, above configured limit ${config.riskRules.maxDiffLines}.`
        });
    }
    if (containsSecretPattern(fullPatch)) {
        flags.push({
            level: "high",
            code: "SECRET_PATTERN",
            message: "Patch contains a string that looks like a secret; previews are redacted, but the patch should be reviewed."
        });
    }
    return dedupeFlags(flags);
}
export function hasCriticalRisk(flags) {
    return flags.some((flag) => flag.level === "critical");
}
function isEnvFile(filePath) {
    const basename = filePath.split("/").pop()?.toLowerCase() ?? filePath.toLowerCase();
    return basename === ".env" || basename.startsWith(".env.") || basename.endsWith(".pem") || basename.endsWith(".key");
}
function isCiFile(filePath) {
    return filePath.startsWith(".github/workflows/") || filePath.includes("/.github/workflows/");
}
function isTestFile(filePath) {
    const normalized = filePath.toLowerCase();
    return (normalized.includes("/test/") ||
        normalized.includes("/tests/") ||
        normalized.endsWith(".test.ts") ||
        normalized.endsWith(".spec.ts") ||
        normalized.endsWith(".test.js") ||
        normalized.endsWith(".spec.js") ||
        normalized.endsWith("_test.py"));
}
function ciLooksWeakened(patch) {
    const normalized = patch.toLowerCase();
    return (normalized.includes("continue-on-error: true") ||
        normalized.includes("--passwithnotests") ||
        normalized.includes("|| true") ||
        normalized.includes("skip ci") ||
        normalized.includes("npm test -- --watch=false || true"));
}
function testLooksWeakened(patch) {
    const normalized = patch.toLowerCase();
    return (normalized.includes(".skip(") ||
        normalized.includes("describe.skip") ||
        normalized.includes("it.skip") ||
        normalized.includes("test.skip") ||
        normalized.includes("xit(") ||
        normalized.includes("xtest(") ||
        normalized.includes("return true") ||
        normalized.includes("assert.skip") ||
        normalized.includes("pytest.skip"));
}
function containsSecretPattern(patchPreview) {
    return (/\[REDACTED_(?:API_KEY|TOKEN|PRIVATE_KEY|GITHUB_TOKEN|AWS_ACCESS_KEY|CREDENTIALS)\]/.test(patchPreview) ||
        /\b(?:sk-[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/.test(patchPreview) ||
        /^[+\-\s]*[A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|ACCESS_KEY)[A-Za-z0-9_]*\s*=/im.test(patchPreview) ||
        /\b(?:token|secret|password|api[_-]?key)\b\s*[:=]/i.test(patchPreview));
}
function dedupeFlags(flags) {
    const seen = new Set();
    return flags.filter((flag) => {
        const key = `${flag.code}:${flag.file ?? ""}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
//# sourceMappingURL=risk-scanner.js.map