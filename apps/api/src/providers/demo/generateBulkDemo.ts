import type { BodyType, Drivetrain, FuelType, NormalizedListing, Transmission } from '@carmatch/shared'
import { vehicleModelSeeds } from '../../models/vehicleModelSeed.js'
import { findModelImage } from '../../models/modelImages.js'

/**
 * DEMO-GENERATOR — erzeugt aus den vorhandenen echten Modelldaten (Baureihen,
 * Leistungs-/Preisspannen, Wikimedia-Fotos) hunderte plausible, klar als DEMO
 * gekennzeichnete Fahrzeuginserate. Rechtlich sauber: KEINE fremden Inserate,
 * kein Scraping — rein synthetische Varianten für Test/Last/Algorithmus.
 *
 * Deterministisch (seedbarer RNG), damit Re-Seeds reproduzierbar sind.
 */

// Realistische Standorte in ganz Deutschland (Stadt + Koordinaten + PLZ-Präfix)
const CITIES: Array<{ city: string; lat: number; lon: number; plz: string }> = [
  { city: 'Rostock', lat: 54.0924, lon: 12.1407, plz: '18055' },
  { city: 'Schwerin', lat: 53.6355, lon: 11.4012, plz: '19053' },
  { city: 'Hamburg', lat: 53.5511, lon: 9.9937, plz: '20095' },
  { city: 'Lübeck', lat: 53.8655, lon: 10.6866, plz: '23552' },
  { city: 'Kiel', lat: 54.3233, lon: 10.1228, plz: '24103' },
  { city: 'Bremen', lat: 53.0793, lon: 8.8017, plz: '28195' },
  { city: 'Hannover', lat: 52.3759, lon: 9.732, plz: '30159' },
  { city: 'Berlin', lat: 52.52, lon: 13.405, plz: '10115' },
  { city: 'Leipzig', lat: 51.3397, lon: 12.3731, plz: '04109' },
  { city: 'Dresden', lat: 51.0504, lon: 13.7373, plz: '01067' },
  { city: 'Köln', lat: 50.9375, lon: 6.9603, plz: '50667' },
  { city: 'Düsseldorf', lat: 51.2277, lon: 6.7735, plz: '40213' },
  { city: 'Frankfurt', lat: 50.1109, lon: 8.6821, plz: '60311' },
  { city: 'Stuttgart', lat: 48.7758, lon: 9.1829, plz: '70173' },
  { city: 'München', lat: 48.1351, lon: 11.582, plz: '80331' },
  { city: 'Nürnberg', lat: 49.4521, lon: 11.0767, plz: '90402' },
  { city: 'Neubrandenburg', lat: 53.5575, lon: 13.261, plz: '17033' },
  { city: 'Stralsund', lat: 54.3091, lon: 13.0818, plz: '18435' },
  { city: 'Wismar', lat: 53.8914, lon: 11.4525, plz: '23966' },
  { city: 'Greifswald', lat: 54.0865, lon: 13.3923, plz: '17489' },
]

const COLORS = [
  'Schwarz', 'Weiß', 'Silber', 'Grau', 'Dunkelblau', 'Rot', 'Anthrazit',
  'Dunkelgrün', 'Beige', 'Braun', 'Blau Metallic', 'Weiß Perleffekt',
]
const DEALER_NAMES = [
  'Autohaus Nord', 'Premium Cars', 'CarCenter', 'Auto Galerie', 'Motorwelt',
  'Fahrzeughandel Meyer', 'AutoPark', 'Sportwagenzentrum', 'Gebrauchtwagen Profi',
]

/** Mulberry32 — kleiner, deterministischer RNG (seedbar). */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T>(rng: () => number, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]!
const randInt = (rng: () => number, min: number, max: number) =>
  Math.floor(rng() * (max - min + 1)) + min
const jitter = (rng: () => number, spread: number) => 1 + (rng() * 2 - 1) * spread

/**
 * Erzeugt `count` synthetische Demo-Inserate, gleichmäßig über die Modelle verteilt.
 * @param count Zielanzahl (z. B. 800)
 * @param seed  RNG-Seed für Reproduzierbarkeit
 */
export function generateBulkDemoListings(count: number, seed = 1337): NormalizedListing[] {
  const rng = makeRng(seed)
  const out: NormalizedListing[] = []
  const currentYear = new Date().getFullYear()

  for (let i = 0; i < count; i++) {
    const model = vehicleModelSeeds[i % vehicleModelSeeds.length]!
    const loc = pick(rng, CITIES)
    const wiki = findModelImage(model.make, model.model, model.variant)

    // Baujahr innerhalb der Produktionsspanne (bis heute)
    const startY = model.productionStartYear ?? currentYear - 8
    const endY = Math.min(currentYear, model.productionEndYear ?? currentYear)
    const year = randInt(rng, startY, Math.max(startY, endY))
    const age = Math.max(0, currentYear - year)

    // Kilometerstand: ~14.000 km/Jahr ± Streuung, min 500
    const mileage = Math.max(500, Math.round((age * 14000 + randInt(rng, -8000, 12000)) / 100) * 100)

    // Leistung aus der Modell-Spanne
    const powerHp = randInt(rng, model.minPowerHp, model.maxPowerHp)
    const powerKw = Math.round(powerHp / 1.35962)

    // Preis: aus typischer Gebrauchtpreis-Spanne, mit Alters-/km-Wertverlust
    const basePrice = randInt(rng, model.typicalUsedPriceMin, model.typicalUsedPriceMax)
    const wear = Math.max(0.45, 1 - age * 0.045 - (mileage / 1_000_000) * 0.6)
    const price = Math.max(2500, Math.round((basePrice * wear * jitter(rng, 0.05)) / 100) * 100)

    const fuelType = pick(rng, model.fuelTypes) as FuelType
    const transmission = pick(rng, model.transmissionTypes) as Transmission
    const isDealer = rng() > 0.35
    const previousOwners = randInt(rng, 1, Math.min(4, 1 + Math.floor(age / 3)))

    const consumption =
      fuelType === 'ELECTRIC' ? 0 : Math.round((model.specs?.consumptionL100 ?? 6.5) * jitter(rng, 0.08) * 10) / 10

    out.push({
      provider: 'demo',
      providerListingId: `demo-gen-${seed}-${i}`,
      make: model.make,
      model: model.model,
      variant: model.variant,
      title: [model.make, model.model, model.variant].filter(Boolean).join(' '),
      description: `${model.segment ?? ''} — synthetisches Demo-Inserat`.trim(),
      price,
      currency: 'EUR',
      year,
      firstRegistration: `${year}-${String(randInt(rng, 1, 12)).padStart(2, '0')}`,
      mileage,
      powerKw,
      powerHp,
      fuelType,
      transmission,
      drivetrain: (model.drivetrain ?? undefined) as Drivetrain | undefined,
      bodyType: model.bodyType as BodyType,
      doors: model.doors,
      seats: model.seats,
      color: pick(rng, COLORS),
      consumptionL100: consumption,
      previousOwners,
      accidentFree: rng() > 0.12 ? true : null,
      inspectionValidUntil: `${currentYear + randInt(rng, 0, 2)}-${String(randInt(rng, 1, 12)).padStart(2, '0')}`,
      fullServiceHistory: rng() > 0.3,
      warranty: isDealer && rng() > 0.4,
      financingAvailable: isDealer,
      images: wiki ? [wiki.imageUrl] : [],
      imagesAreDemo: !wiki,
      imageAttribution: wiki?.attribution,
      sellerType: isDealer ? 'DEALER' : 'PRIVATE',
      dealerName: isDealer ? `${pick(rng, DEALER_NAMES)} ${loc.city}` : undefined,
      latitude: loc.lat + (rng() * 2 - 1) * 0.05,
      longitude: loc.lon + (rng() * 2 - 1) * 0.05,
      postalCode: loc.plz,
      city: loc.city,
      country: 'DE',
      isAvailable: true,
    })
  }
  return out
}
