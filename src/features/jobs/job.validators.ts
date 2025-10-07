import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    dataset_id: z.string(),
    operation: z.string(),
    parameters: z.any().optional(),
    inputs: z.any().optional(),
    result_format: z.enum(['per_user', 'aggregates']).optional(),
    callback_url: z.string().url().optional(),
  }),
});
