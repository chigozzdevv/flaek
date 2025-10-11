import { z } from 'zod';

export const createOperationSchema = z.object({
  body: z.object({
    name: z.string(),
    version: z.string(),
    pipeline_spec: z.object({
      idl: z.any().optional(),
      circuit_name: z.string().optional(),
      comp_def_offset: z.number().int().nonnegative().optional(),
    }).passthrough(),
    pipeline_hash: z.string(),
    artifact_uri: z.string(),
    runtime: z.enum(['container', 'wasm', 'arcium']),
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
    mxeProgramId: z.string(),
    programId: z.string().optional(),
    method: z.string().optional(),
    accounts: z.any().optional(),
  }),
});
