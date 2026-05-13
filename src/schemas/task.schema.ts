import { z } from "zod";

export const nameStatusSchema = z.object({
  status: z.string().min(1),
  path: z.string().min(1)
});

export const repoRacerTaskSchema = z.object({
  id: z.string().min(1),
  targetCommit: z.string().min(7),
  parentCommit: z.string().min(7),
  message: z.string().min(1),
  prompt: z.string().min(1),
  changedFiles: z.array(z.string()),
  nameStatuses: z.array(nameStatusSchema),
  insertions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  changedLines: z.number().int().nonnegative(),
  qualityScore: z.number().min(0).max(100),
  warnings: z.array(z.string()),
  humanPatchPath: z.string().min(1),
  hiddenTestPatchPath: z.string().min(1).nullable(),
  hiddenTestFiles: z.array(z.string()),
  createdAt: z.string().min(1)
});
