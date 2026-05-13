#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import process from "node:process";

if (existsSync(".git")) {
  const result = spawnSync("husky", [], {
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  process.exitCode = result.status ?? 1;
}
