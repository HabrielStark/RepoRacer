#!/usr/bin/env node
import { readFileSync } from "node:fs";
import process from "node:process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const expected = `v${packageJson.version}`;
const actual = process.env.GITHUB_REF?.startsWith("refs/tags/")
  ? process.env.GITHUB_REF_NAME
  : `v${process.env.REQUESTED_VERSION ?? ""}`;

if (actual !== expected) {
  process.stderr.write(`Release ref ${actual} does not match package version ${expected}\n`);
  process.exit(1);
}

process.stdout.write(`Release version check passed for ${expected}\n`);
