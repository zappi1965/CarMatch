import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { ZodError } from 'zod'
import { config } from './config.js'
import authPlugin from './plugins/auth.js'
import { authRoutes } from './routes/auth.js'
import { vehicleRoutes } from './routes/vehicles.js'
import { swipeRoutes } from './routes/swipes.js'
import { favoriteRoutes } from './routes/favorites.js'
import { savedSearchRoutes } from './routes/savedSearches.js'
import { recommendationRoutes } from './routes/recommendations.js'
import { leadRoutes } from './routes/leads.js'
import { settingsRoutes } from './routes/settings.js'
import { adminRoutes } from './routes/admin.js'
import { vehicleModelRoutes } from './routes/vehicleModels.js'
import { modelSwipeRoutes } from './routes/modelSwipes.js'
import { tasteProfileRoutes } from './routes/tasteProfile.js'
import { discoveryRoutes } from './routes/discovery.js'
import { duelRoutes } from './routes/duels.js'
import { circleRoutes } from './routes/circles.js'
import { garagePlusRoutes } from './routes/garagePlus.js'
import { sellRoutes } from './routes/sell.js'
import { marketRoutes } from './routes/market.js'

export async function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV !== 'test' })

  await app.register(cors, { origin: true })
  await app.register(rateLimit, { max: config.RATE_LIMIT_PER_MINUTE, timeWindow: '1 minute' })
  await app.register(authPlugin)

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.code(400).send({ ok: false, error: 'VALIDATION', details: err.flatten() })
    }
    app.log.error(err)
    const status = 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500
    // Keine internen Details/PII in Fehlerantworten
    reply.code(status).send({ ok: false, error: status === 500 ? 'INTERNAL' : err.message })
  })

  app.get('/health', async () => ({ ok: true, version: '0.2.0' }))

  await app.register(authRoutes, { prefix: '/auth' })
  await app.register(vehicleRoutes, { prefix: '/vehicles' })
  await app.register(swipeRoutes, { prefix: '/swipes' })
  await app.register(favoriteRoutes, { prefix: '/favorites' })
  await app.register(savedSearchRoutes, { prefix: '/saved-searches' })
  await app.register(recommendationRoutes, { prefix: '/recommendations' })
  await app.register(leadRoutes, { prefix: '/leads' })
  await app.register(settingsRoutes, { prefix: '/settings' })
  await app.register(adminRoutes, { prefix: '/admin' })
  // Hybrid: Inspirationsmodus (Fahrzeugmodelle + Geschmacksprofil)
  await app.register(vehicleModelRoutes, { prefix: '/vehicle-models' })
  await app.register(modelSwipeRoutes, { prefix: '/model-swipes' })
  await app.register(tasteProfileRoutes, { prefix: '/taste-profile' })
  await app.register(discoveryRoutes, { prefix: '/discovery' })
  // Erweiterungen: Duell, gemeinsame Suche, Sparziele/Besitz, C2B, Markttrend
  await app.register(duelRoutes, { prefix: '/duels' })
  await app.register(circleRoutes, { prefix: '/circles' })
  await app.register(garagePlusRoutes, { prefix: '/garage' })
  await app.register(sellRoutes, { prefix: '/sell' })
  await app.register(marketRoutes, { prefix: '/market' })

  return app
}
