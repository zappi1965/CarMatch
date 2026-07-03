import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { config } from '../config.js'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: string }
    user: { sub: string; role: string }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireAdmin: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(jwt, { secret: config.JWT_SECRET })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.code(401).send({ ok: false, error: 'UNAUTHORIZED' })
    }
  })

  // Admin: JWT mit role=ADMIN ODER statischer ADMIN_TOKEN (MVP; wird in v0.2
  // durch vollständige Admin-Accounts ersetzt)
  app.decorate('requireAdmin', async (req: FastifyRequest, reply: FastifyReply) => {
    const headerToken = req.headers['x-admin-token']
    if (config.ADMIN_TOKEN && headerToken === config.ADMIN_TOKEN) return
    try {
      await req.jwtVerify()
      if (req.user.role !== 'ADMIN') throw new Error()
    } catch {
      reply.code(403).send({ ok: false, error: 'FORBIDDEN' })
    }
  })
})
