export type RiskLevel = "low" | "medium" | "high" | "critical";

export type EvaluationMode = "working-tree" | "hidden-target-tests";

export type SandboxMode = "none" | "docker";

export type ReportAudience = "private" | "public";

export type RunStatus =
  | "completed"
  | "agent_failed"
  | "test_failed"
  | "timed_out"
  | "no_changes"
  | "risk_blocked"
  | "internal_error";

export interface AgentConfig {
  name: string;
  command?: string;
  enabled: boolean;
  timeoutMinutes?: number;
}

export interface CommitSelectionConfig {
  lookback: number;
  minChangedFiles: number;
  maxChangedFiles: number;
  maxChangedLines: number;
  excludeMergeCommits: boolean;
  excludePatterns: string[];
  preferMessages: string[];
}

export interface RiskRulesConfig {
  failOnTestDeletion: boolean;
  failOnTestWeakening: boolean;
  failOnCiWeakening: boolean;
  failOnEnvFileChanges: boolean;
  warnOnLargeDiff: boolean;
  maxDiffLines: number;
}

export interface ReportConfig {
  openAfterRun: boolean;
  includeLogs: boolean;
  includePatchPreview: boolean;
  audience: ReportAudience;
  redactReport: boolean;
  maxLogPreviewChars: number;
  maxPatchPreviewChars: number;
}

export interface HiddenTestsConfig {
  enabled: boolean;
  includePatterns: string[];
}

export interface SandboxConfig {
  mode: SandboxMode;
  dockerImage: string;
  network: "default" | "none";
  cpus: number;
  memory: string;
}

export interface CiConfig {
  generateGitHubAction: boolean;
  defaultAgents: string[];
  defaultTasks: number;
}

export interface ShareConfig {
  generateMarkdown: boolean;
  generateBadge: boolean;
  publicReportDefaults: boolean;
}

export interface RepoRacerConfig {
  version: 1;
  testCommand: string | null;
  installCommand: string | null;
  maxTasks: number;
  timeoutMinutesPerAgent: number;
  parallelAgents: number;
  parallelTasks: number;
  baselineCheck: boolean;
  evaluationMode: EvaluationMode;
  keepWorktrees: boolean;
  commitSelection: CommitSelectionConfig;
  hiddenTests: HiddenTestsConfig;
  sandbox: SandboxConfig;
  agents: AgentConfig[];
  riskRules: RiskRulesConfig;
  report: ReportConfig;
  ci: CiConfig;
  share: ShareConfig;
}

export interface GitCommitCandidate {
  sha: string;
  parentSha: string;
  message: string;
  timestamp: number;
  changedFiles: string[];
  nameStatuses: NameStatus[];
  insertions: number;
  deletions: number;
  changedLines: number;
  qualityScore: number;
  warnings: string[];
}

export interface NameStatus {
  status: string;
  path: string;
}

export interface RepoRacerTask {
  id: string;
  targetCommit: string;
  parentCommit: string;
  message: string;
  prompt: string;
  changedFiles: string[];
  nameStatuses: NameStatus[];
  insertions: number;
  deletions: number;
  changedLines: number;
  qualityScore: number;
  warnings: string[];
  humanPatchPath: string;
  hiddenTestPatchPath: string | null;
  hiddenTestFiles: string[];
  createdAt: string;
}

export interface CommandRunResult {
  command: string;
  cwd: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  output: string;
  durationMs: number;
  timedOut: boolean;
  failedToStart: boolean;
}

export interface TestRunResult {
  skipped: boolean;
  command: string | null;
  passed: boolean;
  exitCode: number | null;
  durationMs: number;
  output: string;
  phase: "baseline" | "agent" | "hidden";
}

export interface DiffSummary {
  changedFiles: string[];
  nameStatuses: NameStatus[];
  insertions: number;
  deletions: number;
  changedLines: number;
  patchPath: string;
  patchPreview: string;
}

export interface RiskFlag {
  level: RiskLevel;
  code: string;
  message: string;
  file?: string;
}

export interface ScoreBreakdown {
  final: number;
  tests: number;
  hiddenTests: number;
  patchSimilarity: number;
  changedFilesOverlap: number;
  diffSize: number;
  minimality: number;
  speed: number;
  riskPenalty: number;
  solved: boolean;
}

export interface RepoRacerResult {
  id: string;
  taskId: string;
  agentName: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  worktreePath: string;
  promptPath: string;
  logPath: string;
  command: string;
  agentExitCode: number | null;
  agentError: string | null;
  install: CommandRunResult | null;
  baseline: TestRunResult | null;
  tests: TestRunResult;
  hiddenTests: TestRunResult | null;
  diff: DiffSummary;
  risks: RiskFlag[];
  scores: ScoreBreakdown;
  hiddenTestPatchApplied: boolean;
}

export interface LeaderboardRow {
  agent: string;
  solved: number;
  total: number;
  averageScore: number;
  testsPassedRate: number;
  riskFlags: number;
  totalDurationMs: number;
}

export interface RepoRacerSummary {
  version: 1;
  repo: {
    name: string;
    root: string;
    head: string;
  };
  run: {
    id: string;
    startedAt: string;
    finishedAt: string;
    tasks: number;
    agents: string[];
    evaluationMode: EvaluationMode;
    baselineCheck: boolean;
  };
  winner: string | null;
  leaderboard: LeaderboardRow[];
  results: RepoRacerResult[];
}

export interface RepoRacerRunStartEvent {
  repoRoot: string;
  runId: string;
  config: RepoRacerConfig;
  agents: string[];
}

export interface RepoRacerTasksMinedEvent {
  repoRoot: string;
  runId: string;
  tasks: RepoRacerTask[];
}

export interface RepoRacerAgentEvent {
  repoRoot: string;
  runId: string;
  task: RepoRacerTask;
  agentName: string;
}

export interface RepoRacerAgentFinishEvent extends RepoRacerAgentEvent {
  result: RepoRacerResult;
}

export interface RepoRacerRunFinishEvent {
  repoRoot: string;
  runId: string;
  summary: RepoRacerSummary;
}

export interface RepoRacerPluginHooks {
  onRunStart?(event: RepoRacerRunStartEvent): void | Promise<void>;
  onTasksMined?(event: RepoRacerTasksMinedEvent): void | Promise<void>;
  onAgentStart?(event: RepoRacerAgentEvent): void | Promise<void>;
  onAgentFinish?(event: RepoRacerAgentFinishEvent): void | Promise<void>;
  onRunFinish?(event: RepoRacerRunFinishEvent): void | Promise<void>;
}

export interface RunRepoRacerOptions {
  repoRoot?: string;
  agents?: string[];
  maxTasks?: number;
  allowDirty?: boolean;
  openReport?: boolean;
  baselineCheck?: boolean;
  evaluationMode?: EvaluationMode;
  publicReport?: boolean;
  redactReport?: boolean;
  keepWorktrees?: boolean;
  json?: boolean;
  progress?: boolean;
  verbose?: boolean;
  ci?: boolean;
  logFormat?: "text" | "json";
  plugins?: RepoRacerPluginHooks[];
}
