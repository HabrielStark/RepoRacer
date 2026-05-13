#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import process from "node:process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const textFiles = new Map();
const requiredFiles = [
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "RUNBOOK.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "DCO.md",
  "GOVERNANCE.md",
  "AUTHORS.md",
  "MAINTAINERS.md",
  "TRADEMARKS.md",
  "THIRD_PARTY_NOTICES.md",
  "Dockerfile",
  ".dockerignore",
  ".editorconfig",
  ".gitattributes",
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/workflows/pages.yml",
  ".github/CODEOWNERS",
  ".github/FUNDING.yml",
  ".github/dependabot.yml",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/question.yml",
  ".github/ISSUE_TEMPLATE/rfc.yml",
  "scripts/check-external-release-readiness.js",
  "scripts/check-release-version.js",
  "scripts/check-static-links.js",
  "scripts/smoke-docker-sandbox.js",
  "scripts/smoke-packed-cli.js",
  "scripts/generate-third-party-notices.js"
];
const requiredPackedFiles = [
  "dist/cli.js",
  "dist/index.js",
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "GOVERNANCE.md",
  "TRADEMARKS.md",
  "THIRD_PARTY_NOTICES.md",
  "scripts/check-external-release-readiness.js",
  "scripts/generate-sbom.js",
  "scripts/check-static-links.js",
  "scripts/smoke-docker-sandbox.js",
  "scripts/smoke-packed-cli.js",
  "scripts/generate-third-party-notices.js",
  "assets/logo.svg",
  "assets/social-preview.svg",
  "examples/buggy-todo-app/scripts/create-history.cjs",
  "docs/index.md",
  "docs/.vitepress/config.mts"
];
const forbiddenPackedPrefixes = ["docs/.vitepress/dist/", "docs/api/", "examples/buggy-todo-app/generated/"];
const forbiddenWorkspaceNames = new Set(["__pycache__"]);
const forbiddenWorkspaceSuffixes = [".pyc"];
const ignoredWorkspaceDirs = new Set([".git", "node_modules", "dist", "coverage", "artifacts", ".reporacer-demo-site"]);
const externalReleaseFields = ["repository", "homepage", "bugs", "funding"];
const requiredTextChecks = [
  [".github/workflows/pages.yml", "pnpm demo:build", "Pages workflow builds docs and demo site together"],
  [".github/workflows/pages.yml", "Check Pages availability", "Pages workflow preflights repository Pages setup"],
  [
    ".github/workflows/pages.yml",
    "if: steps.pages.outputs.enabled == 'true'",
    "Pages workflow skips deploy when Pages is not enabled"
  ],
  [".github/workflows/release.yml", "pnpm release:audit", "Release workflow runs release audit"],
  [
    ".github/workflows/release.yml",
    "node scripts/check-release-version.js",
    "Release workflow checks tag/input version"
  ],
  [
    ".github/workflows/release.yml",
    "npm publish --provenance --access public",
    "Release workflow publishes with provenance"
  ],
  [".github/workflows/release.yml", "docker build", "Release workflow preflights Docker image"],
  [".github/workflows/release.yml", "docker push", "Release workflow pushes Docker image"],
  [".github/workflows/release.yml", "artifacts/reporacer.cdx.json", "Release workflow attaches SBOM"],
  [".github/workflows/release.yml", "pnpm notices", "Release workflow regenerates third-party notices"],
  [".github/workflows/release.yml", "pnpm demo:check", "Release workflow checks generated demo-site links"],
  [
    ".github/workflows/release.yml",
    "pnpm docker:sandbox:smoke",
    "Release workflow smokes Docker sandbox command execution"
  ],
  [".github/workflows/ci.yml", "pnpm test:coverage", "CI enforces coverage"],
  [".github/workflows/ci.yml", "pnpm demo:check", "CI checks generated demo-site links"],
  [".github/workflows/ci.yml", "pnpm sbom", "CI smokes SBOM generation"],
  [".github/workflows/ci.yml", "pnpm notices", "CI smokes third-party notices generation"],
  [
    ".github/workflows/ci.yml",
    "npm pack --json --dry-run --ignore-scripts",
    "CI audits npm package contents without lifecycle side effects"
  ],
  [".github/workflows/ci.yml", "pnpm package:smoke", "CI installs and runs the packed npm CLI"],
  [".github/workflows/ci.yml", "docker run --rm reporacer:ci --version", "CI smokes Docker CLI image"],
  [".github/workflows/ci.yml", "pnpm docker:sandbox:smoke", "CI smokes Docker sandbox command execution"],
  [".github/workflows/ci.yml", "pnpm agents:verify", "CI smokes official agent preset availability"],
  [".github/workflows/ci.yml", "node ../../../dist/cli.js run", "CI exercises flagship demo through dist CLI"],
  [".github/workflows/ci.yml", "python -B -m unittest", "CI runs Python demo without bytecode cache output"],
  [".github/workflows/release.yml", "pnpm agents:verify", "Release workflow smokes official agent presets"],
  [".github/workflows/release.yml", "pnpm package:smoke", "Release workflow installs and runs the packed npm CLI"],
  ["Dockerfile", "node:24-bookworm-slim@sha256:", "Dockerfile pins Node base image by digest"],
  ["Dockerfile", "USER node", "Dockerfile runs as non-root node user"],
  [".gitignore", "reporacer_full_technical_spec.md", "Git ignores local technical spec prompt"],
  [".gitattributes", "* text=auto eol=lf", "Git attributes enforce LF text normalization"],
  [".dockerignore", "reporacer_full_technical_spec.md", "Docker context excludes local technical spec prompt"]
];

let failed = false;
let warned = false;

function fail(message) {
  failed = true;
  process.stdout.write(`FAIL ${message}\n`);
}

function pass(message) {
  process.stdout.write(`PASS ${message}\n`);
}

function warn(message) {
  warned = true;
  process.stdout.write(`WARN ${message}\n`);
}

for (const filePath of requiredFiles) {
  if (existsSync(filePath)) {
    pass(`required file exists: ${filePath}`);
  } else {
    fail(`required file missing: ${filePath}`);
  }
}

for (const [filePath, needle, description] of requiredTextChecks) {
  if (readText(filePath).includes(needle)) {
    pass(description);
  } else {
    fail(`${description}: missing ${needle} in ${filePath}`);
  }
}

for (const filePath of [".github/workflows/ci.yml", ".github/workflows/release.yml", ".github/workflows/pages.yml"]) {
  const workflowText = readText(filePath);
  const unpinnedActions = [...workflowText.matchAll(/uses:\s+([^\s#]+)/g)]
    .map((match) => match[1])
    .filter((actionRef) => !/@[a-f0-9]{40}$/i.test(actionRef));

  if (unpinnedActions.length === 0) {
    pass(`${filePath} pins every GitHub Action by commit SHA`);
  } else {
    fail(`${filePath} has unpinned GitHub Actions: ${unpinnedActions.join(", ")}`);
  }
}

const generatedWorkspaceFiles = findForbiddenWorkspaceFiles(".");
if (generatedWorkspaceFiles.length === 0) {
  pass("workspace is free of forbidden generated bytecode/cache files");
} else {
  fail(`forbidden generated files present: ${generatedWorkspaceFiles.join(", ")}`);
}

const releaseWorkflow = readText(".github/workflows/release.yml");
if (releaseWorkflow.indexOf("pnpm notices") < releaseWorkflow.indexOf("npm pack --json")) {
  pass("Release workflow generates third-party notices before packing");
} else {
  fail("Release workflow must generate third-party notices before npm pack");
}

if (releaseWorkflow.indexOf("pnpm sbom") < releaseWorkflow.indexOf("npm pack --json")) {
  pass("Release workflow generates SBOM before packing release artifacts");
} else {
  fail("Release workflow must generate SBOM before npm pack");
}

if (packageJson.name === "reporacer" && packageJson.version === "1.0.0") {
  pass("package name/version are set");
} else {
  fail("package name/version are not release-ready");
}

if (packageJson.author !== undefined && String(packageJson.author).trim().length > 0) {
  pass("package author is non-empty");
} else {
  fail("package author is empty");
}

if (packageJson.publishConfig?.access === "public") {
  pass("package publishConfig access is public");
} else {
  fail("package publishConfig.access must be public");
}

if (packageJson.bin?.reporacer === "dist/cli.js") {
  pass("package bin uses npm-valid CLI path");
} else {
  fail("package bin.reporacer must be dist/cli.js without a leading ./");
}

for (const field of externalReleaseFields) {
  if (packageJson[field] === undefined) {
    warn(`package ${field} is unset until the public GitHub/npm owner is known`);
  } else {
    pass(`package ${field} is set`);
  }
}

for (const filePath of [".github/CODEOWNERS", ".github/FUNDING.yml", "MAINTAINERS.md"]) {
  const text = readText(filePath);
  if (/Pending|not declared|before public launch/i.test(text)) {
    warn(`${filePath} needs real public-owner data before launch`);
  } else {
    pass(`${filePath} has concrete public-owner data`);
  }
}

const packCommand = process.platform === "win32" ? "cmd.exe" : "npm";
const packArgs =
  process.platform === "win32"
    ? ["/d", "/c", "npm", "pack", "--json", "--dry-run", "--ignore-scripts"]
    : ["pack", "--json", "--dry-run", "--ignore-scripts"];
const pack = spawnSync(packCommand, packArgs, {
  encoding: "utf8",
  shell: false
});

if (pack.status !== 0) {
  fail(`npm pack dry-run failed: ${pack.error?.message ?? pack.stderr ?? pack.stdout ?? "unknown error"}`);
} else {
  const parsed = JSON.parse(pack.stdout.slice(pack.stdout.indexOf("[")));
  const files = new Set(parsed[0].files.map((file) => file.path));
  for (const filePath of requiredPackedFiles) {
    if (files.has(filePath)) {
      pass(`packed file included: ${filePath}`);
    } else {
      fail(`packed file missing: ${filePath}`);
    }
  }
  for (const filePath of files) {
    if (forbiddenPackedPrefixes.some((prefix) => filePath.startsWith(prefix))) {
      fail(`generated file leaked into npm package: ${filePath}`);
    }
  }
}

if (failed) {
  process.exitCode = 1;
} else if (warned) {
  process.stdout.write("Release audit passed locally with external-owner warnings.\n");
} else {
  process.stdout.write("Release audit passed.\n");
}

function readText(filePath) {
  if (!textFiles.has(filePath)) {
    textFiles.set(filePath, existsSync(filePath) ? readFileSync(filePath, "utf8") : "");
  }
  return textFiles.get(filePath);
}

function findForbiddenWorkspaceFiles(dir) {
  const hits = [];
  walk(dir);
  return hits;

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      if (ignoredWorkspaceDirs.has(entry.name)) continue;

      const filePath = currentDir === "." ? entry.name : `${currentDir}/${entry.name}`;
      const normalized = filePath.replace(/\\/g, "/");

      if (
        forbiddenWorkspaceNames.has(entry.name) ||
        forbiddenWorkspaceSuffixes.some((suffix) => entry.name.endsWith(suffix))
      ) {
        hits.push(normalized);
        continue;
      }

      if (entry.isDirectory()) {
        walk(filePath);
      }
    }
  }
}
