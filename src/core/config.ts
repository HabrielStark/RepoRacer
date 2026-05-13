import { promises as fs } from "node:fs";
import path from "node:path";
import { repoRacerConfigSchema } from "../schemas/config.schema.js";
import { AgentConfig, RepoRacerConfig } from "../schemas/types.js";
import { readJsonFile, writeJsonFile } from "../utils/json.js";
import { repoRacerPath } from "../utils/paths.js";
import { ensureDir, pathExists } from "./fs-safe.js";

export function configPath(repoRoot: string): string {
  return repoRacerPath(repoRoot, "config.json");
}

export async function createDefaultConfig(repoRoot: string): Promise<RepoRacerConfig> {
  const packageManager = await detectPackageManager(repoRoot);
  const testCommand = await detectTestCommand(repoRoot, packageManager);
  return {
    version: 1,
    testCommand,
    installCommand:
      packageManager === null
        ? null
        : `${packageManager} install${packageManager === "pnpm" ? " --frozen-lockfile" : ""}`,
    maxTasks: 10,
    timeoutMinutesPerAgent: 12,
    parallelAgents: 2,
    parallelTasks: 1,
    baselineCheck: true,
    evaluationMode: "working-tree",
    keepWorktrees: false,
    commitSelection: {
      lookback: 100,
      minChangedFiles: 1,
      maxChangedFiles: 8,
      maxChangedLines: 500,
      excludeMergeCommits: true,
      excludePatterns: [
        "package-lock.json",
        "pnpm-lock.yaml",
        "yarn.lock",
        "dist/**",
        "build/**",
        "coverage/**",
        "*.png",
        "*.jpg",
        "*.jpeg",
        "*.gif",
        "*.mp4",
        "*.zip"
      ],
      preferMessages: ["fix", "bug", "handle", "prevent", "support", "add test", "refactor"]
    },
    hiddenTests: {
      enabled: false,
      includePatterns: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.test.js",
        "**/*.spec.js",
        "tests/**",
        "test/**",
        "**/*_test.py"
      ]
    },
    sandbox: {
      mode: "none",
      dockerImage: "node:20-bookworm",
      network: "default",
      cpus: 2,
      memory: "4g"
    },
    agents: [
      {
        name: "fake-success",
        enabled: true
      },
      {
        name: "fake-noop",
        enabled: true
      },
      {
        name: "fake-timeout",
        enabled: false
      },
      {
        name: "codex",
        command: "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}",
        enabled: false
      },
      {
        name: "claude",
        command: "claude -p < {{promptFile}}",
        enabled: false
      },
      {
        name: "gemini",
        command: "gemini --approval-mode auto_edit < {{promptFile}}",
        enabled: false
      },
      {
        name: "aider",
        command: "aider --message-file {{promptFile}}",
        enabled: false
      },
      {
        name: "opencode",
        command: 'opencode run --file {{promptFile}} "Follow the attached RepoRacer task prompt exactly."',
        enabled: false
      },
      {
        name: "custom",
        command: "echo Configure a real agent command in .reporacer/config.json && exit 1",
        enabled: false
      }
    ],
    riskRules: {
      failOnTestDeletion: true,
      failOnTestWeakening: true,
      failOnCiWeakening: true,
      failOnEnvFileChanges: true,
      warnOnLargeDiff: true,
      maxDiffLines: 800
    },
    report: {
      openAfterRun: false,
      includeLogs: true,
      includePatchPreview: true,
      audience: "private",
      redactReport: true,
      maxLogPreviewChars: 20000,
      maxPatchPreviewChars: 12000
    },
    ci: {
      generateGitHubAction: true,
      defaultAgents: ["fake-success", "fake-noop"],
      defaultTasks: 5
    },
    share: {
      generateMarkdown: true,
      generateBadge: true,
      publicReportDefaults: true
    }
  };
}

export async function saveConfig(repoRoot: string, config: RepoRacerConfig, force: boolean): Promise<string> {
  const target = configPath(repoRoot);
  await ensureDir(path.dirname(target));
  if (!force && (await pathExists(target))) {
    throw new Error(`Config already exists: ${target}`);
  }
  await writeJsonFile(target, config);
  return target;
}

export async function loadConfig(repoRoot: string): Promise<RepoRacerConfig> {
  const target = configPath(repoRoot);
  const defaults = await createDefaultConfig(repoRoot);
  if (!(await pathExists(target))) {
    return defaults;
  }
  const raw = await readJsonFile<unknown>(target);
  return parseConfig(deepMerge(defaults, raw));
}

export function parseConfig(value: unknown): RepoRacerConfig {
  const parsed = repoRacerConfigSchema.parse(value);
  return {
    ...parsed,
    agents: parsed.agents.map(normalizeAgent)
  };
}

function normalizeAgent(agent: {
  name: string;
  enabled: boolean;
  command?: string | undefined;
  timeoutMinutes?: number | undefined;
}): AgentConfig {
  const normalized: AgentConfig = {
    name: agent.name,
    enabled: agent.enabled
  };
  if (agent.command !== undefined) {
    normalized.command = agent.command;
  }
  if (agent.timeoutMinutes !== undefined) {
    normalized.timeoutMinutes = agent.timeoutMinutes;
  }
  return normalized;
}

async function detectPackageManager(repoRoot: string): Promise<"pnpm" | "npm" | "yarn" | null> {
  if (await pathExists(path.join(repoRoot, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (await pathExists(path.join(repoRoot, "package-lock.json"))) {
    return "npm";
  }
  if (await pathExists(path.join(repoRoot, "yarn.lock"))) {
    return "yarn";
  }
  if (await pathExists(path.join(repoRoot, "package.json"))) {
    return "npm";
  }
  return null;
}

async function detectTestCommand(
  repoRoot: string,
  packageManager: "pnpm" | "npm" | "yarn" | null
): Promise<string | null> {
  const packageJsonPath = path.join(repoRoot, "package.json");
  if (await pathExists(packageJsonPath)) {
    const raw = JSON.parse(await fs.readFile(packageJsonPath, "utf8")) as Record<string, unknown>;
    const scripts =
      typeof raw.scripts === "object" && raw.scripts !== null ? (raw.scripts as Record<string, unknown>) : {};
    if (typeof scripts.test === "string" && scripts.test.trim().length > 0) {
      if (packageManager === "yarn") {
        return "yarn test";
      }
      if (packageManager === "pnpm") {
        return "pnpm test";
      }
      return "npm test";
    }
  }
  if (await pathExists(path.join(repoRoot, "pytest.ini"))) {
    return "python -m pytest";
  }
  if (await pathExists(path.join(repoRoot, "Cargo.toml"))) {
    return "cargo test";
  }
  return null;
}

function deepMerge(base: unknown, overlay: unknown): unknown {
  if (!isRecord(base) || !isRecord(overlay)) {
    return overlay ?? base;
  }
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    output[key] = key in output ? deepMerge(output[key], value) : value;
  }
  return output;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
