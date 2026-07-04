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

const curatedVehicleModelSeeds: (VehicleModelSeed & { imageUrls: string[] })[] = [
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

type CatalogEntry = { make: string; models: string[] }

const catalog: CatalogEntry[] = [
  { make: 'Audi', models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT', 'R8', 'e-tron GT'] },
  { make: 'BMW', models: ['1er', '2er', '3er', '4er', '5er', '7er', '8er', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4', 'i4', 'i5', 'iX'] },
  { make: 'Mercedes-Benz', models: ['A-Klasse', 'B-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasse', 'EQA', 'EQB', 'EQE', 'AMG GT'] },
  { make: 'Porsche', models: ['911', '718 Cayman', '718 Boxster', 'Panamera', 'Macan', 'Cayenne', 'Taycan', 'Boxster', 'Cayman', 'Carrera GT', '918 Spyder'] },
  { make: 'Volkswagen', models: ['Up', 'Polo', 'Golf', 'Golf GTI', 'Golf R', 'Passat', 'Arteon', 'T-Cross', 'T-Roc', 'Tiguan', 'Touareg', 'Touran', 'Multivan', 'ID.3', 'ID.4', 'ID.5', 'ID. Buzz'] },
  { make: 'Tesla', models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Roadster', 'Cybertruck'] },
  { make: 'Volvo', models: ['EX30', 'EX40', 'C40', 'XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'V60 Cross Country', 'V90 Cross Country'] },
  { make: 'Skoda', models: ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Elroq', 'Yeti', 'Rapid'] },
  { make: 'Seat', models: ['Ibiza', 'Leon', 'Leon Sportstourer', 'Ateca', 'Tarraco', 'Arona', 'Alhambra', 'Mii Electric'] },
  { make: 'Cupra', models: ['Born', 'Formentor', 'Leon', 'Leon Sportstourer', 'Ateca', 'Tavascan', 'Terramar'] },
  { make: 'Opel', models: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Zafira', 'Combo Life', 'Vivaro', 'Rocks Electric'] },
  { make: 'Ford', models: ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'Puma', 'Explorer', 'Mustang', 'Mustang Mach-E', 'S-Max', 'Galaxy', 'Ranger', 'Bronco'] },
  { make: 'Peugeot', models: ['208', '308', '408', '508', '2008', '3008', '5008', 'Rifter', 'Traveller', 'e-208', 'e-308'] },
  { make: 'Renault', models: ['Clio', 'Megane', 'Talisman', 'Captur', 'Kadjar', 'Austral', 'Espace', 'Scenic', 'Kangoo', 'Zoe', 'Megane E-Tech'] },
  { make: 'Citroën', models: ['C3', 'C4', 'C5 X', 'C3 Aircross', 'C5 Aircross', 'Berlingo', 'Spacetourer', 'e-C4'] },
  { make: 'Fiat', models: ['500', '500e', '500X', 'Panda', 'Tipo', 'Punto', 'Ducato', 'Doblo'] },
  { make: 'Toyota', models: ['Aygo X', 'Yaris', 'Corolla', 'Camry', 'Prius', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'GR86', 'GR Supra', 'bZ4X'] },
  { make: 'Lexus', models: ['UX', 'NX', 'RX', 'RZ', 'ES', 'LS', 'LC', 'RC', 'IS'] },
  { make: 'Honda', models: ['Jazz', 'Civic', 'Accord', 'HR-V', 'CR-V', 'ZR-V', 'e:Ny1', 'NSX', 'S2000'] },
  { make: 'Mazda', models: ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'MX-30', 'RX-8'] },
  { make: 'Nissan', models: ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', '370Z', 'GT-R', 'Navara'] },
  { make: 'Hyundai', models: ['i10', 'i20', 'i30', 'i40', 'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Nexo'] },
  { make: 'Kia', models: ['Picanto', 'Rio', 'Ceed', 'Proceed', 'Stinger', 'XCeed', 'Sportage', 'Sorento', 'Niro', 'Soul EV', 'EV3', 'EV6', 'EV9'] },
  { make: 'Mini', models: ['3-Türer', '5-Türer', 'Clubman', 'Countryman', 'Cabrio', 'Cooper SE', 'Paceman'] },
  { make: 'Alfa Romeo', models: ['Giulia', 'Stelvio', 'Tonale', 'MiTo', 'Giulietta', '4C', '8C'] },
  { make: 'Jeep', models: ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Avenger', 'Gladiator'] },
  { make: 'Land Rover', models: ['Defender', 'Discovery Sport', 'Discovery', 'Range Rover Evoque', 'Range Rover Velar', 'Range Rover Sport', 'Range Rover'] },
  { make: 'Jaguar', models: ['XE', 'XF', 'XJ', 'F-Type', 'F-Pace', 'E-Pace', 'I-Pace'] },
  { make: 'Maserati', models: ['Ghibli', 'Quattroporte', 'Levante', 'Grecale', 'GranTurismo', 'MC20'] },
  { make: 'Polestar', models: ['Polestar 2', 'Polestar 3', 'Polestar 4'] },
  { make: 'MG', models: ['MG3', 'MG4', 'MG5', 'ZS', 'HS', 'Marvel R', 'Cyberster'] },
  { make: 'Dacia', models: ['Sandero', 'Logan', 'Duster', 'Jogger', 'Spring', 'Lodgy'] },
  { make: 'Suzuki', models: ['Swift', 'Ignis', 'Baleno', 'Vitara', 'S-Cross', 'Jimny', 'Across'] },
  { make: 'Subaru', models: ['Impreza', 'Levorg', 'WRX STI', 'XV', 'Crosstrek', 'Forester', 'Outback', 'BRZ', 'Solterra'] },
  { make: 'Mitsubishi', models: ['Space Star', 'Colt', 'ASX', 'Eclipse Cross', 'Outlander', 'L200'] },
  { make: 'Smart', models: ['Fortwo', 'Forfour', '#1', '#3'] },
  { make: 'Genesis', models: ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'] },
  { make: 'Ferrari', models: ['Roma', 'Portofino', '296 GTB', 'F8 Tributo', 'SF90 Stradale', '812 Superfast', 'Purosangue'] },
  { make: 'Lamborghini', models: ['Huracán', 'Aventador', 'Revuelto', 'Urus', 'Gallardo'] },
  { make: 'McLaren', models: ['570S', '600LT', '720S', '750S', 'GT', 'Artura', 'Senna'] },
  { make: 'Aston Martin', models: ['Vantage', 'DB11', 'DB12', 'DBS', 'Vanquish', 'DBX'] },
  { make: 'Chevrolet', models: ['Spark', 'Aveo', 'Cruze', 'Malibu', 'Camaro', 'Corvette', 'Trax', 'Equinox', 'Tahoe', 'Suburban', 'Silverado'] },
  { make: 'Dodge', models: ['Challenger', 'Charger', 'Durango', 'Journey', 'Viper', 'RAM 1500'] },
  { make: 'Cadillac', models: ['ATS', 'CTS', 'CT4', 'CT5', 'Escalade', 'XT4', 'XT5', 'XT6', 'Lyriq'] },
  { make: 'Lincoln', models: ['Navigator', 'Aviator', 'Corsair', 'Nautilus', 'Continental'] },
  { make: 'Bentley', models: ['Continental GT', 'Flying Spur', 'Bentayga', 'Mulsanne', 'Azure'] },
  { make: 'Rolls-Royce', models: ['Ghost', 'Phantom', 'Wraith', 'Dawn', 'Cullinan', 'Spectre'] },
  { make: 'Lotus', models: ['Elise', 'Exige', 'Evora', 'Emira', 'Eletre', 'Evija'] },
  { make: 'DS Automobiles', models: ['DS 3', 'DS 4', 'DS 7', 'DS 9'] },
  { make: 'Abarth', models: ['595', '695', '124 Spider', '500e'] },
  { make: 'Lancia', models: ['Ypsilon', 'Delta', 'Thema', 'Voyager'] },
  { make: 'Saab', models: ['9-3', '9-5', '900', '9000'] },
  { make: 'Infiniti', models: ['Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX70'] },
  { make: 'Lucid', models: ['Air', 'Gravity'] },
  { make: 'BYD', models: ['Atto 3', 'Dolphin', 'Seal', 'Seal U', 'Tang', 'Han'] },
  { make: 'Nio', models: ['ET5', 'ET7', 'EL6', 'EL7', 'EL8'] },
]

const isElectricModel = (make: string, model: string) => /(^|\b)(e-|i[345x]|id\.|eq|ev|ioniq|leaf|ariya|taycan|polestar|model [3ysx]|mach-e|born|spring|bZ4X|RZ|I-Pace|Solterra|#1|#3)/i.test(`${make} ${model}`)
const isSuvModel = (model: string) => /(x[1-7]|q[23578]|gl[abcse]|xc|ex|cx-|c-hr|rav4|land cruiser|juke|qashqai|x-trail|kona|tucson|santa fe|sportage|sorento|niro|countryman|stelvio|tonale|renegade|compass|cherokee|wrangler|defender|discovery|range rover|f-pace|e-pace|levante|grecale|gv|duster|vitara|forester|outback|asx|outlander|urus|dbx)/i.test(model)
const isSportsModel = (make: string, model: string) => /(911|718|boxster|cayman|z4|tt|r8|amg gt|mustang|supra|gr86|mx-5|370z|gt-r|s2000|nsx|4c|f-type|mc20|roma|296|f8|sf90|huracán|aventador|revuelto|570s|720s|750s|vantage|db11|db12|dbs|vanquish|roadster|cyberster)/i.test(`${make} ${model}`)
const isWagonModel = (model: string) => /(avant|touring|sportstourer|t-modell|variant|shooting brake|v60|v90|proceed|levorg|outback)/i.test(model)
const isCompactModel = (model: string) => /(polo|golf|a1|a3|1er|2er|corsa|astra|fiesta|focus|208|308|clio|megane|c3|c4|500|panda|yaris|corolla|jazz|civic|mazda2|mazda3|micra|i20|i30|ceed|swift|impreza|space star|fortwo|forfour)/i.test(model)

function archetypeFor(make: string, model: string) {
  const electric = isElectricModel(make, model)
  const sports = isSportsModel(make, model)
  const suv = isSuvModel(model)
  const wagon = isWagonModel(model)
  const compact = isCompactModel(model)
  const premium = /(porsche|bmw|audi|mercedes|lexus|jaguar|land rover|maserati|genesis|ferrari|lamborghini|mclaren|aston martin)/i.test(make)
  const exotic = /(ferrari|lamborghini|mclaren|aston martin|maserati)/i.test(make)
  const bodyType = sports ? (model.toLowerCase().includes('boxster') || model.toLowerCase().includes('mx-5') ? 'CONVERTIBLE' : 'COUPE') : suv ? 'SUV' : wagon ? 'WAGON' : compact ? 'HATCHBACK' : 'SEDAN'
  const vehicleSize = suv || model.match(/s-klasse|a8|7er|x7|q8|gls|range rover|touareg|xc90|sorento|ev9|purosangue/i) ? 'large' : compact ? 'compact' : 'midsize'
  const segment = electric ? (suv ? 'Elektro-SUV' : 'Elektroauto') : sports ? 'Sportwagen' : suv ? 'SUV' : wagon ? 'Kombi' : compact ? 'Kompaktklasse' : premium ? 'Premium-Limousine' : 'Alltagsauto'
  const minPowerHp = exotic ? 560 : sports ? 280 : electric ? 170 : premium ? 190 : compact ? 95 : 140
  const maxPowerHp = exotic ? 1000 : sports ? 650 : electric ? 585 : premium ? 530 : compact ? 320 : 420
  const priceMin = exotic ? 140000 : sports ? 32000 : premium ? 24000 : electric ? 22000 : compact ? 8000 : 14000
  const priceMax = exotic ? 420000 : sports ? 180000 : premium ? 110000 : electric ? 70000 : compact ? 42000 : 65000
  const doors = bodyType === 'COUPE' || bodyType === 'CONVERTIBLE' ? 2 : 5
  const seats = bodyType === 'COUPE' || bodyType === 'CONVERTIBLE' ? (sports ? 2 : 4) : 5
  return { electric, sports, suv, wagon, compact, premium, bodyType, vehicleSize, segment, minPowerHp, maxPowerHp, priceMin, priceMax, doors, seats }
}

function generateCatalogModels(limit = 480): (VehicleModelSeed & { imageUrls: string[] })[] {
  const generated: (VehicleModelSeed & { imageUrls: string[] })[] = []
  const existingKeys = new Set(curatedVehicleModelSeeds.map((s) => `${s.make}|${s.model}|${s.variant ?? ''}`.toLowerCase()))
  outer: for (const entry of catalog) {
    for (const model of entry.models) {
      const key = `${entry.make}|${model}|`.toLowerCase()
      if (existingKeys.has(key)) continue
      const a = archetypeFor(entry.make, model)
      generated.push({
        make: entry.make,
        model,
        generation: 'Demo-Katalog',
        productionStartYear: a.electric ? 2020 : a.sports ? 2016 : 2018,
        bodyType: a.bodyType,
        vehicleSize: a.vehicleSize as 'small' | 'compact' | 'midsize' | 'large',
        segment: a.segment,
        doors: a.doors,
        seats: a.seats,
        drivetrain: a.sports ? 'RWD' : a.suv || a.premium ? 'AWD' : 'FWD',
        fuelTypes: a.electric ? ['ELECTRIC'] : a.premium || a.suv ? ['PETROL', 'DIESEL', 'HYBRID'] : ['PETROL', 'HYBRID'],
        transmissionTypes: a.sports || a.compact ? ['MANUAL', 'AUTOMATIC'] : ['AUTOMATIC'],
        minPowerHp: a.minPowerHp,
        maxPowerHp: a.maxPowerHp,
        typicalUsedPriceMin: a.priceMin,
        typicalUsedPriceMax: a.priceMax,
        description: `${entry.make} ${model}: Demo-Katalogmodell mit geschätzten Richtwerten für Matching, Monatskosten und Vergleichsansichten.`,
        strengths: a.electric ? ['niedrige Energiekosten', 'leises Fahren', 'gute Beschleunigung'] : a.sports ? ['Fahrspaß', 'Emotion', 'starke Performance'] : a.suv ? ['hohe Sitzposition', 'Alltag und Familie', 'guter Wiederverkauf'] : ['Alltagstauglichkeit', 'breite Verfügbarkeit', 'gute Vergleichbarkeit'],
        weaknesses: a.electric ? ['Ladeprofil prüfen', 'Winterreichweite beachten'] : a.sports ? ['Unterhalt und Reifen teuer', 'Versicherung prüfen'] : a.suv ? ['Verbrauch und Reifenkosten', 'Größe in der Stadt'] : ['Ausstattung stark preisabhängig', 'Zustand wichtiger als Modelljahr'],
        tags: [a.electric ? 'electric' : 'combustion', a.sports ? 'performance' : 'alltag', a.suv ? 'suv' : a.wagon ? 'family' : a.compact ? 'compact' : 'comfort'],
        imageUrls: img(`${entry.make} ${model}`),
        specs: {
          zeroToHundred: a.sports ? 4.2 : a.electric ? 5.8 : a.premium ? 6.2 : 8.8,
          topSpeed: a.electric ? 210 : a.sports ? 290 : a.premium ? 250 : 205,
          weightKg: a.suv ? 1900 : a.electric ? 1850 : a.compact ? 1350 : 1650,
          trunkVolumeL: a.sports ? 180 : a.suv ? 560 : a.wagon ? 560 : a.compact ? 380 : 480,
          consumptionL100: a.electric ? undefined : a.sports ? 9.8 : a.suv ? 7.8 : 6.2,
          electricRangeKm: a.electric ? 430 : undefined,
        },
      })
      if (curatedVehicleModelSeeds.length + generated.length >= limit) break outer
    }
  }
  return generated
}

export const vehicleModelSeeds: (VehicleModelSeed & { imageUrls: string[] })[] = [
  ...curatedVehicleModelSeeds,
  ...generateCatalogModels(480),
]

