#!/usr/bin/env node
import { Command } from "commander";
import { cleanRepoRacer } from "./commands/clean.js";
import { generateCiTemplate } from "./commands/ci.js";
import { runDoctor } from "./commands/doctor.js";
import { initRepoRacer } from "./commands/init.js";
import { openRepoRacerReport } from "./commands/open.js";
import { regenerateReport } from "./commands/report.js";
import { renderRunSummary, runRepoRacer } from "./commands/run.js";
import { generateConfigSchema } from "./commands/schema.js";
import { generateShareArtifacts } from "./commands/share.js";
import { renderTasks, selectTasks } from "./commands/tasks.js";
import { logger } from "./core/logger.js";
import { toErrorMessage } from "./utils/errors.js";

const program = new Command();

program
  .name("reporacer")
  .description("Benchmark AI coding agents on your own repository using real tasks mined from git history.")
  .version("1.0.0")
  .action(async () => {
    const summary = await runRepoRacer({ progress: true });
    logger.info(renderRunSummary(summary));
  });

program
  .command("init")
  .description("Create .reporacer/config.json")
  .option("-f, --force", "overwrite existing config")
  .action(async (options: { force?: boolean }) => {
    const filePath = await initRepoRacer({ force: Boolean(options.force) });
    logger.success(`Created ${filePath}`);
  });

program
  .command("doctor")
  .description("Check local RepoRacer prerequisites")
  .action(async () => {
    logger.info(await runDoctor());
  });

program
  .command("tasks")
  .description("Mine and print selected benchmark tasks")
  .option("-n, --tasks <count>", "maximum number of tasks", parseInteger)
  .action(async (options: { tasks?: number }) => {
    const result = await selectTasks(options.tasks === undefined ? {} : { maxTasks: options.tasks });
    logger.info(renderTasks(result.tasks));
  });

program
  .command("run")
  .description("Run the benchmark")
  .option("-a, --agents <names>", "comma-separated agent names")
  .option("-n, --tasks <count>", "maximum number of tasks", parseInteger)
  .option("--allow-dirty", "allow running when the source checkout has uncommitted non-RepoRacer changes")
  .option("--baseline-check", "run tests before each agent and reject unstable parent states")
  .option("--evaluation-mode <mode>", "evaluation mode: working-tree or hidden-target-tests")
  .option("--public-report", "generate a public report without logs or patch previews")
  .option("--redact-report", "enable secret redaction in the generated report")
  .option("--no-redact-report", "disable secret redaction in the generated private report")
  .option("--keep-worktrees", "keep generated worktrees after the run")
  .option("--quiet", "suppress progress output")
  .option("--verbose", "include verbose progress details")
  .option("--ci", "use CI-friendly progress output")
  .option("--log-format <format>", "progress log format: text or json")
  .option("--open", "open the generated report after the run")
  .option("--json", "print summary JSON")
  .action(
    async (options: {
      agents?: string;
      tasks?: number;
      allowDirty?: boolean;
      baselineCheck?: boolean;
      evaluationMode?: string;
      publicReport?: boolean;
      redactReport?: boolean;
      keepWorktrees?: boolean;
      quiet?: boolean;
      verbose?: boolean;
      ci?: boolean;
      logFormat?: string;
      open?: boolean;
      json?: boolean;
    }) => {
      if (options.logFormat !== undefined && options.logFormat !== "text" && options.logFormat !== "json") {
        throw new Error(`Unknown log format: ${options.logFormat}`);
      }
      const runOptions: NonNullable<Parameters<typeof runRepoRacer>[0]> = {
        allowDirty: Boolean(options.allowDirty),
        ...(options.redactReport === undefined ? {} : { redactReport: options.redactReport }),
        json: Boolean(options.json),
        progress: options.quiet !== true && options.json !== true,
        verbose: Boolean(options.verbose),
        ci: Boolean(options.ci)
      };
      if (options.logFormat !== undefined) {
        runOptions.logFormat = options.logFormat;
      }
      if (options.baselineCheck !== undefined) {
        runOptions.baselineCheck = options.baselineCheck;
      }
      if (options.publicReport !== undefined) {
        runOptions.publicReport = options.publicReport;
      }
      if (options.keepWorktrees !== undefined) {
        runOptions.keepWorktrees = options.keepWorktrees;
      }
      if (options.open !== undefined) {
        runOptions.openReport = options.open;
      }
      const agents = parseAgents(options.agents);
      if (agents !== undefined) {
        runOptions.agents = agents;
      }
      if (options.tasks !== undefined) {
        runOptions.maxTasks = options.tasks;
      }
      if (options.evaluationMode !== undefined) {
        if (options.evaluationMode !== "working-tree" && options.evaluationMode !== "hidden-target-tests") {
          throw new Error(`Unknown evaluation mode: ${options.evaluationMode}`);
        }
        runOptions.evaluationMode = options.evaluationMode;
      }
      const summary = await runRepoRacer(runOptions);
      logger.info(options.json ? JSON.stringify(summary, null, 2) : renderRunSummary(summary));
    }
  );

program
  .command("report")
  .description("Regenerate .reporacer/report.html from summary.json")
  .action(async () => {
    logger.success(`Report: ${await regenerateReport()}`);
  });

program
  .command("ci")
  .description("Generate a GitHub Actions workflow template under .reporacer/")
  .action(async () => {
    logger.success(`GitHub Action template: ${await generateCiTemplate()}`);
  });

program
  .command("share")
  .description("Generate public share artifacts from the latest summary")
  .action(async () => {
    const artifacts = await generateShareArtifacts();
    logger.success(
      [
        artifacts.markdownPath === null ? "Share markdown: disabled" : `Share markdown: ${artifacts.markdownPath}`,
        artifacts.badgePath === null ? "Badge: disabled" : `Badge: ${artifacts.badgePath}`,
        artifacts.publicReportPath === null ? "Public report: disabled" : `Public report: ${artifacts.publicReportPath}`
      ].join("\n")
    );
  });

program
  .command("schema")
  .description("Generate JSON schema for .reporacer/config.json")
  .action(async () => {
    logger.success(`Config schema: ${await generateConfigSchema()}`);
  });

program
  .command("open")
  .description("Open .reporacer/report.html")
  .action(async () => {
    logger.success(`Opened ${await openRepoRacerReport()}`);
  });

program
  .command("clean")
  .description("Remove RepoRacer generated data")
  .option("--all", "remove run outputs, patches, reports, summaries, and logs")
  .option("--config", "also remove .reporacer/config.json")
  .action(async (options: { all?: boolean; config?: boolean }) => {
    const removed = await cleanRepoRacer({ all: Boolean(options.all), config: Boolean(options.config) });
    logger.success(
      removed.length === 0 ? "Nothing to clean." : `Removed:\n${removed.map((item) => `- ${item}`).join("\n")}`
    );
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  logger.error(toErrorMessage(error));
  process.exitCode = 1;
});

function parseInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got ${value}`);
  }
  return parsed;
}

function parseAgents(value: string | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}
