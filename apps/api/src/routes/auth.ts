import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../db.js'
import { config } from '../config.js'
import { track } from '../services/analyticsService.js'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  locale: z.string().max(5).optional(),
})

export async function authRoutes(app: FastifyInstance) {
  const sign = (user: { id: string; role: string }) =>
    app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: config.JWT_EXPIRES_IN })

  app.post('/register', async (req, reply) => {
    const body = credentialsSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) return reply.code(409).send({ ok: false, error: 'EMAIL_TAKEN' })
    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 10),
        authProvider: 'EMAIL',
        locale: body.locale ?? 'de',
      },
    })
    await track('register', user.id)
    return { ok: true, token: sign(user), user: publicUser(user) }
  })

  app.post('/login', async (req, reply) => {
    const body = credentialsSchema.pick({ email: true, password: true }).parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user?.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ ok: false, error: 'INVALID_CREDENTIALS' })
    }
    return { ok: true, token: sign(user), user: publicUser(user) }
  })

  /**
   * OAuth: Google via tokeninfo-Validierung (serverseitig).
   * Apple erfordert JWKS-Verifikation + APPLE_CLIENT_ID — vorbereitet, aktiviert in v0.2.
   */
  app.post('/oauth', async (req, reply) => {
    const body = z
      .object({ provider: z.enum(['google', 'apple']), idToken: z.string(), locale: z.string().max(5).optional() })
      .parse(req.body)

    if (body.provider === 'google') {
      if (!config.GOOGLE_OAUTH_CLIENT_ID)
        return reply.code(501).send({ ok: false, error: 'GOOGLE_OAUTH_NOT_CONFIGURED' })
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(body.idToken)}`,
      )
      if (!res.ok) return reply.code(401).send({ ok: false, error: 'INVALID_TOKEN' })
      const info = (await res.json()) as { aud?: string; email?: string; email_verified?: string }
      if (info.aud !== config.GOOGLE_OAUTH_CLIENT_ID || !info.email || info.email_verified !== 'true') {
        return reply.code(401).send({ ok: false, error: 'INVALID_TOKEN' })
      }
      const user = await prisma.user.upsert({
        where: { email: info.email },
        create: { email: info.email, authProvider: 'GOOGLE', locale: body.locale ?? 'de' },
        update: {},
      })
      return { ok: true, token: sign(user), user: publicUser(user) }
    }

    // Apple Sign-In: benötigt APPLE_CLIENT_ID + JWKS-Prüfung (https://appleid.apple.com/auth/keys)
    return reply.code(501).send({ ok: false, error: 'APPLE_OAUTH_NOT_YET_AVAILABLE' })
  })

  /** Gastmodus: datensparsam, ohne E-Mail; später in Konto umwandelbar. */
  app.post('/guest', async (req) => {
    const body = z.object({ locale: z.string().max(5).optional() }).parse(req.body ?? {})
    const user = await prisma.user.create({
      data: { authProvider: 'GUEST', locale: body.locale ?? 'de' },
    })
    await track('guest_start', user.id)
    return { ok: true, token: sign(user), user: publicUser(user) }
  })

  /** Gast → vollwertiges Konto (Favoriten/Profil bleiben erhalten). */
  app.post('/upgrade-guest', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = credentialsSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
    if (!user || user.authProvider !== 'GUEST')
      return reply.code(400).send({ ok: false, error: 'NOT_A_GUEST' })
    const taken = await prisma.user.findUnique({ where: { email: body.email } })
    if (taken) return reply.code(409).send({ ok: false, error: 'EMAIL_TAKEN' })
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: body.email,
        passwordHash: await bcrypt.hash(body.password, 10),
        authProvider: 'EMAIL',
      },
    })
    return { ok: true, token: sign(updated), user: publicUser(updated) }
  })

  /** DSGVO: vollständige Löschung des Kontos samt aller Daten. */
  app.delete('/me', { preHandler: [app.authenticate] }, async (req) => {
    await prisma.user.delete({ where: { id: req.user.sub } })
    return { ok: true }
  })
}

function publicUser(u: { id: string; email: string | null; authProvider: string; locale: string; role: string }) {
  return { id: u.id, email: u.email, authProvider: u.authProvider, locale: u.locale, role: u.role }
}
