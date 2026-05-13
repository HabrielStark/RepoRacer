export function scoreResult(input) {
    const tests = testScore(input.tests);
    const hiddenTests = input.hiddenTests === null ? tests : testScore(input.hiddenTests);
    const patchSimilarity = patchSimilarityScore(input.humanPatch, input.agentPatch);
    const changedFilesOverlap = changedFilesOverlapScore(input.task.changedFiles, input.diff.changedFiles);
    const diffSize = diffSizeScore(input.task.changedLines, input.diff.changedLines);
    const minimality = minimalityScore(input.task.changedFiles.length, input.diff.changedFiles.length, input.task.changedLines, input.diff.changedLines);
    const speed = speedScore(input.durationMs, input.timeoutMs);
    const riskPenalty = riskPenaltyScore(input.risks);
    const testSignal = input.hiddenTests === null ? tests : tests * 0.35 + hiddenTests * 0.65;
    const weighted = testSignal * 0.38 +
        patchSimilarity * 0.2 +
        changedFilesOverlap * 0.16 +
        diffSize * 0.08 +
        minimality * 0.08 +
        speed * 0.05 +
        5;
    const final = Math.max(0, Math.min(100, Math.round(weighted - riskPenalty)));
    const solved = input.status === "completed" &&
        final >= 60 &&
        !input.risks.some((risk) => risk.level === "critical") &&
        (input.tests.skipped || input.tests.passed) &&
        (input.hiddenTests === null || input.hiddenTests.skipped || input.hiddenTests.passed);
    return {
        final,
        tests,
        hiddenTests,
        patchSimilarity,
        changedFilesOverlap,
        diffSize,
        minimality,
        speed,
        riskPenalty,
        solved
    };
}
export function testScore(result) {
    if (result.skipped) {
        return 40;
    }
    return result.passed ? 100 : 0;
}
export function changedFilesOverlapScore(expectedFiles, actualFiles) {
    if (actualFiles.length === 0) {
        return 0;
    }
    const expected = new Set(expectedFiles);
    const actual = new Set(actualFiles);
    const intersection = [...actual].filter((filePath) => expected.has(filePath)).length;
    const union = new Set([...expected, ...actual]).size;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
}
export function patchSimilarityScore(humanPatch, agentPatch) {
    const human = normalizedPatchLines(humanPatch);
    const agent = normalizedPatchLines(agentPatch);
    if (human.size === 0 || agent.size === 0) {
        return 0;
    }
    const intersection = [...agent].filter((line) => human.has(line)).length;
    const union = new Set([...human, ...agent]).size;
    return union === 0 ? 0 : Math.round((intersection / union) * 100);
}
export function diffSizeScore(expectedLines, actualLines) {
    if (actualLines === 0) {
        return 0;
    }
    if (expectedLines === 0) {
        return actualLines <= 20 ? 80 : 40;
    }
    const ratio = actualLines / expectedLines;
    if (ratio >= 0.5 && ratio <= 1.75) {
        return 100;
    }
    if (ratio < 0.5) {
        return Math.max(20, Math.round(ratio * 100));
    }
    return Math.max(0, Math.round(100 - (ratio - 1.75) * 35));
}
export function minimalityScore(expectedFiles, actualFiles, expectedLines, actualLines) {
    if (actualFiles === 0 || actualLines === 0) {
        return 0;
    }
    const filePenalty = Math.max(0, actualFiles - Math.max(1, expectedFiles)) * 8;
    const lineRatio = expectedLines === 0 ? actualLines / 20 : actualLines / Math.max(1, expectedLines);
    const linePenalty = lineRatio <= 1.5 ? 0 : Math.round((lineRatio - 1.5) * 18);
    return Math.max(0, Math.min(100, 100 - filePenalty - linePenalty));
}
export function speedScore(durationMs, timeoutMs) {
    if (timeoutMs <= 0) {
        return 50;
    }
    const ratio = durationMs / timeoutMs;
    if (ratio <= 0.2) {
        return 100;
    }
    if (ratio >= 1) {
        return 0;
    }
    return Math.max(0, Math.round(100 - ((ratio - 0.2) / 0.8) * 100));
}
export function riskPenaltyScore(risks) {
    return Math.min(100, risks.reduce((total, risk) => {
        if (risk.level === "critical") {
            return total + 100;
        }
        if (risk.level === "high") {
            return total + 30;
        }
        if (risk.level === "medium") {
            return total + 15;
        }
        return total + 5;
    }, 0));
}
function normalizedPatchLines(patch) {
    return new Set(patch
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith("+") || line.startsWith("-"))
        .filter((line) => !line.startsWith("+++") && !line.startsWith("---"))
        .filter((line) => line.length > 1));
}
//# sourceMappingURL=scorer.js.map