import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { configPath, createDefaultConfig, loadConfig, parseConfig, saveConfig } from "../../src/core/config.js";

describe("configuration loading and detection", () => {
  it("detects pnpm projects and deep-merges saved user config with defaults", async () => {
    const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-config-pnpm-"));
    await fs.writeFile(
      path.join(repoRoot, "package.json"),
      JSON.stringify({ scripts: { test: "vitest run" } }, null, 2),
      "utf8"
    );
    await fs.writeFile(path.join(repoRoot, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n", "utf8");

    const defaults = await createDefaultConfig(repoRoot);
    expect(defaults.installCommand).toBe("pnpm install --frozen-lockfile");
    expect(defaults.testCommand).toBe("pnpm test");

    const savedPath = await saveConfig(
      repoRoot,
      parseConfig({
        ...defaults,
        report: { ...defaults.report, includeLogs: false },
        agents: [{ name: "custom", enabled: true, command: "node agent.cjs", timeoutMinutes: 5 }]
      }),
      true
    );

    expect(savedPath).toBe(configPath(repoRoot));
    await expect(saveConfig(repoRoot, defaults, false)).rejects.toThrow(/Config already exists/);

    const loaded = await loadConfig(repoRoot);
    expect(loaded.report.includeLogs).toBe(false);
    expect(loaded.report.includePatchPreview).toBe(true);
    expect(loaded.agents).toEqual([{ name: "custom", enabled: true, command: "node agent.cjs", timeoutMinutes: 5 }]);
  });

  it("detects package manager and language test command fallbacks", async () => {
    const npmRepo = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-config-npm-"));
    await fs.writeFile(path.join(npmRepo, "package.json"), JSON.stringify({ scripts: { test: "node test.js" } }));
    await fs.writeFile(path.join(npmRepo, "package-lock.json"), "{}\n", "utf8");
    await expect(createDefaultConfig(npmRepo)).resolves.toMatchObject({
      installCommand: "npm install",
      testCommand: "npm test"
    });

    const yarnRepo = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-config-yarn-"));
    await fs.writeFile(path.join(yarnRepo, "package.json"), JSON.stringify({ scripts: { test: "node test.js" } }));
    await fs.writeFile(path.join(yarnRepo, "yarn.lock"), "# yarn\n", "utf8");
    await expect(createDefaultConfig(yarnRepo)).resolves.toMatchObject({
      installCommand: "yarn install",
      testCommand: "yarn test"
    });

    const pytestRepo = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-config-pytest-"));
    await fs.writeFile(path.join(pytestRepo, "pytest.ini"), "[pytest]\n", "utf8");
    await expect(createDefaultConfig(pytestRepo)).resolves.toMatchObject({
      installCommand: null,
      testCommand: "python -m pytest"
    });

    const rustRepo = await fs.mkdtemp(path.join(os.tmpdir(), "reporacer-config-rust-"));
    await fs.writeFile(path.join(rustRepo, "Cargo.toml"), '[package]\nname = "demo"\n', "utf8");
    await expect(createDefaultConfig(rustRepo)).resolves.toMatchObject({
      installCommand: null,
      testCommand: "cargo test"
    });
  });
});
