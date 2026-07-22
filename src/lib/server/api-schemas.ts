import { z } from "zod";

const shortString = z.string().trim().max(500);
export const recommendationRequestSchema = z.object({ profile: z.record(z.string(), z.unknown()).optional(), plannedApplicationCount: z.number().int().min(1).max(20).optional() }).passthrough();
export const motivationLetterRequestSchema = z.object({
  studentProfile: z.record(z.string(), z.unknown()),
  school: z.object({ universityName: shortString.min(1), programName: shortString.min(1), country: shortString.min(1), fit: z.string().max(2_000).optional(), requirements: z.array(z.unknown()).max(20).optional() }),
}).refine(value => JSON.stringify(value).length <= 20_000, "Input is too long");
export const institutionCheckSchema = z.object({ targetUniversityId: z.string().trim().min(1).max(100), institutionName: z.string().trim().min(1).max(300), average: z.number().min(0).max(100).optional() });
export const ingestionRequestSchema = z.object({ trigger: z.enum(["preload", "scheduled_refresh", "manual_retry"]).optional(), priority: z.number().int().min(0).max(100).optional() });
export const rankingQuerySchema = z.array(z.string().trim().min(1).max(100)).max(100);


