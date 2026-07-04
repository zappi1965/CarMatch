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



const knowledgeByModel: Record<string, { summary: string; commonIssues: string[]; maintenanceNotes: string[]; ownerSentiment: string; reliabilityScore: number; comfortScore: number; sportinessScore: number; familyScore: number; buyingAdvice: string }> = {
  'Porsche Panamera': { summary: 'Luxus-GT mit hoher Langstreckenqualität, aber spürbaren Unterhaltskosten.', commonIssues: ['Luftfahrwerk und adaptive Dämpfer prüfen', 'Hybrid-Batterie und Ladehistorie ansehen', 'Bremsen/Reifen teuer'], maintenanceNotes: ['Porsche-Historie wertvoll', 'Keramikbremse genau prüfen'], ownerSentiment: 'Sehr emotional, teuer im Detail.', reliabilityScore: 72, comfortScore: 92, sportinessScore: 88, familyScore: 74, buyingAdvice: 'Nur mit nachvollziehbarer Historie, gutem Reifen-/Bremsenzustand und realistischer Monatskostenrechnung kaufen.' },
  'BMW M5': { summary: 'Extrem schnelle Business-Limousine mit V8-Unterhalt.', commonIssues: ['Ölserviceintervalle ernst nehmen', 'Bremsen/Reifen hoher Verschleiß', 'Track-Nutzung erkennen'], maintenanceNotes: ['Wartungsnachweise und Softwarestände prüfen'], ownerSentiment: 'Brutal schnell, alltagstauglich, teuer.', reliabilityScore: 70, comfortScore: 84, sportinessScore: 95, familyScore: 72, buyingAdvice: 'Zustand und Vorbesitzer wichtiger als der günstigste Preis.' },
  'Audi RS5': { summary: 'Allwetter-Sportcoupé mit quattro-Traktion und guter Verarbeitung.', commonIssues: ['Getriebeölservice prüfen', 'Bremsen und Fahrwerk bei Laufleistung', 'Elektronik-Ausstattung testen'], maintenanceNotes: ['Scheckheft und Reifenbild prüfen'], ownerSentiment: 'Schnell und sicher, weniger roh als M/AMG.', reliabilityScore: 76, comfortScore: 80, sportinessScore: 86, familyScore: 55, buyingAdvice: 'Gute Wahl, wenn Traktion und Alltag wichtiger sind als maximale Emotion.' },
  'Mercedes-Benz C 63 AMG': { summary: 'V8-Charakterauto mit hohem Spaßfaktor und entsprechendem Unterhalt.', commonIssues: ['Thermik/Ölverlust prüfen', 'Hinterreifen und Bremsen', 'Performance-Abgasanlage und Tuninghistorie'], maintenanceNotes: ['AMG-Servicehistorie wichtig'], ownerSentiment: 'Sound und Charakter stark, Verbrauch hoch.', reliabilityScore: 68, comfortScore: 76, sportinessScore: 93, familyScore: 65, buyingAdvice: 'Keine Bastel-/Tuningfahrzeuge kaufen, lieber teurer mit sauberer Historie.' },
  'Tesla Model 3': { summary: 'Effizientes E-Auto mit starkem Alltagsnutzen und niedrigen Energiekosten.', commonIssues: ['Spaltmaße/Lack prüfen', 'Akkuzustand und Ladeleistung ansehen', 'Fahrwerksgeräusche'], maintenanceNotes: ['Reifenverschleiß durch Drehmoment beachten'], ownerSentiment: 'Sehr effizient, Software stark, Innenraum Geschmackssache.', reliabilityScore: 78, comfortScore: 74, sportinessScore: 78, familyScore: 78, buyingAdvice: 'Akkuzustand, Garantie und Ladeprofil prüfen; sehr stark bei eigener Lademöglichkeit.' },
  'Volkswagen Golf': { summary: 'Alltagsklassiker mit guter Teileversorgung und breiter Zielgruppe.', commonIssues: ['Infotainment-Software', 'DSG-Service', 'Bremsen/Fahrwerk bei GTI'], maintenanceNotes: ['Wartung günstig bis mittel'], ownerSentiment: 'Praktisch, schnell genug, leicht wiederverkaufbar.', reliabilityScore: 80, comfortScore: 74, sportinessScore: 76, familyScore: 82, buyingAdvice: 'Beim GTI auf Serienzustand und Wartung achten.' },
  'Mazda MX-5': { summary: 'Leichter Roadster mit viel Fahrspaß und überschaubaren Kosten.', commonIssues: ['Rost an Unterboden/Radläufen prüfen', 'Verdeck/Dichtungen ansehen', 'Kupplung bei harter Nutzung'], maintenanceNotes: ['Günstiger als viele Sportwagen'], ownerSentiment: 'Puristisch, leicht, sehr beliebt.', reliabilityScore: 84, comfortScore: 58, sportinessScore: 82, familyScore: 20, buyingAdvice: 'Bester Kauf als gepflegtes Saisonauto mit Rostcheck.' },
  'Porsche 911': { summary: 'Sehr wertstabiler Sportwagen mit hoher Alltagstauglichkeit.', commonIssues: ['Überdreher/Track-Nutzung prüfen', 'PASM/Bremsen/Reifen teuer', 'Unfallfreiheit extrem wichtig'], maintenanceNotes: ['Porsche Approved kann Wert sichern'], ownerSentiment: 'Ikone mit starkem Werterhalt.', reliabilityScore: 82, comfortScore: 78, sportinessScore: 97, familyScore: 45, buyingAdvice: 'Historie, Zustand und Spezifikation entscheiden stärker als Kilometer allein.' },
}

for (const model of await prisma.vehicleModel.findMany()) {
  const key = `${model.make} ${model.model}`
  const genericIssues = model.fuelTypes && Array.isArray(model.fuelTypes) && (model.fuelTypes as string[]).includes('ELECTRIC')
    ? ['Akkuzustand/SoH und Ladeleistung prüfen', 'Winterreichweite realistisch kalkulieren', 'Reifenverschleiß durch hohes Drehmoment beachten']
    : model.bodyType === 'SUV'
      ? ['Reifen- und Bremsenkosten wegen Gewicht prüfen', 'Fahrwerk/Lager und Allradkomponenten ansehen', 'Verbrauch im Alltag realistisch kalkulieren']
      : model.segment?.toLowerCase().includes('sport')
        ? ['Bremsen, Reifen und mögliche Track-Nutzung prüfen', 'Tuning-/Softwarehistorie klären', 'Kaltstart und Öl-/Getriebeverhalten testen']
        : ['Servicehistorie und HU-Berichte prüfen', 'Ausstattung und Elektronik vollständig testen', 'Verschleißteile abhängig von Laufleistung kalkulieren']
  const k = knowledgeByModel[key] ?? {
    summary: `${model.make} ${model.model}: Demo-Modellwissen mit typischen Kaufprüfpunkten, Monatskosten-Fokus und Alltagseinschätzung.`,
    commonIssues: genericIssues,
    maintenanceNotes: ['Wartungsnachweise wichtiger als reines Baujahr', 'Reifen, Bremsen und Fahrwerk vor Kauf prüfen', 'Bei hoher Laufleistung Rücklagen einplanen'],
    ownerSentiment: 'Demo-Zusammenfassung aus Fahrzeugklasse, Segment und typischen Kaufkriterien.',
    reliabilityScore: model.bodyType === 'SUV' ? 72 : model.segment?.toLowerCase().includes('sport') ? 68 : 76,
    comfortScore: model.vehicleSize === 'large' ? 84 : model.bodyType === 'SUV' ? 78 : 72,
    sportinessScore: model.segment?.toLowerCase().includes('sport') ? 88 : (model.maxPowerHp ?? 150) > 350 ? 80 : 58,
    familyScore: model.bodyType === 'SUV' || model.bodyType === 'WAGON' ? 84 : model.bodyType === 'COUPE' ? 38 : 68,
    buyingAdvice: 'Für die Demo als strukturierte Kaufhilfe hinterlegt; vor produktiver Nutzung durch lizenzierte Datenquellen/Redaktion ersetzen.',
  }
  await prisma.vehicleModelKnowledge.upsert({
    where: { modelId: model.id },
    create: { modelId: model.id, summary: k.summary, commonIssuesJson: k.commonIssues, maintenanceNotesJson: k.maintenanceNotes, ownerSentiment: k.ownerSentiment, reliabilityScore: k.reliabilityScore, comfortScore: k.comfortScore, sportinessScore: k.sportinessScore, familyScore: k.familyScore, buyingAdvice: k.buyingAdvice, sourcesJson: [{ label: 'CarMatch Demo-Wissen', url: 'DEMO', license: 'synthetische Demo-Zusammenfassung' }] },
    update: { summary: k.summary, commonIssuesJson: k.commonIssues, maintenanceNotesJson: k.maintenanceNotes, ownerSentiment: k.ownerSentiment, reliabilityScore: k.reliabilityScore, comfortScore: k.comfortScore, sportinessScore: k.sportinessScore, familyScore: k.familyScore, buyingAdvice: k.buyingAdvice },
  })
}
console.log('Modellwissen: Demo-Datensätze ergänzt')

const listings = await prisma.vehicleListing.findMany({ where: { provider: 'demo' } })
for (const listing of listings) {
  const model = await prisma.vehicleModel.findFirst({ where: { make: listing.make, model: { contains: listing.model.split(' ')[0], mode: 'insensitive' } } })
  const base = listing.price
  const now = new Date()
  for (let i = 12; i >= 0; i--) {
    const date = new Date(now)
    date.setMonth(now.getMonth() - i)
    const seasonal = listing.bodyType === 'CONVERTIBLE' ? (date.getMonth() >= 9 ? -0.06 : 0.04) : 0
    const trend = listing.fuelType === 'ELECTRIC' ? -0.012 * i : -0.006 * i
    const noise = ((i % 3) - 1) * 0.012
    const price = Math.round(base * (1 + trend + seasonal + noise))
    await prisma.vehiclePriceHistory.create({ data: { listingId: listing.id, modelId: model?.id, price, date, source: 'DEMO', mileage: listing.mileage ?? undefined, location: listing.city ?? undefined } })
  }
}
console.log('PriceHistory: künstliche Demo-Verläufe erzeugt')

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
