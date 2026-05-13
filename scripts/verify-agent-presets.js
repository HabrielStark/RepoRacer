#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import process from "node:process";

const presets = [
  {
    name: "codex",
    binary: "codex",
    command: "codex exec --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check - < {{promptFile}}",
    versionArgs: ["--version"]
  },
  {
    name: "claude",
    binary: "claude",
    command: "claude -p < {{promptFile}}",
    versionArgs: ["--version"]
  },
  {
    name: "gemini",
    binary: "gemini",
    command: "gemini --approval-mode auto_edit < {{promptFile}}",
    versionArgs: ["--version"]
  },
  {
    name: "aider",
    binary: "aider",
    command: "aider --message-file {{promptFile}}",
    versionArgs: ["--version"]
  },
  {
    name: "opencode",
    binary: "opencode",
    command: 'opencode run --file {{promptFile}} "Follow the attached RepoRacer task prompt exactly."',
    versionArgs: ["--version"]
  }
];

const strict = process.argv.includes("--strict");

function run(binary, args) {
  const command = process.platform === "win32" ? "cmd.exe" : binary;
  const commandArgs = process.platform === "win32" ? ["/d", "/c", [binary, ...args].join(" ")] : args;
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    timeout: 15_000,
    env: processEnvWithUserBinPaths()
  });
  return {
    status: result.status,
    error: result.error?.message ?? null,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim()
  };
}

function processEnvWithUserBinPaths() {
  const env = { ...process.env };
  const pathKey = Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const extraPaths = userBinPaths().filter((entry) => entry.length > 0);
  if (extraPaths.length > 0) {
    env[pathKey] = [env[pathKey], ...extraPaths].filter(Boolean).join(process.platform === "win32" ? ";" : ":");
  }
  return env;
}

function userBinPaths() {
  if (process.platform !== "win32") {
    return [];
  }
  const paths = [];
  const userScripts = spawnSync("python", ["-c", "import sysconfig; print(sysconfig.get_path('scripts', 'nt_user'))"], {
    encoding: "utf8",
    timeout: 5_000
  });
  if (userScripts.status === 0) {
    paths.push(userScripts.stdout.trim());
  }
  return paths;
}

let failed = false;
let missing = 0;

for (const preset of presets) {
  const version = run(preset.binary, preset.versionArgs);
  if (version.status === 0) {
    const firstLine = version.output.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "version detected";
    process.stdout.write(`PASS ${preset.name}: ${firstLine}\n`);
    process.stdout.write(`     preset: ${preset.command}\n`);
  } else {
    missing += 1;
    failed = strict;
    const reason = version.error ?? version.output.split(/\r?\n/)[0] ?? "binary not found or not runnable";
    process.stdout.write(`${strict ? "FAIL" : "SKIP"} ${preset.name}: ${reason}\n`);
    process.stdout.write(
      `     install/configure ${preset.binary}, then run: reporacer run --agents ${preset.name} --tasks 1\n`
    );
  }
}

if (missing > 0 && !strict) {
  process.stdout.write(
    `\nSoft verification completed with ${missing} missing optional CLI(s). Re-run with --strict when every provider CLI is installed.\n`
  );
}

if (failed) {
  process.exitCode = 1;
}
