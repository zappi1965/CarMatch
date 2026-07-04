/**
 * DEMO-Seed für den Inspirationsmodus: generelle Fahrzeugmodelle/Baureihen.
 * Werte sind grobe, öffentlich bekannte Richtwerte (Leistungs-/Preisspannen),
 * KEINE offiziellen Herstellerangaben — source: "DEMO", sourceConfidence 0.5,
 * Bilder sind Platzhalter (imagesAreDemo). Für Produktion wird ein
 * lizenzierter Fahrzeugdaten-Provider angebunden (Enrichment-Schicht).
 */

export interface VehicleModelSeed {
  make: string
  model: string
  generation?: string
  variant?: string
  productionStartYear?: number
  productionEndYear?: number
  bodyType: string
  vehicleSize: 'small' | 'compact' | 'midsize' | 'large'
  segment: string
  doors?: number
  seats?: number
  drivetrain?: string
  fuelTypes: string[]
  transmissionTypes: string[]
  minPowerHp: number
  maxPowerHp: number
  typicalUsedPriceMin: number
  typicalUsedPriceMax: number
  description: string
  strengths: string[]
  weaknesses: string[]
  tags: string[]
  specs?: { zeroToHundred?: number; topSpeed?: number; weightKg?: number; trunkVolumeL?: number; consumptionL100?: number; electricRangeKm?: number }
}

const img = (label: string) => [
  `https://placehold.co/900x560/17181c/f4f2ee/png?text=${encodeURIComponent(label)}`,
]

export const vehicleModelSeeds: (VehicleModelSeed & { imageUrls: string[] })[] = [
  {
    make: 'Porsche', model: 'Panamera', generation: '971', productionStartYear: 2016,
    bodyType: 'SEDAN', vehicleSize: 'large', segment: 'Sportlimousine', doors: 5, seats: 4,
    drivetrain: 'AWD', fuelTypes: ['PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 330, maxPowerHp: 700, typicalUsedPriceMin: 55000, typicalUsedPriceMax: 140000,
    description: 'Luxus-Sportlimousine mit GT-Charakter — Langstrecke und Performance in einem.',
    strengths: ['Fahrdynamik trotz Größe', 'hochwertiges Interieur', 'starke Hybrid-Varianten'],
    weaknesses: ['hohe Unterhaltskosten', 'teure Optionen', 'Wertverlust bei frühen Baujahren'],
    tags: ['performance', 'luxury', 'longDistance'], imageUrls: img('Porsche Panamera'),
    specs: { zeroToHundred: 4.0, topSpeed: 290, weightKg: 2100, trunkVolumeL: 495 },
  },
  {
    make: 'Porsche', model: '911', generation: '992', productionStartYear: 2019,
    bodyType: 'COUPE', vehicleSize: 'midsize', segment: 'Sportwagen', doors: 2, seats: 4,
    drivetrain: 'RWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC', 'MANUAL'],
    minPowerHp: 385, maxPowerHp: 650, typicalUsedPriceMin: 95000, typicalUsedPriceMax: 220000,
    description: 'Die Sportwagen-Ikone — alltagstauglich und wertstabil.',
    strengths: ['Wertstabilität', 'Alltagstauglichkeit für einen Sportwagen', 'Präzision'],
    weaknesses: ['hoher Einstiegspreis', 'Rückbank nur symbolisch'],
    tags: ['performance', 'icon'], imageUrls: img('Porsche 911'),
    specs: { zeroToHundred: 3.7, topSpeed: 293, weightKg: 1505, trunkVolumeL: 132 },
  },
  {
    make: 'Porsche', model: '718 Cayman', productionStartYear: 2016,
    bodyType: 'COUPE', vehicleSize: 'compact', segment: 'Sportwagen', doors: 2, seats: 2,
    drivetrain: 'RWD', fuelTypes: ['PETROL'], transmissionTypes: ['MANUAL', 'AUTOMATIC'],
    minPowerHp: 300, maxPowerHp: 420, typicalUsedPriceMin: 48000, typicalUsedPriceMax: 95000,
    description: 'Mittelmotor-Sportwagen mit Fokus auf Fahrgefühl statt Show.',
    strengths: ['Balance und Lenkung', 'zwei Kofferräume', 'vergleichsweise effizient'],
    weaknesses: ['nur 2 Sitze', 'Vierzylinder-Sound der Basismodelle'],
    tags: ['performance', 'purist'], imageUrls: img('Porsche 718 Cayman'),
    specs: { zeroToHundred: 4.9, topSpeed: 275, weightKg: 1405 },
  },
  {
    make: 'BMW', model: 'M340i', variant: 'Touring', generation: 'G21', productionStartYear: 2019,
    bodyType: 'WAGON', vehicleSize: 'midsize', segment: 'Power-Kombi', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 374, maxPowerHp: 374, typicalUsedPriceMin: 42000, typicalUsedPriceMax: 65000,
    description: 'Der Alltags-Sportler: Reihensechszylinder, Allrad, voller Familiennutzen.',
    strengths: ['Motor und Klang', 'Alltag + Performance', 'AHK möglich'],
    weaknesses: ['kein echtes M-Fahrwerk', 'Aufpreispolitik'],
    tags: ['performance', 'family', 'alltag'], imageUrls: img('BMW M340i Touring'),
    specs: { zeroToHundred: 4.5, topSpeed: 250, weightKg: 1885, trunkVolumeL: 500 },
  },
  {
    make: 'BMW', model: 'M5', generation: 'F90', productionStartYear: 2017, productionEndYear: 2023,
    bodyType: 'SEDAN', vehicleSize: 'large', segment: 'Super-Limousine', doors: 4, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 600, maxPowerHp: 635, typicalUsedPriceMin: 60000, typicalUsedPriceMax: 110000,
    description: 'V8-Business-Jet: brutale Leistung im Anzug.',
    strengths: ['Leistung', 'Langstreckenkomfort', 'Allrad mit Drift-Modus'],
    weaknesses: ['Verbrauch', 'Unterhalt', 'Gewicht'],
    tags: ['performance', 'luxury'], imageUrls: img('BMW M5'),
    specs: { zeroToHundred: 3.4, topSpeed: 305, weightKg: 1970 },
  },
  {
    make: 'BMW', model: 'X5', generation: 'G05', productionStartYear: 2018,
    bodyType: 'SUV', vehicleSize: 'large', segment: 'Premium-SUV', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['DIESEL', 'PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 265, maxPowerHp: 530, typicalUsedPriceMin: 45000, typicalUsedPriceMax: 95000,
    description: 'Souveränes Premium-SUV für Familie, Zugbetrieb und Langstrecke.',
    strengths: ['Komfort', 'Anhängelast', 'starke Diesel'],
    weaknesses: ['Größe in der Stadt', 'Unterhalt'],
    tags: ['family', 'longDistance', 'suv'], imageUrls: img('BMW X5'),
    specs: { zeroToHundred: 5.5, topSpeed: 243, weightKg: 2185, trunkVolumeL: 650 },
  },
  {
    make: 'Audi', model: 'RS5', generation: 'B9', productionStartYear: 2017,
    bodyType: 'COUPE', vehicleSize: 'midsize', segment: 'Sport-Coupé', doors: 2, seats: 4,
    drivetrain: 'AWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 450, maxPowerHp: 450, typicalUsedPriceMin: 48000, typicalUsedPriceMax: 80000,
    description: 'Allwetter-Sportcoupé mit Biturbo-V6 und quattro-Traktion.',
    strengths: ['Traktion bei jedem Wetter', 'Verarbeitung', 'alltagstauglich'],
    weaknesses: ['weniger emotional als Konkurrenz', 'indirekte Lenkung'],
    tags: ['performance'], imageUrls: img('Audi RS5'),
    specs: { zeroToHundred: 3.9, topSpeed: 280, weightKg: 1655 },
  },
  {
    make: 'Audi', model: 'RS6', variant: 'Avant', generation: 'C8', productionStartYear: 2019,
    bodyType: 'WAGON', vehicleSize: 'large', segment: 'Power-Kombi', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 600, maxPowerHp: 630, typicalUsedPriceMin: 85000, typicalUsedPriceMax: 140000,
    description: 'Der Über-Kombi: 600 PS, Familie, Hund und 305 km/h.',
    strengths: ['Performance + Nutzwert', 'Auftritt', 'quattro'],
    weaknesses: ['Preis', 'Verbrauch', 'Reifenkosten'],
    tags: ['performance', 'family'], imageUrls: img('Audi RS6 Avant'),
    specs: { zeroToHundred: 3.6, topSpeed: 305, weightKg: 2075, trunkVolumeL: 565 },
  },
  {
    make: 'Audi', model: 'A6', variant: 'Avant', generation: 'C8', productionStartYear: 2018,
    bodyType: 'WAGON', vehicleSize: 'large', segment: 'Business-Kombi', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['DIESEL', 'PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 204, maxPowerHp: 340, typicalUsedPriceMin: 32000, typicalUsedPriceMax: 60000,
    description: 'Souveräner Business-Kombi: leise, geräumig, effiziente Diesel.',
    strengths: ['Langstreckenkomfort', 'Kofferraum', 'Verarbeitung'],
    weaknesses: ['nüchtern', 'Aufpreisliste'],
    tags: ['alltag', 'longDistance', 'family'], imageUrls: img('Audi A6 Avant'),
    specs: { zeroToHundred: 6.8, topSpeed: 250, weightKg: 1855, trunkVolumeL: 565 },
  },
  {
    make: 'Mercedes-AMG', model: 'C63', generation: 'W205', productionStartYear: 2015, productionEndYear: 2021,
    bodyType: 'SEDAN', vehicleSize: 'midsize', segment: 'Sportlimousine', doors: 4, seats: 5,
    drivetrain: 'RWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 476, maxPowerHp: 510, typicalUsedPriceMin: 45000, typicalUsedPriceMax: 85000,
    description: 'V8-Charakterdarsteller mit Hinterradantrieb — laut, emotional, klassisch.',
    strengths: ['V8-Sound', 'Emotion', 'letzter seiner Art'],
    weaknesses: ['Traktion bei Nässe', 'Verbrauch'],
    tags: ['performance', 'emotion'], imageUrls: img('Mercedes-AMG C63'),
    specs: { zeroToHundred: 4.0, topSpeed: 290, weightKg: 1745 },
  },
  {
    make: 'Mercedes-Benz', model: 'E-Klasse', variant: 'T-Modell', generation: 'S213',
    productionStartYear: 2016, productionEndYear: 2023,
    bodyType: 'WAGON', vehicleSize: 'large', segment: 'Business-Kombi', doors: 5, seats: 5,
    drivetrain: 'RWD', fuelTypes: ['DIESEL', 'PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 194, maxPowerHp: 435, typicalUsedPriceMin: 28000, typicalUsedPriceMax: 60000,
    description: 'Der Langstrecken-Klassiker mit riesigem Kofferraum und Komfort-Fokus.',
    strengths: ['Komfort', 'Kofferraum bis 1820 l', 'zuverlässige Diesel'],
    weaknesses: ['konservativ', 'hohes Gewicht'],
    tags: ['alltag', 'family', 'longDistance'], imageUrls: img('Mercedes E-Klasse T-Modell'),
    specs: { zeroToHundred: 7.3, topSpeed: 240, weightKg: 1845, trunkVolumeL: 640 },
  },
  {
    make: 'Mercedes-Benz', model: 'GLC', generation: 'X253', productionStartYear: 2015, productionEndYear: 2022,
    bodyType: 'SUV', vehicleSize: 'midsize', segment: 'Premium-SUV', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['DIESEL', 'PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 163, maxPowerHp: 510, typicalUsedPriceMin: 28000, typicalUsedPriceMax: 65000,
    description: 'Kompaktes Premium-SUV — komfortabel, familientauglich, wertstabil.',
    strengths: ['Komfort', 'Übersichtlichkeit', 'Hybrid-Auswahl'],
    weaknesses: ['Basismotoren zäh', 'Aufpreise'],
    tags: ['family', 'suv', 'alltag'], imageUrls: img('Mercedes GLC'),
    specs: { zeroToHundred: 7.9, topSpeed: 222, weightKg: 1845, trunkVolumeL: 550 },
  },
  {
    make: 'Tesla', model: 'Model 3', variant: 'Performance', productionStartYear: 2019,
    bodyType: 'SEDAN', vehicleSize: 'midsize', segment: 'Elektro-Sportlimousine', doors: 4, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['ELECTRIC'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 480, maxPowerHp: 510, typicalUsedPriceMin: 32000, typicalUsedPriceMax: 48000,
    description: 'Elektrische Sportlimousine: brutale Beschleunigung, niedrige Betriebskosten.',
    strengths: ['Beschleunigung', 'Ladenetz', 'Betriebskosten'],
    weaknesses: ['Verarbeitung schwankt', 'straffes Fahrwerk'],
    tags: ['performance', 'electric', 'tech'], imageUrls: img('Tesla Model 3 Performance'),
    specs: { zeroToHundred: 3.3, topSpeed: 261, weightKg: 1844, electricRangeKm: 547 },
  },
  {
    make: 'Tesla', model: 'Model Y', productionStartYear: 2021,
    bodyType: 'SUV', vehicleSize: 'midsize', segment: 'Elektro-SUV', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['ELECTRIC'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 299, maxPowerHp: 514, typicalUsedPriceMin: 30000, typicalUsedPriceMax: 50000,
    description: 'Praktisches Elektro-SUV mit viel Platz und starkem Ladenetz.',
    strengths: ['Platzangebot', 'Effizienz', 'Software'],
    weaknesses: ['Federungskomfort', 'Verarbeitungsstreuung'],
    tags: ['family', 'electric', 'suv'], imageUrls: img('Tesla Model Y'),
    specs: { zeroToHundred: 5.0, topSpeed: 217, weightKg: 2003, trunkVolumeL: 854, electricRangeKm: 533 },
  },
  {
    make: 'Cupra', model: 'Formentor', productionStartYear: 2020,
    bodyType: 'SUV', vehicleSize: 'compact', segment: 'Sport-Crossover', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC', 'MANUAL'],
    minPowerHp: 150, maxPowerHp: 390, typicalUsedPriceMin: 25000, typicalUsedPriceMax: 48000,
    description: 'Sportlicher Crossover mit eigenständigem Design und VZ-Topmodellen.',
    strengths: ['Design', 'Preis-Leistung', 'VZ-Performance'],
    weaknesses: ['Infotainment-Bedienung', 'Markenimage jung'],
    tags: ['performance', 'suv', 'design'], imageUrls: img('Cupra Formentor'),
    specs: { zeroToHundred: 4.9, topSpeed: 250, weightKg: 1644, trunkVolumeL: 420 },
  },
  {
    make: 'Volkswagen', model: 'Golf GTI', generation: 'Mk8', productionStartYear: 2020,
    bodyType: 'HATCHBACK', vehicleSize: 'compact', segment: 'Hot Hatch', doors: 5, seats: 5,
    drivetrain: 'FWD', fuelTypes: ['PETROL'], transmissionTypes: ['MANUAL', 'AUTOMATIC'],
    minPowerHp: 245, maxPowerHp: 300, typicalUsedPriceMin: 28000, typicalUsedPriceMax: 42000,
    description: 'Der Kompaktsport-Klassiker: schnell genug, alltagstauglich, unauffällig.',
    strengths: ['Alltag + Spaß', 'Wiederverkauf', 'Platz'],
    weaknesses: ['Touch-Bedienung', 'Design zurückhaltend'],
    tags: ['performance', 'alltag'], imageUrls: img('VW Golf GTI'),
    specs: { zeroToHundred: 5.6, topSpeed: 267, weightKg: 1461, trunkVolumeL: 374 },
  },
  {
    make: 'Volkswagen', model: 'Arteon', variant: 'Shooting Brake', productionStartYear: 2020,
    bodyType: 'WAGON', vehicleSize: 'large', segment: 'Design-Kombi', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['PETROL', 'DIESEL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 150, maxPowerHp: 320, typicalUsedPriceMin: 28000, typicalUsedPriceMax: 45000,
    description: 'Eleganter Shooting Brake — Design-Alternative zum klassischen Kombi.',
    strengths: ['Design', 'Platz im Fond', 'R-Topmodell'],
    weaknesses: ['Image vs. Premium-Marken', 'Software früher Baujahre'],
    tags: ['design', 'alltag'], imageUrls: img('VW Arteon Shooting Brake'),
    specs: { zeroToHundred: 5.6, topSpeed: 250, weightKg: 1790, trunkVolumeL: 565 },
  },
  {
    make: 'Land Rover', model: 'Range Rover Sport', generation: 'L494',
    productionStartYear: 2013, productionEndYear: 2022,
    bodyType: 'SUV', vehicleSize: 'large', segment: 'Luxus-SUV', doors: 5, seats: 5,
    drivetrain: 'AWD', fuelTypes: ['DIESEL', 'PETROL', 'PLUGIN_HYBRID'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 249, maxPowerHp: 575, typicalUsedPriceMin: 38000, typicalUsedPriceMax: 90000,
    description: 'Luxus-SUV mit echter Geländekompetenz und souveränem Auftritt.',
    strengths: ['Auftritt', 'Offroad + Luxus', 'Zugfahrzeug'],
    weaknesses: ['Zuverlässigkeitsruf', 'Unterhalt hoch'],
    tags: ['luxury', 'suv'], imageUrls: img('Range Rover Sport'),
    specs: { zeroToHundred: 5.3, topSpeed: 250, weightKg: 2310, trunkVolumeL: 780 },
  },
  {
    make: 'Alfa Romeo', model: 'Giulia', variant: 'Quadrifoglio', productionStartYear: 2016,
    bodyType: 'SEDAN', vehicleSize: 'midsize', segment: 'Sportlimousine', doors: 4, seats: 5,
    drivetrain: 'RWD', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
    minPowerHp: 510, maxPowerHp: 520, typicalUsedPriceMin: 45000, typicalUsedPriceMax: 75000,
    description: 'Die emotionale Wahl: Biturbo-V6 mit Ferrari-Genen, Hinterradantrieb.',
    strengths: ['Lenkung und Balance', 'Sound', 'Charakter'],
    weaknesses: ['Elektronik-Zickigkeit', 'Händlernetz'],
    tags: ['performance', 'emotion'], imageUrls: img('Alfa Romeo Giulia Quadrifoglio'),
    specs: { zeroToHundred: 3.9, topSpeed: 307, weightKg: 1580 },
  },
  {
    make: 'Ford', model: 'Mustang', generation: 'S550', productionStartYear: 2015, productionEndYear: 2023,
    bodyType: 'COUPE', vehicleSize: 'midsize', segment: 'Muscle Car', doors: 2, seats: 4,
    drivetrain: 'RWD', fuelTypes: ['PETROL'], transmissionTypes: ['MANUAL', 'AUTOMATIC'],
    minPowerHp: 317, maxPowerHp: 460, typicalUsedPriceMin: 28000, typicalUsedPriceMax: 55000,
    description: 'V8-Muscle-Car mit maximalem Sound pro Euro.',
    strengths: ['V8 fürs Geld', 'Auftritt', 'Cabrio-Option'],
    weaknesses: ['Verbrauch', 'Innenraum-Qualität', 'Wertverlust'],
    tags: ['emotion', 'performance'], imageUrls: img('Ford Mustang GT'),
    specs: { zeroToHundred: 4.8, topSpeed: 250, weightKg: 1739 },
  },
]

/**
 * Typische, community-bekannte Schwachstellen je Baureihe — bewusst vorsichtig
 * formuliert, in der UI als "nicht verifiziert" gekennzeichnet. Produktion:
 * TÜV-Report-/DAT-Daten lizenzieren (v0.4).
 */
export const modelKnownIssues: Record<string, string[]> = {
  'Volkswagen Golf GTI': ['Infotainment-Software früher Mk8-Baujahre gilt als fehleranfällig'],
  'BMW M340i Touring': ['Kühlsystem und Dichtungen im Alter prüfen (B58 sonst als robust bekannt)'],
  'Porsche 718 Cayman': ['Frontkühler anfällig für Steinschlag — bei Besichtigung prüfen'],
  'Audi RS6 Avant': ['Hohe Wartungs- und Reifenkosten einplanen; Fahrwerkskomponenten prüfen'],
  'Mercedes-AMG C63': ['Wartungshistorie kritisch — Vorschäden durch Tuning verbreitet'],
  'Land Rover Range Rover Sport': ['Luftfahrwerk und Elektronik sind bekannte Kostenpunkte'],
  'Alfa Romeo Giulia Quadrifoglio': ['Elektronik-Sensibilitäten; dünneres Service-Netz beachten'],
  'Tesla Model 3 Performance': ['Verarbeitungsqualität streut; hoher Reifenverschleiß'],
  'Cupra Formentor': ['Infotainment-Software früher Baujahre gilt als fehleranfällig'],
  'Ford Mustang': ['Hoher Verbrauch; Innenraumqualität unter EU-Niveau'],
}
