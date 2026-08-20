import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  STITCH_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().min(1, 'SMTP_PORT is required'),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),
  SMTP_FROM: z.string().min(1, 'SMTP_FROM is required'),
});

const isBuildPhase = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';

let envParsed;
if (isBuildPhase) {
  envParsed = { success: true, data: process.env as unknown as z.infer<typeof envSchema> };
} else {
  envParsed = envSchema.safeParse(process.env);
}

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:', envParsed.error?.format());
  throw new Error('Invalid environment variables');
}

export const env = envParsed.data;
