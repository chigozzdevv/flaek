import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  MONGO_URI: z.string(),
  REDIS_URL: z.string(),

  // Cloudinary configuration
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),

  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),

  WEBHOOK_SECRET: z.string().min(8),

  SOLANA_RPC_URL: z.string(),
  ARCIUM_SOLANA_SECRET_KEY: z.string(),
  ARCIUM_MXE_PUBLIC_KEY: z.string().optional(),
  ARCIUM_CLUSTER_PUBKEY: z.string().optional(),

  API_KEY_HASH_SALT: z.string().min(8),
  INGEST_TTL_SECONDS: z.coerce.number().default(3600),
});

export const env = envSchema.parse(process.env);
