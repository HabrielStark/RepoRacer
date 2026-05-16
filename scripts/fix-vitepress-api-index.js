#!/usr/bin/env node
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceApiDir = path.join(root, "docs", "api", "reference");
const sourceReadme = path.join(sourceApiDir, "README.md");
const sourceIndex = path.join(sourceApiDir, "index.md");
const distApiDir = path.join(root, "docs", ".vitepress", "dist", "api", "reference");
const distReadme = path.join(distApiDir, "README.html");
const distIndex = path.join(distApiDir, "index.html");

let copied = 0;

if (await isFile(sourceReadme)) {
  await mkdir(sourceApiDir, { recursive: true });
  await copyFile(sourceReadme, sourceIndex);
  copied += 1;
  process.stdout.write("Created docs/api/reference/index.md from TypeDoc README output.\n");
}

if (await isFile(distReadme)) {
  await mkdir(distApiDir, { recursive: true });
  await copyFile(distReadme, distIndex);
  copied += 1;
  process.stdout.write("Created docs/.vitepress/dist/api/reference/index.html from TypeDoc README output.\n");
}

if (copied === 0) {
  process.stderr.write("Failed to create API reference index: TypeDoc README output was not found.\n");
  process.exitCode = 1;
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}
