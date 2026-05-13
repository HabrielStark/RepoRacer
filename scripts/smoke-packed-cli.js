#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const tempDir = mkdtempSync(path.join(tmpdir(), "reporacer-packed-cli-"));
let tarballPath = null;

try {
  process.stdout.write(`Packed CLI smoke using node ${process.version} in ${tempDir}\n`);
  const pack = run("npm", ["pack", "--json", "--ignore-scripts"], process.cwd());
  if (pack.status !== 0) {
    fail(`npm pack failed:\n${pack.output}`);
  }

  const parsed = JSON.parse(jsonArrayFromOutput(pack.output));
  const fileName = parsed[0]?.filename;
  if (typeof fileName !== "string" || fileName.length === 0) {
    fail("npm pack did not report a tarball filename");
  }
  tarballPath = path.resolve(fileName);

  const init = run("npm", ["init", "-y"], tempDir);
  if (init.status !== 0) {
    fail(`npm init failed:\n${init.output}`);
  }

  const install = run("npm", ["install", tarballPath, "--ignore-scripts", "--no-audit", "--no-fund"], tempDir);
  if (install.status !== 0) {
    fail(`packed tarball install failed:\n${install.output}`);
  }

  const binPath = path.join(
    tempDir,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "reporacer.cmd" : "reporacer"
  );
  if (!existsSync(binPath)) {
    fail(`packed reporacer CLI bin was not linked at ${binPath}`);
  }

  const cli = run(binPath, ["--version"], tempDir);
  if (cli.status !== 0) {
    fail(`packed reporacer CLI failed:\n${cli.output}`);
  }

  const version = firstLine(cli.output);
  if (version !== packageJson.version) {
    fail(`packed reporacer CLI version mismatch: got ${version}, expected ${packageJson.version}`);
  }

  process.stdout.write(`Packed CLI smoke passed for reporacer@${version}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (tarballPath !== null) {
    try {
      unlinkSync(tarballPath);
    } catch {
      // Best-effort cleanup; release-audit also rejects leaked package artifacts.
    }
  }
  rmSync(tempDir, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const invocation = commandInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd,
    encoding: "utf8",
    shell: false,
    timeout: 60_000,
    windowsHide: true
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`.trim()
  };
}

function commandInvocation(command, args) {
  if (process.platform === "win32" && command === "npm") {
    return { command: "cmd.exe", args: ["/d", "/c", "npm", ...args] };
  }
  if (process.platform === "win32" && command.toLowerCase().endsWith(".cmd")) {
    return { command: "cmd.exe", args: ["/d", "/c", command, ...args] };
  }
  return { command, args };
}

function firstLine(value) {
  return (
    value
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? ""
  );
}

function jsonArrayFromOutput(value) {
  const start = value.indexOf("[");
  const end = value.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    fail(`npm pack did not emit JSON array output:\n${value}`);
  }
  return value.slice(start, end + 1);
}

function fail(message) {
  throw new Error(message);
}
