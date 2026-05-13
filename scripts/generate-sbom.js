#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const outPath = path.resolve(root, process.argv[2] ?? "artifacts/reporacer.cdx.json");

const pnpmCommand = process.platform === "win32" ? "cmd.exe" : "pnpm";
const pnpmArgs =
  process.platform === "win32" ? ["/d", "/c", "pnpm", "licenses", "list", "--json"] : ["licenses", "list", "--json"];
const licenses = spawnSync(pnpmCommand, pnpmArgs, {
  cwd: root,
  encoding: "utf8",
  shell: false,
  windowsHide: true
});

if (licenses.status !== 0) {
  process.stderr.write(licenses.stderr || licenses.stdout || "pnpm licenses list failed\n");
  process.exit(licenses.status ?? 1);
}

const licenseGroups = JSON.parse(licenses.stdout);
const components = new Map();

for (const [licenseName, packages] of Object.entries(licenseGroups)) {
  for (const item of packages) {
    for (const version of item.versions ?? []) {
      const key = `${item.name}@${version}`;
      if (components.has(key)) {
        continue;
      }
      components.set(key, {
        type: "library",
        "bom-ref": `pkg:npm/${encodePackageName(item.name)}@${encodeURIComponent(version)}`,
        name: item.name,
        version,
        scope: isRuntimeDependency(item.name) ? "required" : "optional",
        licenses: [{ license: { name: item.license ?? licenseName } }],
        ...(item.description === undefined ? {} : { description: item.description }),
        ...(item.homepage === undefined ? {} : { externalReferences: [{ type: "website", url: item.homepage }] })
      });
    }
  }
}

const bom = {
  bomFormat: "CycloneDX",
  specVersion: "1.5",
  serialNumber: `urn:uuid:${randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [
      {
        vendor: "RepoRacer",
        name: "scripts/generate-sbom.js",
        version: packageJson.version
      },
      {
        vendor: "pnpm",
        name: "pnpm licenses list",
        version: packageJson.packageManager?.replace(/^pnpm@/, "") ?? "unknown"
      }
    ],
    component: {
      type: "application",
      name: packageJson.name,
      version: packageJson.version,
      licenses: [{ license: { id: packageJson.license } }]
    }
  },
  components: [...components.values()].sort((left, right) =>
    `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`)
  )
};

await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(bom, null, 2)}\n`, "utf8");
process.stdout.write(`Wrote CycloneDX SBOM with ${String(bom.components.length)} components to ${outPath}\n`);

function isRuntimeDependency(name) {
  return Object.hasOwn(packageJson.dependencies ?? {}, name);
}

function encodePackageName(name) {
  return name
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}
