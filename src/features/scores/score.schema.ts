import { z } from "zod";
import { getScoreMonth, SCORE_PAGE_SIZE } from "./score.constants";

export const scorePeriodSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).default(getScoreMonth),
});

export const scoreHistorySchema = scorePeriodSchema.extend({
  limit: z.coerce.number().int().min(1).max(100).default(SCORE_PAGE_SIZE),
  offset: z.coerce.number().int().min(0).default(0),
});
