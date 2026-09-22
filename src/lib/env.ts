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
  API_KEY_ENCRYPTION_SECRET: z.string().min(32, 'API_KEY_ENCRYPTION_SECRET minimal 32 karakter'),
});

const isBuildPhase = process.env.npm_lifecycle_event === 'build' || process.env.NEXT_PHASE === 'phase-production-build';

const envParsed = isBuildPhase
  ? {
      success: true as const,
      data: {
        DATABASE_URL: process.env.DATABASE_URL || '',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        STITCH_API_KEY: process.env.STITCH_API_KEY,
        SMTP_HOST: process.env.SMTP_HOST || '',
        SMTP_PORT: process.env.SMTP_PORT || '',
        SMTP_SECURE: process.env.SMTP_SECURE,
        SMTP_USER: process.env.SMTP_USER || '',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
        SMTP_FROM: process.env.SMTP_FROM || '',
        API_KEY_ENCRYPTION_SECRET: process.env.API_KEY_ENCRYPTION_SECRET || '',
      },
    }
  : envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:', envParsed.error?.format());
  throw new Error('Invalid environment variables');
}

export const env = envParsed.data;
