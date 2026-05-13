import { describe, expect, it, vi } from "vitest";
import { RepoRacerError, toErrorMessage } from "../../src/utils/errors.js";
import { renderTable } from "../../src/utils/table.js";
import { formatDuration, makeRunId, nowIso } from "../../src/utils/time.js";

describe("utility contracts", () => {
  it("renders stable plain-text tables with padded columns and missing cells", () => {
    expect(
      renderTable(
        ["Agent", "Score", "Status"],
        [
          ["codex", "100", "completed"],
          ["claude", "95"],
          ["custom-long", "7", "risk_blocked"]
        ]
      )
    ).toBe(
      [
        "Agent        Score  Status      ",
        "-----------  -----  ------------",
        "codex        100    completed   ",
        "claude       95   ",
        "custom-long  7      risk_blocked"
      ].join("\n")
    );
  });

  it("preserves structured RepoRacer errors and normalizes unknown failures", () => {
    const error = new RepoRacerError("CONFIG_INVALID", "Invalid config");

    expect(error.name).toBe("RepoRacerError");
    expect(error.code).toBe("CONFIG_INVALID");
    expect(error.message).toBe("Invalid config");
    expect(toErrorMessage(error)).toBe("Invalid config");
    expect(toErrorMessage("plain failure")).toBe("plain failure");
    expect(toErrorMessage({ unexpected: true })).toBe("Unknown error");
  });

  it("formats durations for millisecond, second, and minute ranges", () => {
    expect(formatDuration(999)).toBe("999ms");
    expect(formatDuration(1000)).toBe("1s");
    expect(formatDuration(59_499)).toBe("59s");
    expect(formatDuration(61_200)).toBe("1m 1s");
    expect(formatDuration(125_500)).toBe("2m 6s");
  });

  it("generates ISO timestamps and sortable run ids", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.123456789);

    expect(nowIso()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(makeRunId(new Date("2026-05-12T03:04:05.678Z"))).toBe("run-20260512-030405-678Z-4fzzzx");
  });
});
