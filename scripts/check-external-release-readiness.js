#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const repo = parseGitHubRepository(packageJson.repository?.url ?? "");
const expectedTag = `v${packageJson.version}`;
let failed = false;

checkNpmIdentity();
checkNpmPublishedVersion();
checkGitHubPages();
checkReleaseTag();
checkStrictAgents();

if (failed) {
  process.exitCode = 1;
} else {
  process.stdout.write("External release readiness passed.\n");
}

function checkNpmIdentity() {
  const direct = run("npm", ["whoami", "--registry", "https://registry.npmjs.org"]);
  if (direct.status === 0) {
    pass(`npm authenticated as ${firstLine(direct.output)}`);
    return;
  }

  const token = process.env.NPM_TOKEN ?? process.env.NODE_AUTH_TOKEN;
  if (token === undefined || token.trim().length === 0) {
    fail("npm authentication missing: run npm adduser locally or set NPM_TOKEN/NODE_AUTH_TOKEN");
    return;
  }

  const tempDir = mkdtempSync(path.join(tmpdir(), "reporacer-npm-auth-"));
  const userConfigPath = path.join(tempDir, ".npmrc");
  try {
    writeFileSync(userConfigPath, `//registry.npmjs.org/:_authToken=${token}\n`, "utf8");
    const tokenCheck = run("npm", [
      "whoami",
      "--registry",
      "https://registry.npmjs.org",
      "--userconfig",
      userConfigPath
    ]);
    if (tokenCheck.status === 0) {
      pass(`npm token authenticated as ${firstLine(tokenCheck.output)}`);
    } else {
      fail(`npm token authentication failed: ${firstLine(tokenCheck.output)}`);
    }
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function checkNpmPublishedVersion() {
  const result = run("npm", ["view", packageJson.name, "version", "--registry", "https://registry.npmjs.org"]);
  if (result.status !== 0) {
    fail(`npm package ${packageJson.name} is not published or not visible on npm`);
    return;
  }

  const publishedVersion = firstLine(result.output);
  if (publishedVersion === packageJson.version) {
    pass(`npm package ${packageJson.name}@${publishedVersion} is published`);
  } else {
    fail(`npm package version mismatch: registry has ${publishedVersion}, package.json has ${packageJson.version}`);
  }
}

function checkGitHubPages() {
  if (repo === null) {
    fail("GitHub repository URL is not parseable from package.json");
    return;
  }

  const publicResult = queryGitHubPages(null);
  if (publicResult.status === 0) {
    pass(`GitHub Pages enabled: ${firstLine(publicResult.output)}`);
    return;
  }
  if (/^404\b/.test(firstLine(publicResult.output))) {
    const siteResult = queryGitHubPagesSite();
    if (siteResult.status === 0) {
      pass(`GitHub Pages site is live: ${firstLine(siteResult.output)}`);
      return;
    }
    fail(`GitHub Pages is not serving the expected site: ${firstLine(siteResult.output)}`);
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (token === undefined || token.trim().length === 0) {
    fail(`GitHub Pages status unknown: ${firstLine(publicResult.output)}; set GITHUB_TOKEN with repository access`);
    return;
  }

  const tokenResult = queryGitHubPages(token);

  if (tokenResult.status === 0) {
    pass(`GitHub Pages enabled: ${firstLine(tokenResult.output)}`);
  } else {
    fail(`GitHub Pages not enabled or not visible: ${firstLine(tokenResult.output)}`);
  }
}

function queryGitHubPages(token) {
  return run("node", [
    "-e",
    [
      "const [repo, token] = process.argv.slice(1);",
      "const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'reporacer-release-readiness' };",
      "if (token) headers.Authorization = `Bearer ${token}`;",
      "const res = await fetch(`https://api.github.com/repos/${repo}/pages`, { headers });",
      "if (!res.ok) { console.error(`${res.status} ${res.statusText}`); process.exit(1); }",
      "const body = await res.json();",
      "console.log(`${body.status || 'configured'} ${body.html_url || ''}`.trim());"
    ].join(" "),
    repo,
    token ?? ""
  ]);
}

function queryGitHubPagesSite() {
  const [owner, name] = repo.split("/");
  return run("node", [
    "-e",
    [
      "const [owner, name] = process.argv.slice(1);",
      "const url = `https://${owner.toLowerCase()}.github.io/${name}/`;",
      "const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });",
      "if (!res.ok) { console.error(`${res.status} ${res.statusText}`); process.exit(1); }",
      "console.log(url);"
    ].join(" "),
    owner,
    name
  ]);
}

function checkReleaseTag() {
  const result = run("git", ["ls-remote", "origin", "refs/heads/main", `refs/tags/${expectedTag}^{}`]);
  if (result.status !== 0) {
    fail(`unable to read remote main/tag refs: ${firstLine(result.output)}`);
    return;
  }

  const refs = new Map(
    result.output
      .split(/\r?\n/)
      .map((line) => line.trim().split(/\s+/))
      .filter((parts) => parts.length === 2)
      .map(([sha, ref]) => [ref, sha])
  );
  const main = refs.get("refs/heads/main");
  const tag = refs.get(`refs/tags/${expectedTag}^{}`);
  if (main !== undefined && tag !== undefined && main === tag) {
    pass(`${expectedTag} points at remote main ${main}`);
  } else {
    fail(`${expectedTag} must point at remote main; main=${main ?? "missing"} tag=${tag ?? "missing"}`);
  }
}

function checkStrictAgents() {
  const result = run("node", ["scripts/verify-agent-presets.js", "--strict"]);
  if (result.status === 0) {
    pass("all official provider CLI presets are installed and version-detectable");
  } else {
    fail(`strict provider CLI verification failed:\n${indent(result.output)}`);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    timeout: 30_000,
    windowsHide: true
  });
  return {
    status: result.status,
    output: `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`.trim()
  };
}

function parseGitHubRepository(value) {
  const match = value.match(/github\.com[:/](?<owner>[^/\s]+)\/(?<repo>[^/\s.]+)(?:\.git)?/i);
  if (match?.groups === undefined) return null;
  return `${match.groups.owner}/${match.groups.repo}`;
}

function firstLine(value) {
  return (
    value
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0)
      ?.trim() ?? "no output"
  );
}

function indent(value) {
  return value
    .split(/\r?\n/)
    .map((line) => `  ${line}`)
    .join("\n");
}

function pass(message) {
  process.stdout.write(`PASS ${message}\n`);
}

function fail(message) {
  failed = true;
  process.stdout.write(`FAIL ${message}\n`);
}
