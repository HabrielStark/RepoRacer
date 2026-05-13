#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const patchPath = process.env.REPORACER_HUMAN_PATCH;

if (!patchPath) {
  console.error("Set REPORACER_HUMAN_PATCH to a patch file path.");
  process.exit(2);
}

const result = spawnSync("git", ["apply", "--whitespace=nowarn", patchPath], {
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
