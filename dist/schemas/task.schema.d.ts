import { z } from "zod";
export declare const nameStatusSchema: z.ZodObject<{
    status: z.ZodString;
    path: z.ZodString;
}, z.core.$strip>;
export declare const repoRacerTaskSchema: z.ZodObject<{
    id: z.ZodString;
    targetCommit: z.ZodString;
    parentCommit: z.ZodString;
    message: z.ZodString;
    prompt: z.ZodString;
    changedFiles: z.ZodArray<z.ZodString>;
    nameStatuses: z.ZodArray<z.ZodObject<{
        status: z.ZodString;
        path: z.ZodString;
    }, z.core.$strip>>;
    insertions: z.ZodNumber;
    deletions: z.ZodNumber;
    changedLines: z.ZodNumber;
    qualityScore: z.ZodNumber;
    warnings: z.ZodArray<z.ZodString>;
    humanPatchPath: z.ZodString;
    hiddenTestPatchPath: z.ZodNullable<z.ZodString>;
    hiddenTestFiles: z.ZodArray<z.ZodString>;
    createdAt: z.ZodString;
}, z.core.$strip>;
