import { z } from 'zod';

export const verifyAttestationSchema = z.object({
  body: z.object({
    pipeline_hash: z.string(),
    attestation: z.any(),
  }),
});
