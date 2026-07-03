import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4100),
  DATABASE_URL: z.string().default('postgresql://carmatch:carmatch@localhost:5432/carmatch'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().default('dev-only-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('30d'),
  ADMIN_TOKEN: z.string().optional(),

  // Provider — Quellen sind per ENV aktivierbar/deaktivierbar
  ENABLED_PROVIDERS: z.string().default('demo'), // kommagetrennt: demo,mobile_de,partner_feed
  MOBILE_DE_API_USERNAME: z.string().optional(),
  MOBILE_DE_API_PASSWORD: z.string().optional(),
  MOBILE_DE_API_BASE_URL: z.string().default('https://services.mobile.de/search-api'),
  AUTOSCOUT_API_KEY: z.string().optional(),
  PARTNER_FEED_URL: z.string().optional(),
  VEHICLE_SPECS_API_KEY: z.string().optional(),

  // Geocoding
  MAPS_GEOCODING_API_KEY: z.string().optional(),

  // Push
  EXPO_PUSH_ENABLED: z.coerce.boolean().default(false),

  // Auth-Provider (OAuth)
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),

  // Payments (vorbereitet, MVP ungenutzt)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Rate Limits
  RATE_LIMIT_PER_MINUTE: z.coerce.number().default(120),
  SYNC_INTERVAL_MINUTES: z.coerce.number().default(30),
})

export type AppConfig = z.infer<typeof envSchema>

export const config: AppConfig = envSchema.parse(process.env)

export const enabledProviders = config.ENABLED_PROVIDERS.split(',')
  .map((p) => p.trim())
  .filter(Boolean)

if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'dev-only-secret-change-me') {
  throw new Error('JWT_SECRET muss in Produktion gesetzt sein')
}
if (config.NODE_ENV === 'production' && enabledProviders.includes('demo')) {
  // Demo-Daten sind strikt von Produktion getrennt
  throw new Error('Der Demo-Provider darf in Produktion nicht aktiviert sein (ENABLED_PROVIDERS)')
}
