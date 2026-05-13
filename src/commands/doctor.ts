import { execa } from "execa";
import path from "node:path";
import { loadConfig } from "../core/config.js";
import {
  createGitWorktree,
  dirtyEntries,
  getHeadSha,
  getRepoRoot,
  gitLfsDiagnostics,
  isGitRepo,
  isShallowRepository,
  listConfiguredSubmodules,
  removeGitWorktree
} from "../core/git.js";
import { ensureDir, pathExists, removeGeneratedPath } from "../core/fs-safe.js";
import { repoRacerPath } from "../utils/paths.js";
import { renderTable } from "../utils/table.js";

export async function runDoctor(cwd = process.cwd()): Promise<string> {
  const rows: string[][] = [];
  rows.push(["Node.js", process.version, majorVersion(process.version) >= 20 ? "ok" : "needs Node 20+"]);
  rows.push(["Git", await gitVersion(cwd), (await isGitRepo(cwd)) ? "ok" : "not a git repo"]);
  if (!(await isGitRepo(cwd))) {
    return renderTable(["Check", "Value", "Status"], rows);
  }
  const repoRoot = await getRepoRoot(cwd);
  const config = await loadConfig(repoRoot);
  const dirty = await dirtyEntries(repoRoot);
  const shallow = await isShallowRepository(repoRoot);
  const submodules = await listConfiguredSubmodules(repoRoot);
  const lfs = await gitLfsDiagnostics(repoRoot);
  rows.push([
    "Working tree",
    dirty.length === 0 ? "clean" : `${dirty.length} dirty paths`,
    dirty.length === 0 ? "ok" : "run will require --allow-dirty"
  ]);
  rows.push(["Shallow clone", String(shallow), shallow ? "fetch full history before mining tasks" : "ok"]);
  rows.push([
    "Submodules",
    submodules.length === 0 ? "none" : submodules.slice(0, 3).join(", "),
    submodules.length === 0 ? "ok" : "ensure submodules are initialized before agent runs"
  ]);
  rows.push([
    "Git LFS",
    lfs.trackedPatterns.length === 0 ? "none" : `${lfs.trackedPatterns.length} tracked pattern(s)`,
    lfs.trackedPatterns.length === 0 || lfs.cliAvailable ? "ok" : "git-lfs missing"
  ]);
  rows.push(["Test command", config.testCommand ?? "none", config.testCommand === null ? "warning" : "ok"]);
  if (config.testCommand !== null) {
    rows.push([
      "Test executable",
      firstCommandToken(config.testCommand) ?? "unknown",
      await commandStatus(config.testCommand, repoRoot)
    ]);
  }
  rows.push(["Install command", config.installCommand ?? "none", "ok"]);
  if (config.installCommand !== null) {
    rows.push([
      "Install executable",
      firstCommandToken(config.installCommand) ?? "unknown",
      await commandStatus(config.installCommand, repoRoot)
    ]);
  }
  rows.push(["Evaluation", config.evaluationMode, "ok"]);
  rows.push(["Baseline check", String(config.baselineCheck), "ok"]);
  rows.push(["Sandbox", config.sandbox.mode, config.sandbox.mode === "docker" ? await dockerStatus(cwd) : "ok"]);
  rows.push(["Agents", config.agents.map((agent) => `${agent.name}:${agent.enabled ? "on" : "off"}`).join(", "), "ok"]);
  for (const agent of config.agents.filter((item) => item.enabled && item.command !== undefined)) {
    rows.push([
      `Agent ${agent.name}`,
      firstCommandToken(agent.command ?? "") ?? "unknown",
      await commandStatus(agent.command ?? "", repoRoot)
    ]);
  }
  rows.push(["Worktree", "create/remove", await worktreeStatus(repoRoot)]);
  return renderTable(["Check", "Value", "Status"], rows);
}

async function gitVersion(cwd: string): Promise<string> {
  const result = await execa("git", ["--version"], { cwd, reject: false, windowsHide: true });
  return result.exitCode === 0 ? result.stdout.trim() : "missing";
}

function majorVersion(version: string): number {
  return Number(version.replace(/^v/, "").split(".")[0] ?? "0");
}

async function dockerStatus(cwd: string): Promise<string> {
  const result = await execa("docker", ["--version"], { cwd, reject: false, windowsHide: true });
  return result.exitCode === 0 ? "ok" : "docker missing";
}

async function commandStatus(command: string, cwd: string): Promise<string> {
  const token = firstCommandToken(command);
  if (token === null) {
    return "missing command";
  }
  if (token.includes("/") || token.includes("\\") || token.startsWith(".")) {
    return (await pathExists(path.resolve(cwd, token))) ? "ok" : "not found";
  }
  const result =
    process.platform === "win32"
      ? await execa("where.exe", [token], { cwd, reject: false, windowsHide: true })
      : await execa("sh", ["-lc", `command -v ${posixSingleQuote(token)}`], { cwd, reject: false });
  return result.exitCode === 0 ? "ok" : "not found";
}

function firstCommandToken(command: string): string | null {
  const trimmed = command.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const match = /^(?:"([^"]+)"|'([^']+)'|(\S+))/.exec(trimmed);
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
}

function posixSingleQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

async function worktreeStatus(repoRoot: string): Promise<string> {
  const target = repoRacerPath(repoRoot, "doctor-worktree");
  try {
    await removeGeneratedPath(repoRoot, target);
    await ensureDir(repoRacerPath(repoRoot));
    await createGitWorktree(repoRoot, target, await getHeadSha(repoRoot));
    await removeGitWorktree(repoRoot, target);
    await removeGeneratedPath(repoRoot, target);
    return "ok";
  } catch (error) {
    return `failed: ${error instanceof Error ? error.message.slice(0, 80) : "unknown"}`;
  }
}
