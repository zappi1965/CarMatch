import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getModelTrend } from '../services/marketService.js'

/** Markttrend/Kauf-Timing: "Preise für dieses Modell fallen gerade". */
export async function marketRoutes(app: FastifyInstance) {
  app.get('/trend', async (req) => {
    const q = z.object({ make: z.string().min(1), model: z.string().min(1) }).parse(req.query)
    return { ok: true, data: await getModelTrend(q.make, q.model) }
  })
}
