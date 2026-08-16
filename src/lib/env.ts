import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET is required'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  STITCH_API_KEY: z.string().optional(),
  SMTP_HOST: process.env.NODE_ENV === 'production' ? z.string().min(1, 'SMTP_HOST is required in production') : z.string().optional(),
  SMTP_PORT: process.env.NODE_ENV === 'production' ? z.string().min(1, 'SMTP_PORT is required in production') : z.string().optional(),
  SMTP_USER: process.env.NODE_ENV === 'production' ? z.string().min(1, 'SMTP_USER is required in production') : z.string().optional(),
  SMTP_PASSWORD: process.env.NODE_ENV === 'production' ? z.string().min(1, 'SMTP_PASSWORD is required in production') : z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('❌ Invalid environment variables:', envParsed.error.format());
  throw new Error('Invalid environment variables');
}

export const env = envParsed.data;
