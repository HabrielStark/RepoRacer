import { execaCommand, type Options } from "execa";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { CommandRunResult, SandboxConfig } from "../schemas/types.js";
import { nowIso } from "../utils/time.js";
import { removeEmptyGeneratedParents, removeGeneratedPath, writeGeneratedFile } from "./fs-safe.js";

const MAX_BUFFER = 50 * 1024 * 1024;

export interface RunCommandOptions {
  cwd: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  sandbox?: SandboxConfig;
}

export async function runCommand(command: string, options: RunCommandOptions): Promise<CommandRunResult> {
  const started = Date.now();
  const dockerScript = options.sandbox?.mode === "docker" ? await writeDockerCommandScript(options.cwd, command) : null;
  const renderedCommand =
    options.sandbox?.mode === "docker" && dockerScript !== null
      ? buildDockerCommand(`sh ${posixShellQuote(dockerScript.containerRelativePath)}`, options.cwd, options.sandbox)
      : command;
  const renderedCwd = options.sandbox?.mode === "docker" ? options.cwd : options.cwd;
  const commandOptions: Options = {
    cwd: renderedCwd,
    shell: true,
    all: true,
    reject: false,
    cleanup: true,
    windowsHide: true,
    stripFinalNewline: false,
    maxBuffer: MAX_BUFFER,
    ...(options.timeoutMs === undefined ? {} : { timeout: options.timeoutMs }),
    ...(options.env === undefined ? {} : { env: options.env })
  };
  try {
    const result = await execaCommand(renderedCommand, commandOptions);
    const stdout = outputToString(result.stdout);
    const stderr = outputToString(result.stderr);
    const output = redactSecrets(stripAnsi(outputToString(result.all) || `${stdout}${stderr}`));
    return {
      command: renderedCommand,
      cwd: options.cwd,
      exitCode: typeof result.exitCode === "number" ? result.exitCode : null,
      stdout: redactSecrets(stripAnsi(stdout)),
      stderr: redactSecrets(stripAnsi(stderr)),
      output,
      durationMs: Date.now() - started,
      timedOut: result.timedOut,
      failedToStart: false
    };
  } catch (error) {
    const record = toRecord(error);
    const stdout = getString(record, "stdout");
    const stderr = getString(record, "stderr");
    const all = getString(record, "all");
    const message = getString(record, "message") ?? "Process failed to start";
    const timedOut = getBoolean(record, "timedOut");
    const exitCode = getNumber(record, "exitCode");
    const output = redactSecrets(stripAnsi(all ?? `${stdout ?? ""}${stderr ?? ""}${message}`));
    return {
      command: renderedCommand,
      cwd: options.cwd,
      exitCode,
      stdout: redactSecrets(stripAnsi(stdout ?? "")),
      stderr: redactSecrets(stripAnsi(stderr ?? message)),
      output,
      durationMs: Date.now() - started,
      timedOut,
      failedToStart: !timedOut && exitCode === null
    };
  } finally {
    if (dockerScript !== null) {
      await removeGeneratedPath(options.cwd, dockerScript.hostPath);
      await removeEmptyGeneratedParents(options.cwd, dockerScript.hostDir);
    }
  }
}

export function renderCommandTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/{{\s*([a-zA-Z][a-zA-Z0-9]*)\s*}}/g, (match, name: string) => {
    const value = variables[name];
    return value === undefined ? match : shellQuote(value);
  });
}

export function shellQuote(value: string): string {
  if (value.length === 0) {
    return '""';
  }
  if (process.platform === "win32") {
    const escaped = value.replace(/\r?\n/g, " ").replace(/\^/g, "^^").replace(/%/g, "^%").replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function posixShellQuote(value: string): string {
  if (value.length === 0) {
    return "''";
  }
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function buildDockerCommand(command: string, cwd: string, sandbox: SandboxConfig): string {
  const networkArgs = sandbox.network === "none" ? "--network none" : "";
  return [
    "docker run --rm",
    "--cap-drop ALL",
    "--security-opt no-new-privileges",
    "--pids-limit 512",
    `-v ${shellQuote(`${cwd}:/workspace`)}`,
    "-w /workspace",
    `--cpus ${String(sandbox.cpus)}`,
    `--memory ${shellQuote(sandbox.memory)}`,
    networkArgs,
    shellQuote(sandbox.dockerImage),
    "sh -lc",
    shellQuote(command)
  ]
    .filter((part) => part.length > 0)
    .join(" ");
}

async function writeDockerCommandScript(
  cwd: string,
  command: string
): Promise<{
  containerRelativePath: string;
  hostDir: string;
  hostPath: string;
}> {
  const relativeDir = path.join(".reporacer", "tmp", "docker-commands", `${process.pid}-${Date.now()}-${randomUUID()}`);
  const hostDir = path.join(cwd, relativeDir);
  const fileName = "command.sh";
  const hostPath = path.join(hostDir, fileName);
  await writeGeneratedFile(cwd, hostPath, `#!/bin/sh\n${command}\n`);
  return {
    containerRelativePath: path.join(relativeDir, fileName).replace(/\\/g, "/"),
    hostDir,
    hostPath
  };
}

export function redactSecrets(input: string): string {
  if (input.length === 0) {
    return input;
  }
  let output = input;
  output = output.replace(
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    "[REDACTED_PRIVATE_KEY]"
  );
  output = output.replace(/\b(?:sk-[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{20,})\b/g, "[REDACTED_API_KEY]");
  output = output.replace(/\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g, "[REDACTED_GITHUB_TOKEN]");
  output = output.replace(/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_ACCESS_KEY]");
  output = output.replace(/\bhttps?:\/\/([^:\s/@]+):([^@\s/]+)@/gi, (match: string) =>
    match.replace(/\/\/[^:\s/@]+:[^@\s/]+@/, "//[REDACTED_CREDENTIALS]@")
  );
  output = output.replace(/\b(Bearer\s+)[A-Za-z0-9._~+/-]{16,}={0,2}\b/gi, "$1[REDACTED_TOKEN]");
  output = output.replace(
    /^([A-Za-z_][A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|ACCESS_KEY)[A-Za-z0-9_]*\s*=\s*).+$/gim,
    "$1[REDACTED]"
  );
  output = output.replace(
    /\b(api[_-]?key|token|secret|password|authorization)\b(\s*[:=]\s*)["']?[^"'\s,;]{8,}["']?/gi,
    "$1$2[REDACTED]"
  );
  return output;
}

export function stripAnsi(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/\u001b\[[0-9;]*m/g, "");
}

export function commandResultLog(result: CommandRunResult, label: string): string {
  return [
    `# ${label}`,
    `timestamp: ${nowIso()}`,
    `cwd: ${result.cwd}`,
    `command: ${redactSecrets(result.command)}`,
    `exitCode: ${result.exitCode === null ? "null" : String(result.exitCode)}`,
    `timedOut: ${String(result.timedOut)}`,
    `durationMs: ${String(result.durationMs)}`,
    "",
    "## Output",
    result.output
  ].join("\n");
}

function toRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getNumber(record: Record<string, unknown>, key: string): number | null {
  const value = record[key];
  return typeof value === "number" ? value : null;
}

function getBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  return typeof value === "boolean" ? value : false;
}

function outputToString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value instanceof Uint8Array) {
    return new TextDecoder().decode(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => outputToString(item)).join("");
  }
  return "";
}
