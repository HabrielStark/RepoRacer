import { z } from "zod";
import { repoRacerResultSchema } from "./result.schema.js";

export const leaderboardRowSchema = z.object({
  agent: z.string(),
  solved: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  averageScore: z.number().min(0).max(100),
  testsPassedRate: z.number().min(0).max(1),
  riskFlags: z.number().int().nonnegative(),
  totalDurationMs: z.number().int().nonnegative()
});

export const repoRacerSummarySchema = z.object({
  version: z.literal(1),
  repo: z.object({
    name: z.string(),
    root: z.string(),
    head: z.string()
  }),
  run: z.object({
    id: z.string(),
    startedAt: z.string(),
    finishedAt: z.string(),
    tasks: z.number().int().nonnegative(),
    agents: z.array(z.string()),
    evaluationMode: z.enum(["working-tree", "hidden-target-tests"]),
    baselineCheck: z.boolean()
  }),
  winner: z.string().nullable(),
  leaderboard: z.array(leaderboardRowSchema),
  results: z.array(repoRacerResultSchema)
});
