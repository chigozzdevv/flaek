import { z } from 'zod';

export const testWebhookSchema = z.object({
  body: z.object({ url: z.string().url() }),
});

