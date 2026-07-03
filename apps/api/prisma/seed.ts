/**
 * Seed für den Demo-Modus: importiert die Demo-Inserate über denselben
 * Sync-Pfad wie echte Provider (inkl. Enrichment) und legt einen Admin an.
 * Nur für Entwicklung — Demo-Provider ist in Produktion gesperrt.
 */
import bcrypt from 'bcryptjs'
import { prisma } from '../src/db.js'
import { syncAllProviders } from '../src/jobs/syncListings.js'
import { vehicleModelSeeds } from '../src/models/vehicleModelSeed.js'
import { rebuildModelListingMatches } from '../src/services/modelMatchService.js'

const result = await syncAllProviders()
console.log('Sync:', result)

// Inspirationsmodus: generelle Fahrzeugmodelle (DEMO-gekennzeichnet)
for (const seed of vehicleModelSeeds) {
  const { strengths, weaknesses, tags, specs, imageUrls, ...rest } = seed
  const existing = await prisma.vehicleModel.findFirst({
    where: { make: seed.make, model: seed.model, variant: seed.variant ?? null },
  })
  const model = existing ?? await prisma.vehicleModel.create({
    data: {
      ...rest,
      bodyType: seed.bodyType as never,
      drivetrain: (seed.drivetrain ?? null) as never,
      fuelTypes: seed.fuelTypes,
      transmissionTypes: seed.transmissionTypes,
      imageUrls,
      imagesAreDemo: true,
      strengthsJson: strengths,
      weaknessesJson: weaknesses,
      tagsJson: tags,
      source: 'DEMO',
      sourceConfidence: 0.5,
    },
  })
  if (specs) {
    await prisma.vehicleModelSpecs.upsert({
      where: { vehicleModelId: model.id },
      create: { vehicleModelId: model.id, ...specs, confidence: 0.5, source: 'DEMO' },
      update: {},
    })
  }
}
console.log(`Fahrzeugmodelle: ${vehicleModelSeeds.length} (DEMO)`)

const matches = await rebuildModelListingMatches()
console.log(`Modell-zu-Inserat-Matches: ${matches.matches}`)

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
