/**
 * Seed für den Demo-Modus: importiert die Demo-Inserate über denselben
 * Sync-Pfad wie echte Provider (inkl. Enrichment) und legt einen Admin an.
 * Nur für Entwicklung — Demo-Provider ist in Produktion gesperrt.
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../src/db.js'
import { syncAllProviders } from '../src/jobs/syncListings.js'

const result = await syncAllProviders()
console.log('Sync:', result)

const adminEmail = 'admin@carmatch.local'
await prisma.user.upsert({
  where: { email: adminEmail },
  create: {
    email: adminEmail,
    passwordHash: await bcrypt.hash('admin-dev-password', 10),
    authProvider: 'EMAIL',
    role: 'ADMIN',
    locale: 'de',
  },
  update: { role: 'ADMIN' },
})
console.log(`Admin angelegt: ${adminEmail} / admin-dev-password (nur Entwicklung!)`)

await prisma.$disconnect()
