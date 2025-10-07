import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),

  MONGO_URI: z.string(),
  REDIS_URL: z.string(),

  // Cloudinary mapped to S3_* names per request
  S3_ENDPOINT: z.string().url().default('https://api.cloudinary.com'),
  S3_BUCKET: z.string(), // cloud_name
  S3_ACCESS_KEY_ID: z.string(), // api_key
  S3_SECRET_ACCESS_KEY: z.string(), // api_secret

  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),

  WEBHOOK_SECRET: z.string().min(8),

  ARCIUM_PUBLIC_KEY: z.string().optional(),
  SOLANA_RPC_URL: z.string().optional(),
  ARCIUM_SOLANA_SECRET_KEY: z.string().optional(),
  ARCIUM_MXE_PUBLIC_KEY: z.string().optional(),

  API_KEY_HASH_SALT: z.string().min(8),
  INGEST_TTL_SECONDS: z.coerce.number().default(3600),
});

export const env = envSchema.parse(process.env);
