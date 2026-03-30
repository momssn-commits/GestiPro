import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV:      z.enum(['development', 'production', 'test']).default('development'),
  PORT:          z.coerce.number().default(4000),
  DATABASE_URL:  z.string().url(),
  JWT_SECRET:    z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  S3_ENDPOINT:   z.string().url(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET:     z.string().default('gestipro-files'),
  S3_REGION:     z.string().default('us-east-1'),
  FRONTEND_URL:           z.string().default('http://localhost:3000'),
  APP_PUBLIC_URL:         z.string().default('http://localhost:4000'),
  ONLYOFFICE_DOC_SERVER:  z.string().url().default('https://api.onlyoffice.com/'),
  ONLYOFFICE_JWT_SECRET:  z.string().default('onlyoffice-jwt-secret-change-me'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format())
  process.exit(1)
}

export const env = parsed.data
