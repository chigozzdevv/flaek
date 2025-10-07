import { z } from 'zod';

export const createOperationSchema = z.object({
  body: z.object({
    name: z.string(),
    version: z.string(),
    pipeline_spec: z.any(),
    pipeline_hash: z.string(),
    artifact_uri: z.string(),
    runtime: z.enum(['container', 'wasm', 'arcium']),
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
    programId: z.string().optional(),
    method: z.string().optional(),
    accounts: z.any().optional(),
  }),
});
