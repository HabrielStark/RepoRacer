#!/usr/bin/env node
import process from "node:process";
import { runCommand } from "../dist/core/process-safe.js";

const sandbox = {
  mode: "docker",
  dockerImage: "node:24-bookworm-slim@sha256:24dc26ef1e3c3690f27ebc4136c9c186c3133b25563ae4d7f0692e4d1fe5db0e",
  network: "none",
  cpus: 1,
  memory: "512m"
};

for (const command of ["node -p 40+2", 'node -e "console.log(40 + 2)"']) {
  const result = await runCommand(command, {
    cwd: process.cwd(),
    sandbox,
    timeoutMs: 30_000
  });

  if (result.exitCode !== 0 || result.stdout.trim() !== "42") {
    process.stderr.write(`Docker sandbox smoke failed for ${command}\n${result.output}\n`);
    process.exit(1);
  }
}

process.stdout.write("Docker sandbox smoke passed\n");
