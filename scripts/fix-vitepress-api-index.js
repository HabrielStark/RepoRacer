#!/usr/bin/env node
import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const apiDir = path.join(root, "docs", ".vitepress", "dist", "api");
const readmeHtml = path.join(apiDir, "README.html");
const indexHtml = path.join(apiDir, "index.html");

try {
  const source = await stat(readmeHtml);
  if (!source.isFile()) {
    throw new Error(`${readmeHtml} is not a file`);
  }
  await mkdir(apiDir, { recursive: true });
  await copyFile(readmeHtml, indexHtml);
  process.stdout.write("Created docs/.vitepress/dist/api/index.html from TypeDoc README output.\n");
} catch (error) {
  const message = error instanceof Error ? error.message : "unknown error";
  process.stderr.write(`Failed to create API index page: ${message}\n`);
  process.exitCode = 1;
}
