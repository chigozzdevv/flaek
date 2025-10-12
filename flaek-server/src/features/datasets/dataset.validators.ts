import { z } from 'zod';

export const createDatasetSchema = z.object({
  body: z.object({
    name: z.string(),
    schema: z.any(),
    retention_days: z.number().optional(),
  }),
});
