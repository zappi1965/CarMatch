import type { FuelType } from '@prisma/client'

export interface AdvisorListing {
  id: string
  make: string
  model: string
  variant?: string | null
  title?: string | null
  price: number
  year?: number | null
  mileage?: number | null
  powerHp?: number | null
  fuelType?: FuelType | null
  consumptionL100?: number | null
  co2GKm?: number | null
  bodyType?: string | null
  sellerType?: string | null
  qualityScore?: number | null
  previousOwners?: number | null
  accidentFree?: boolean | null
  fullServiceHistory?: boolean | null
  warranty?: boolean | null
  city?: string | null
}

export interface AdvisorModelKnowledge {
  summary?: string
  commonIssuesJson?: unknown
  maintenanceNotesJson?: unknown
  buyingAdvice?: string | null
  reliabilityScore?: number | null
}

const asStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []

const money = (value: number) => `${Math.round(value).toLocaleString('de-DE')} €`

const ageOf = (listing: AdvisorListing) => {
  const currentYear = new Date().getFullYear()
  return listing.year ? Math.max(0, currentYear - listing.year) : 7
}

const modelFamily = (listing: AdvisorListing) => `${listing.make} ${listing.model}`.toLowerCase()

export function buildHiddenCostAlerts(listing: AdvisorListing, knowledge?: AdvisorModelKnowledge | null) {
  const alerts: Array<{ severity: 'low' | 'medium' | 'high'; title: string; detail: string; estimatedCost?: string }> = []
  const family = modelFamily(listing)
  const age = ageOf(listing)
  const mileage = listing.mileage ?? 90000

  if ((listing.powerHp ?? 0) >= 450) {
    alerts.push({ severity: 'high', title: 'Performance-Unterhalt', detail: 'Reifen, Bremsen und Versicherung sind bei sehr leistungsstarken Modellen meist deutlich teurer.', estimatedCost: '300–1.500 € je Ereignis' })
  }
  if (family.includes('panamera') || family.includes('range rover') || family.includes('s-klasse') || family.includes('a8')) {
    alerts.push({ severity: 'high', title: 'Luxusklasse-Komponenten', detail: 'Luftfahrwerk, adaptive Dämpfer, Komfortelektronik und große Bremsanlagen können hohe Einzelkosten verursachen.', estimatedCost: '800–4.000 €' })
  }
  if (listing.fuelType === 'PLUGIN_HYBRID' || listing.fuelType === 'HYBRID') {
    alerts.push({ severity: 'medium', title: 'Hybrid-System prüfen', detail: 'Akkuzustand, Ladehistorie und Hochvolt-Komponenten sollten vor Kauf nachvollziehbar geprüft werden.', estimatedCost: 'Diagnose vor Kauf sinnvoll' })
  }
  if (listing.fuelType === 'ELECTRIC') {
    alerts.push({ severity: 'medium', title: 'Batterie & Ladeleistung', detail: 'Bei E-Autos sind Degradation, Ladeleistung und Garantiebedingungen entscheidend für den Restwert.', estimatedCost: 'Batterieprotokoll verlangen' })
  }
  if (mileage > 130000) {
    alerts.push({ severity: 'medium', title: 'Hohe Laufleistung', detail: 'Fahrwerk, Bremsen, Getriebeöl, Turbo/DPF und Lager sollten bei dieser Laufleistung besonders geprüft werden.' })
  }
  if (age >= 9) {
    alerts.push({ severity: 'medium', title: 'Alterungsrisiko', detail: 'Gummilager, Dichtungen, Elektronik und Korrosion werden mit dem Alter wichtiger als reine Kilometer.' })
  }
  if (listing.fullServiceHistory === false) {
    alerts.push({ severity: 'high', title: 'Servicehistorie unvollständig', detail: 'Fehlende Nachweise senken den Wiederverkaufswert und erschweren die technische Einschätzung.' })
  }
  if (knowledge) {
    for (const issue of asStrings(knowledge.commonIssuesJson).slice(0, 3)) {
      alerts.push({ severity: 'medium', title: 'Modelltypische Schwachstelle', detail: issue })
    }
  }
  return alerts.slice(0, 8)
}

export function buildInspectionChecklist(listing: AdvisorListing, knowledge?: AdvisorModelKnowledge | null) {
  const generic = [
    'Fahrzeug kalt starten und auf Geräusche, Rauch und Warnlampen achten.',
    'Servicehistorie, Rechnungen, HU-Bericht und Vorbesitzer nachvollziehen.',
    'Reifenalter, Profiltiefe, Bremsen und ungleichmäßigen Verschleiß prüfen.',
    'Probefahrt: Geradeauslauf, Bremsen, Getriebe, Fahrwerk, Lenkung und Geräusche testen.',
    'Innenraum: Klima, Infotainment, Assistenzsysteme, Sitzverstellung und alle Fenster testen.',
    'Lack, Spaltmaße, Nachlackierungen und Unterboden auf Unfall-/Korrosionshinweise prüfen.',
  ]
  const fuelSpecific: Record<string, string[]> = {
    DIESEL: ['Kaltstart, DPF-Regeneration, AGR/AdBlue-Hinweise und Kurzstreckenprofil prüfen.'],
    PETROL: ['Ölverbrauch, Zündaussetzer, Kaltlauf und mögliche Tuninghistorie prüfen.'],
    ELECTRIC: ['Akkuzustand/SoH, Ladeleistung, Ladekabel, Garantie und reale Winterreichweite prüfen.'],
    HYBRID: ['Hybrid-Batterie, Rekuperation, Lade-/Startverhalten und Hochvolt-Wartung prüfen.'],
    PLUGIN_HYBRID: ['Ladehistorie, elektrische Reichweite, Hochvolt-Garantie und Ladebuchse prüfen.'],
  }
  const modelItems = [
    ...asStrings(knowledge?.commonIssuesJson).map((x) => `Modellspezifisch prüfen: ${x}`),
    ...asStrings(knowledge?.maintenanceNotesJson).map((x) => `Wartung: ${x}`),
  ]
  const sellerQuestions = [
    'Warum wird das Fahrzeug verkauft?',
    'Gab es Unfallschäden, Nachlackierungen oder größere Reparaturen?',
    'Sind alle Schlüssel, CoC, Bedienungsanleitungen und Rechnungen vorhanden?',
    'Ist eine Gebrauchtwagengarantie möglich oder bereits enthalten?',
  ]
  return {
    title: `Besichtigung für ${listing.make} ${listing.model}`,
    mustCheck: [...generic, ...(fuelSpecific[String(listing.fuelType ?? '')] ?? []), ...modelItems].slice(0, 12),
    sellerQuestions,
    testDriveFocus: ['Kaltstart', 'Lenkung', 'Bremsen', 'Getriebe', 'Fahrwerk', 'Geräusche', 'Elektronik', 'Assistenzsysteme'],
  }
}

export function buildNegotiationAdvice(listing: AdvisorListing, marketAverage?: number | null) {
  const base = listing.price
  const avg = marketAverage ?? Math.round(base * (listing.qualityScore && listing.qualityScore > 0.75 ? 1.03 : 0.98))
  const deltaPercent = Math.round(((base - avg) / Math.max(avg, 1)) * 100)
  const age = ageOf(listing)
  const reasons: string[] = []
  if (deltaPercent > 4) reasons.push(`Inserat liegt ca. ${deltaPercent} % über vergleichbarem Demo-Markt.`)
  if ((listing.mileage ?? 0) > 100000) reasons.push('Laufleistung ist ein realistischer Verhandlungshebel.')
  if (listing.warranty === false) reasons.push('Keine Garantie ausgewiesen – Risiko im Preis berücksichtigen.')
  if (listing.fullServiceHistory === false) reasons.push('Servicehistorie ist nicht vollständig ausgewiesen.')
  if (age >= 8) reasons.push('Alter erhöht Verschleiß-/Elektronikrisiko.')
  if (reasons.length === 0) reasons.push('Preis wirkt plausibel; eher über Zustand, Zubehör und Garantie verhandeln.')

  const target = Math.max(Math.round(base * 0.9 / 100) * 100, Math.round((base - Math.max(800, base * 0.045)) / 100) * 100)
  const opening = Math.round(Math.min(target * 0.97, base * 0.9) / 100) * 100
  return {
    marketAverage: avg,
    deltaPercent,
    openingOffer: opening,
    targetPrice: target,
    walkAwayPrice: Math.round(base * 0.98 / 100) * 100,
    script: `Ich finde das Auto spannend. Wegen ${(reasons[0] ?? 'dem Gesamtzustand').toLowerCase()} würde ich realistisch bei ${money(opening)} starten und bei gutem Zustand Richtung ${money(target)} gehen.`,
    arguments: reasons,
  }
}

export function buildWhyCheap(listing: AdvisorListing, marketAverage?: number | null) {
  const avg = marketAverage ?? listing.price
  const reasons: string[] = []
  if (listing.price < avg * 0.92) reasons.push('Preis liegt deutlich unter Demo-Markt. Ursachen unbedingt prüfen.')
  if ((listing.mileage ?? 0) > 120000) reasons.push('Hohe Laufleistung kann den Preis erklären.')
  if (listing.accidentFree === false) reasons.push('Unfallfreiheit ist verneint oder unklar.')
  if (listing.fullServiceHistory === false) reasons.push('Unvollständige Servicehistorie reduziert Marktwert.')
  if ((listing.qualityScore ?? 1) < 0.55) reasons.push('Inserat enthält vergleichsweise wenige Angaben.')
  if (!listing.warranty && listing.sellerType === 'PRIVATE') reasons.push('Privatverkauf ohne Händlergewährleistung kann günstiger wirken.')
  if (reasons.length === 0) reasons.push('Kein offensichtlicher Grund. Zustand und Historie prüfen, bevor der Preis als Deal zählt.')
  return reasons
}

export function buildDealerTrust(listing: AdvisorListing) {
  const score = Math.max(35, Math.min(92,
    52 +
    ((listing.sellerType === 'DEALER') ? 12 : -4) +
    ((listing.warranty) ? 8 : 0) +
    ((listing.fullServiceHistory) ? 8 : -5) +
    Math.round((listing.qualityScore ?? 0.5) * 20) +
    ((listing.accidentFree) ? 5 : 0),
  ))
  return {
    score,
    verdict: score >= 75 ? 'stark' : score >= 58 ? 'mittel' : 'wenig Daten',
    signals: [
      listing.sellerType === 'DEALER' ? 'Händlerangebot' : 'Privatangebot',
      listing.warranty ? 'Garantie ausgewiesen' : 'Keine Garantie ausgewiesen',
      listing.fullServiceHistory ? 'Servicehistorie ausgewiesen' : 'Servicehistorie unklar',
      listing.accidentFree ? 'Unfallfreiheit ausgewiesen' : 'Unfallfreiheit unklar',
    ],
  }
}

export function buildFinancingSimulation(input: { price: number; downPayment?: number; months?: number; annualRate?: number; residualValue?: number }) {
  const downPayment = input.downPayment ?? Math.round(input.price * 0.15)
  const months = input.months ?? 48
  const annualRate = input.annualRate ?? 6.49
  const residual = input.residualValue ?? 0
  const principal = Math.max(0, input.price - downPayment - residual)
  const monthlyRate = annualRate / 100 / 12
  const annuity = monthlyRate === 0 ? principal / months : principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  return {
    price: input.price,
    downPayment,
    months,
    annualRate,
    residualValue: residual,
    estimatedMonthlyPayment: Math.round(annuity + residual * monthlyRate),
    totalCreditCost: Math.round((annuity * months + residual + downPayment) - input.price),
    note: 'Demo-Simulation ohne Kreditangebot, Bonitätsprüfung oder Vermittlung.',
  }
}

export function compareListings(listings: AdvisorListing[]) {
  const enriched = listings.map((l) => ({
    id: l.id,
    title: `${l.make} ${l.model}${l.variant ? ` ${l.variant}` : ''}`,
    price: l.price,
    powerHp: l.powerHp ?? 0,
    mileage: l.mileage ?? 0,
    year: l.year ?? 0,
    monthlyCostProxy: Math.round(l.price * 0.009 + (l.powerHp ?? 150) * 0.5 + ((l.consumptionL100 ?? 7) * 28)),
    rationalScore: 0,
    emotionScore: 0,
  }))
  const maxPrice = Math.max(...enriched.map((e) => e.price), 1)
  const maxPower = Math.max(...enriched.map((e) => e.powerHp), 1)
  const minMileage = Math.min(...enriched.map((e) => e.mileage), 0)
  for (const e of enriched) {
    e.rationalScore = Math.round((100 - (e.price / maxPrice) * 35 - (e.monthlyCostProxy / 1400) * 35 + (e.year ? 12 : 0) + (minMileage / Math.max(e.mileage, 1)) * 15))
    e.emotionScore = Math.round((e.powerHp / maxPower) * 70 + (e.price > 80000 ? 10 : 0) + (e.title.match(/911|M5|AMG|RS|Porsche|Mustang/i) ? 20 : 8))
  }
  const rationalWinner = [...enriched].sort((a, b) => b.rationalScore - a.rationalScore)[0]
  const emotionalWinner = [...enriched].sort((a, b) => b.emotionScore - a.emotionScore)[0]
  const compromise = [...enriched].sort((a, b) => (b.rationalScore + b.emotionScore) - (a.rationalScore + a.emotionScore))[0]
  return { cars: enriched, rationalWinner, emotionalWinner, compromise }
}

export function buildDreamAlternatives(input: { dreamMake?: string; dreamModel: string; monthlyBudgetEur: number }) {
  const dream = `${input.dreamMake ?? ''} ${input.dreamModel}`.toLowerCase()
  const pool = [
    { title: 'Audi A7 Sportback', reason: 'ähnliche GT-/Premium-Wirkung wie Panamera, oft günstiger im Monat', estimatedMonthlyCost: 520 },
    { title: 'BMW 540i Touring', reason: 'Reihensechszylinder, Alltag und Langstrecke als vernünftiger Performance-Kompromiss', estimatedMonthlyCost: 560 },
    { title: 'Mercedes-Benz CLS', reason: 'luxuriöser Auftritt und Komfort, meist unter Porsche-Niveau', estimatedMonthlyCost: 530 },
    { title: 'Porsche 718 Cayman', reason: 'Porsche-Emotion mit niedrigerem Einstieg als 911', estimatedMonthlyCost: 650 },
    { title: 'BMW M440i Coupé', reason: 'sportliches Coupé, schneller als die meisten Alltagsautos und deutlich günstiger als M/AMG-Topmodelle', estimatedMonthlyCost: 540 },
    { title: 'Tesla Model 3 Performance', reason: 'starke Beschleunigung mit niedrigen Energiekosten', estimatedMonthlyCost: 430 },
  ]
  const target = dream.includes('911') ? ['Porsche 718 Cayman', 'BMW M440i Coupé', 'Tesla Model 3 Performance'] : pool.map((p) => p.title)
  return pool
    .filter((p) => target.includes(p.title))
    .map((p) => ({ ...p, budgetFit: p.estimatedMonthlyCost <= input.monthlyBudgetEur ? 'in_budget' : p.estimatedMonthlyCost <= input.monthlyBudgetEur + 180 ? 'stretch' : 'dream_later' }))
}

export function buildPartnerCompromise(signals: Array<{ signalType: string; listingId: string; userId: string }>) {
  const grouped = new Map<string, { likes: Set<string>; dislikes: Set<string>; vetoes: Set<string> }>()
  for (const signal of signals) {
    const g = grouped.get(signal.listingId) ?? { likes: new Set<string>(), dislikes: new Set<string>(), vetoes: new Set<string>() }
    if (signal.signalType === 'like' || signal.signalType === 'duel_win') g.likes.add(signal.userId)
    if (signal.signalType === 'dislike' || signal.signalType === 'duel_loss') g.dislikes.add(signal.userId)
    if (signal.signalType === 'veto') g.vetoes.add(signal.userId)
    grouped.set(signal.listingId, g)
  }
  return [...grouped.entries()].map(([listingId, g]) => ({
    listingId,
    compromiseScore: g.vetoes.size > 0 ? 0 : Math.max(0, 50 + g.likes.size * 25 - g.dislikes.size * 15),
    label: g.vetoes.size > 0 ? 'Veto gesetzt' : g.likes.size >= 2 ? 'Ihr beide mögt dieses Auto' : g.likes.size === 1 && g.dislikes.size === 0 ? 'Eine Person mag es' : 'Uneinig',
    likes: g.likes.size,
    dislikes: g.dislikes.size,
    vetoes: g.vetoes.size,
  })).sort((a, b) => b.compromiseScore - a.compromiseScore)
}

export function buildServicePlan(owned: { make: string; model: string; year?: number | null; currentMileage?: number | null; purchasePrice?: number | null; tuvDate?: Date | string | null }) {
  const km = owned.currentMileage ?? 80000
  const now = new Date()
  const tuv = owned.tuvDate ? new Date(owned.tuvDate) : null
  const monthsToTuv = tuv ? Math.round((tuv.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)) : null
  return {
    currentMarketValue: Math.round((owned.purchasePrice ?? 25000) * Math.max(0.42, 1 - ageFromYear(owned.year) * 0.055 - Math.max(0, km - 80000) / 1000000)),
    reminders: [
      monthsToTuv != null ? `HU/TÜV in ca. ${monthsToTuv} Monaten` : 'HU/TÜV-Datum ergänzen',
      km % 30000 > 22000 ? 'Ölservice bald einplanen' : 'Nächster Ölservice im normalen Intervall',
      'Reifenprofil und Bremsen halbjährlich prüfen',
      'Versicherung jährlich neu vergleichen',
    ],
    sellSignal: km > 140000 ? 'Verkaufswert prüfen: Laufleistung nähert sich preissensibler Zone.' : 'Halten sinnvoll: kein akuter Verkaufsdruck aus Demo-Daten.',
  }
}

function ageFromYear(year?: number | null) {
  return year ? Math.max(0, new Date().getFullYear() - year) : 6
}
