#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import process from "node:process";

const pnpmCommand = process.platform === "win32" ? "cmd.exe" : "pnpm";
const pnpmArgs =
  process.platform === "win32" ? ["/d", "/c", "pnpm", "licenses", "list", "--json"] : ["licenses", "list", "--json"];
const licenses = spawnSync(pnpmCommand, pnpmArgs, {
  encoding: "utf8",
  shell: false,
  windowsHide: true
});

if (licenses.status !== 0) {
  process.stderr.write(licenses.stderr || licenses.stdout || "pnpm licenses list failed\n");
  process.exit(licenses.status ?? 1);
}

const licenseGroups = JSON.parse(licenses.stdout);
const rows = [];
for (const [licenseName, packages] of Object.entries(licenseGroups)) {
  for (const item of packages) {
    for (const version of item.versions ?? []) {
      rows.push({
        name: item.name,
        version,
        license: item.license ?? licenseName,
        homepage: item.homepage ?? ""
      });
    }
  }
}

rows.sort((left, right) => `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`));

const content = [
  "# Third-Party Notices",
  "",
  "This file is generated from the installed pnpm dependency license inventory.",
  "",
  "Regenerate it with:",
  "",
  "```bash",
  "pnpm notices",
  "```",
  "",
  "| Package | Version | License | Homepage |",
  "| --- | --- | --- | --- |",
  ...rows.map(
    (row) =>
      `| ${escapeCell(row.name)} | ${escapeCell(row.version)} | ${escapeCell(row.license)} | ${escapeCell(row.homepage)} |`
  ),
  ""
].join("\n");

await writeFile("THIRD_PARTY_NOTICES.md", content, "utf8");
process.stdout.write(`Wrote THIRD_PARTY_NOTICES.md with ${String(rows.length)} package entries\n`);

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}
