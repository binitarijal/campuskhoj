import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ path: new URL('../../.env', import.meta.url) })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
  FRONTEND_URL: z.string().trim().min(1, 'FRONTEND_URL is required').transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)).refine((origins) => origins.length > 0 && origins.every((origin) => {
    try {
      const parsed = new URL(origin)
      return ['http:', 'https:'].includes(parsed.protocol) && parsed.origin === origin.replace(/\/$/, '')
    } catch {
      return false
    }
  }), 'FRONTEND_URL must contain one or more valid origins separated by commas'),
  GOOGLE_CLIENT_ID: z.string().trim().min(1, 'GOOGLE_CLIENT_ID is required'),
  INITIAL_ADMIN_EMAIL: z.union([z.literal(''), z.string().trim().email()]).optional().transform((value) => value || undefined),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().trim().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().trim().min(1, 'CLOUDINARY_API_SECRET is required'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join('.')).filter(Boolean)
  const summary = [...new Set(fields)].join(', ') || 'environment configuration'
  throw new Error(`Invalid backend environment configuration. Check: ${summary}. Values are not displayed.`)
}

export const env = Object.freeze(parsed.data)
