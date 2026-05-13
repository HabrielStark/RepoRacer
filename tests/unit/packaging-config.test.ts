import { describe, expect, it } from "vitest";
import { execa } from "execa";
import { promises as fs } from "node:fs";
import path from "node:path";
import { parseConfig } from "../../src/core/config.js";
import { renderConfigJsonSchema } from "../../src/core/schema-generator.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

const expectedRuntimeExports = [
  "buildJudgePrompt",
  "buildRepairPrompt",
  "createDefaultConfig",
  "generateCiTemplate",
  "generateConfigSchema",
  "generateReport",
  "generateShareArtifacts",
  "initRepoRacer",
  "loadConfig",
  "mineTasks",
  "renderBadgeSvg",
  "renderConfigJsonSchema",
  "renderGitHubAction",
  "renderShareMarkdown",
  "repoRacerResultSchema",
  "repoRacerSummarySchema",
  "runRepoRacer",
  "saveConfig"
] as const;

describe("packaging and config contracts", () => {
  it("parses the documented example config with the current runtime schema", async () => {
    const raw = JSON.parse(await fs.readFile(path.join(repoRoot, "examples", "config.json"), "utf8")) as unknown;
    const parsed = parseConfig(raw);

    expect(parsed.version).toBe(1);
    expect(parsed.baselineCheck).toBe(true);
    expect(parsed.agents.map((agent) => agent.name)).toContain("codex");
    expect(parsed.report.redactReport).toBe(true);
  });

  it("emits a strict config JSON schema covering every top-level config key", async () => {
    const config = parseConfig(
      JSON.parse(await fs.readFile(path.join(repoRoot, "examples", "config.json"), "utf8")) as unknown
    );
    const schema = JSON.parse(renderConfigJsonSchema()) as {
      additionalProperties?: boolean;
      properties?: Record<string, unknown>;
    };

    expect(schema.additionalProperties).toBe(false);
    expect(Object.keys(schema.properties ?? {}).sort()).toEqual(Object.keys(config).sort());
  });

  it("imports the built dist public API and exposes the 1.0 commands", async () => {
    const api = (await import(path.join(repoRoot, "dist", "index.js"))) as Record<string, unknown>;
    const help = await execa("node", [path.join(repoRoot, "dist", "cli.js"), "--help"], { cwd: repoRoot });
    const version = await execa("node", [path.join(repoRoot, "dist", "cli.js"), "--version"], { cwd: repoRoot });

    expect(Object.keys(api).sort()).toEqual([...expectedRuntimeExports].sort());
    for (const exportName of expectedRuntimeExports) {
      expect(api[exportName], exportName).toBeDefined();
    }
    expect(version.stdout.trim()).toBe("1.0.0");
    expect(help.stdout).toContain("ci");
    expect(help.stdout).toContain("share");
    expect(help.stdout).toContain("schema");
  });
});
