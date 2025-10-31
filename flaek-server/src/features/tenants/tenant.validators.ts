import { z } from 'zod';

export const createKeySchema = z.object({
  body: z.object({ name: z.string().min(1).optional() }),
});

export const revokeKeySchema = z.object({
  params: z.object({ keyId: z.string().min(1) }),
});

export const updateTenantSchema = z.object({
  body: z.object({ name: z.string().min(2) }),
});

