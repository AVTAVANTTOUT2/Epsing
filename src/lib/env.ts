import { z } from 'zod';

const envSchema = z.object({
  DATABASE_PATH: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  EPSI_REGISTRATION_CODE: z.string().min(1),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default('Epsing'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const messages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${messages}`);
  }
  return result.data;
}

export const env = validateEnv();
