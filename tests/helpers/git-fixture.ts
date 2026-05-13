import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import { createDefaultConfig, saveConfig } from "../../src/core/config.js";
import { RepoRacerConfig } from "../../src/schemas/types.js";

export interface FixtureRepo {
  root: string;
  initialCommit: string;
  targetCommit: string;
}

export async function createBenchmarkFixtureRepo(prefix = "reporacer-fixture-"): Promise<FixtureRepo> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await git(root, ["init"]);
  await git(root, ["config", "user.email", "test@example.com"]);
  await git(root, ["config", "user.name", "RepoRacer Test"]);

  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "scripts"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name: "fixture", version: "1.0.0", scripts: { test: "node test.js" } }, null, 2),
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "package-lock.json"),
    `${JSON.stringify(
      {
        name: "fixture",
        version: "1.0.0",
        lockfileVersion: 3,
        requires: true,
        packages: {
          "": {
            name: "fixture",
            version: "1.0.0"
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "test.js"),
    "const fs = require('fs');\nconst text = fs.readFileSync('src/app.txt', 'utf8');\nif (!text.includes('fixed')) {\n  console.error('expected fixed');\n  process.exit(1);\n}\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "scripts", "agent.cjs"),
    "const fs = require('fs');\nfs.writeFileSync('src/app.txt', 'fixed\\n');\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "scripts", "test-mutating-agent.cjs"),
    "const fs = require('fs');\nfs.writeFileSync('test.js', \"console.log('agent changed hidden tests');\\nprocess.exit(0);\\n\");\nfs.writeFileSync('src/app.txt', 'fixed\\n');\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "scripts", "install-side-effect.cjs"),
    "const fs = require('fs');\nfs.mkdirSync('node_modules/example', { recursive: true });\nfs.writeFileSync('node_modules/example/index.js', 'module.exports = true;\\n');\nfs.writeFileSync('install-artifact.txt', 'created by install\\n');\n",
    "utf8"
  );
  await fs.writeFile(path.join(root, "src", "app.txt"), "bug\n", "utf8");
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "chore: initial benchmark fixture"]);
  const initialCommit = (await git(root, ["rev-parse", "HEAD"])).trim();

  await fs.writeFile(path.join(root, "src", "app.txt"), "fixed\n", "utf8");
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "fix: update app text to fixed"]);
  const targetCommit = (await git(root, ["rev-parse", "HEAD"])).trim();

  const config = await createDefaultConfig(root);
  await saveConfig(root, testConfig(config), true);
  return { root, initialCommit, targetCommit };
}

export async function git(cwd: string, args: string[]): Promise<string> {
  const result = await execa("git", args, {
    cwd,
    env: cleanGitEnvironment(),
    extendEnv: false,
    reject: false,
    windowsHide: true
  });
  if (result.exitCode !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function cleanGitEnvironment(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => key !== "GIT_CONFIG_PARAMETERS" && !key.startsWith("GIT_"))
  );
}

function testConfig(config: RepoRacerConfig): RepoRacerConfig {
  return {
    ...config,
    installCommand: null,
    testCommand: "node test.js",
    maxTasks: 1,
    parallelAgents: 2,
    baselineCheck: false,
    agents: [
      { name: "fake-success", enabled: true },
      { name: "fake-noop", enabled: true },
      { name: "fake-risky", enabled: true },
      { name: "custom", command: "node scripts/agent.cjs {{promptFile}}", enabled: true }
    ]
  };
}

export async function createHiddenTestsFixtureRepo(prefix = "reporacer-hidden-fixture-"): Promise<FixtureRepo> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await git(root, ["init"]);
  await git(root, ["config", "user.email", "test@example.com"]);
  await git(root, ["config", "user.name", "RepoRacer Test"]);

  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.mkdir(path.join(root, "scripts"), { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    `${JSON.stringify({ name: "hidden-fixture", version: "1.0.0", scripts: { test: "node test.js" } }, null, 2)}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "package-lock.json"),
    `${JSON.stringify(
      {
        name: "hidden-fixture",
        version: "1.0.0",
        lockfileVersion: 3,
        requires: true,
        packages: {
          "": {
            name: "hidden-fixture",
            version: "1.0.0"
          }
        }
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "test.js"),
    "const fs = require('fs');\nconst text = fs.readFileSync('src/app.txt', 'utf8');\nif (!text.includes('bug')) {\n  console.error('expected bug');\n  process.exit(1);\n}\n",
    "utf8"
  );
  await fs.writeFile(path.join(root, "src", "app.txt"), "bug\n", "utf8");
  await fs.writeFile(
    path.join(root, "scripts", "agent.cjs"),
    "const fs = require('fs');\nfs.writeFileSync('src/app.txt', 'fixed\\n');\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(root, "scripts", "test-mutating-agent.cjs"),
    "const fs = require('fs');\nfs.writeFileSync('test.js', \"console.log('agent changed hidden tests');\\nprocess.exit(0);\\n\");\nfs.writeFileSync('src/app.txt', 'fixed\\n');\n",
    "utf8"
  );
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "chore: initial hidden fixture"]);
  const initialCommit = (await git(root, ["rev-parse", "HEAD"])).trim();

  await fs.writeFile(path.join(root, "src", "app.txt"), "fixed\n", "utf8");
  await fs.writeFile(
    path.join(root, "test.js"),
    "const fs = require('fs');\nconst text = fs.readFileSync('src/app.txt', 'utf8');\nif (!text.includes('fixed')) {\n  console.error('expected fixed');\n  process.exit(1);\n}\n",
    "utf8"
  );
  await git(root, ["add", "."]);
  await git(root, ["commit", "-m", "fix: support fixed app text with regression test"]);
  const targetCommit = (await git(root, ["rev-parse", "HEAD"])).trim();

  const config = await createDefaultConfig(root);
  const nextConfig: RepoRacerConfig = {
    ...testConfig(config),
    baselineCheck: true,
    evaluationMode: "hidden-target-tests",
    hiddenTests: {
      enabled: true,
      includePatterns: ["test.js", "tests/**", "**/*.test.js"]
    }
  };
  await saveConfig(root, nextConfig, true);
  return { root, initialCommit, targetCommit };
}
