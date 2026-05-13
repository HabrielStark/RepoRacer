#!/usr/bin/env node
import process from "node:process";
import { runCommand } from "../dist/core/process-safe.js";

const sandbox = {
  mode: "docker",
  dockerImage: "node:24-bookworm-slim",
  network: "none",
  cpus: 1,
  memory: "256m"
};

for (const command of ["node -p 40+2", 'node -e "console.log(40 + 2)"']) {
  const result = await runCommand(command, {
    cwd: process.cwd(),
    sandbox,
    timeoutMs: 30_000
  });

  if (result.exitCode !== 0 || result.output.trim() !== "42") {
    process.stderr.write(`Docker sandbox smoke failed for ${command}\n${result.output}\n`);
    process.exit(1);
  }
}

process.stdout.write("Docker sandbox smoke passed\n");
