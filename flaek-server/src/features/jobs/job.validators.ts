import { z } from 'zod';

export const createJobSchema = z.object({
  body: z.object({
    dataset_id: z.string(),
    operation: z.string(),
    encrypted_inputs: z.object({
      ct0: z.array(z.number()),
      ct1: z.array(z.number()),
      client_public_key: z.array(z.number()),
      nonce: z.union([z.string(), z.array(z.number())])
    }),
    result_format: z.enum(['per_user', 'aggregates']).optional(),
    callback_url: z.string().url().optional(),
  }),
});
