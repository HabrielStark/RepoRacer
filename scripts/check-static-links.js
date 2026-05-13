#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] ?? ".reporacer-demo-site");

if (!existsSync(root)) {
  process.stderr.write(`Static site directory not found: ${root}\n`);
  process.exit(1);
}

const htmlFiles = [];
const missing = [];

walk(root);

for (const filePath of htmlFiles) {
  const html = readFileSync(filePath, "utf8");
  const attributes = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g);
  for (const match of attributes) {
    const url = match[1];
    if (isExternalOrInline(url)) continue;

    const cleanUrl = url.split("#")[0].split("?")[0];
    if (cleanUrl.length === 0) continue;

    const target = cleanUrl.startsWith("/")
      ? path.join(root, cleanUrl.slice(1))
      : path.resolve(path.dirname(filePath), cleanUrl);

    if (!resolvesToExistingFile(target)) {
      missing.push(`${path.relative(root, filePath)} -> ${url}`);
    }
  }
}

if (missing.length > 0) {
  process.stderr.write(`Broken static links in ${root}:\n${missing.join("\n")}\n`);
  process.exit(1);
}

process.stdout.write(`Static link check passed for ${htmlFiles.length} HTML files in ${root}\n`);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.name.endsWith(".html")) {
      htmlFiles.push(fullPath);
    }
  }
}

function isExternalOrInline(url) {
  return /^(?:https?:|mailto:|tel:|data:|#|javascript:)/i.test(url);
}

function resolvesToExistingFile(target) {
  if (existsSync(target)) return true;
  if (existsSync(`${target}.html`)) return true;
  if (existsSync(path.join(target, "index.html"))) return true;
  return false;
}
