#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.argv[2] ?? ".reporacer-demo-site");
const staticBases = readStaticBases();

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

    const targets = resolveTargets(filePath, cleanUrl);

    if (!targets.some((target) => resolvesToExistingFile(target))) {
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

function resolveTargets(filePath, cleanUrl) {
  if (!cleanUrl.startsWith("/")) {
    return [path.resolve(path.dirname(filePath), cleanUrl)];
  }

  const targets = [path.join(root, cleanUrl.slice(1))];
  for (const staticBase of staticBases) {
    if (cleanUrl.startsWith(staticBase)) {
      targets.push(path.join(root, cleanUrl.slice(staticBase.length)));
    }
  }

  return targets;
}

function readStaticBases() {
  const bases = [];
  const envBase = process.env.REPORACER_STATIC_BASE;
  if (envBase) bases.push(envBase);

  const vitepressConfig = path.join(process.cwd(), "docs", ".vitepress", "config.mts");
  if (existsSync(vitepressConfig)) {
    const source = readFileSync(vitepressConfig, "utf8");
    const match = source.match(/\bbase:\s*["']([^"']+)["']/);
    if (match) bases.push(match[1]);
  }

  return [...new Set(bases.map(normalizeStaticBase).filter(Boolean))];
}

function normalizeStaticBase(base) {
  if (!base || base === "/") return null;
  const withLeadingSlash = base.startsWith("/") ? base : `/${base}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}
