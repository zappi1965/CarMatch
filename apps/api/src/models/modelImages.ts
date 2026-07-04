/**
 * Frei verfügbare Demo-Fotos von Wikimedia Commons (via Wikipedia-Seitenbild),
 * aufgelöst über die Wikipedia REST-API (page/summary). Hotlinking auf
 * upload.wikimedia.org ist von Wikimedia ausdrücklich erlaubt.
 *
 * Attribution: Die UI zeigt "Foto: Wikimedia Commons" mit Link auf die
 * Quellseite (dort liegen Autor + Lizenz je Datei). Für den Produktivbetrieb
 * TODO v0.2: Autor + Lizenz pro Datei über die Commons-API auflösen und
 * vollständig anzeigen (CC-BY/CC-BY-SA-Anforderung).
 *
 * Schlüssel: `${make} ${model}` bzw. `${make} ${model} ${variant}` (wie Seed).
 */

export interface ModelImage {
  imageUrl: string
  /** Wikipedia-Artikel als Quell-/Lizenznachweis */
  infoUrl: string
  attribution: string
}

const W = 'Foto: Wikimedia Commons'
/** Commons-Thumb-URL: /commons/thumb/<hash-pfad>/<breite>px-<dateiname> */
const u = (path: string, width = 1280) =>
  `https://upload.wikimedia.org/wikipedia/commons/thumb/${path}/${width}px-${path.split('/').pop()}`

export const modelImages: Record<string, ModelImage> = {
  'Porsche Panamera': {
    imageUrl: u('0/00/Porsche_972_Turbo_E-Hybrid_IMG_0445.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Porsche_Panamera', attribution: W,
  },
  'Porsche 911': {
    imageUrl: u('1/12/2025_Porsche_992_Carrera_convertible_DSC_7026.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Porsche_911_(992)', attribution: W,
  },
  'Porsche 718 Cayman': {
    imageUrl: u('d/d8/2018_Porsche_718_Cayman_S_S-A_2.5_Front.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Porsche_718_Boxster_and_Cayman_(982)', attribution: W,
  },
  'BMW M340i Touring': {
    imageUrl: u('e/e4/2019_BMW_318d_SE_Automatic_2.0_Front.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/BMW_3_Series_(G20)', attribution: `${W} (Baureihe G20)`,
  },
  'BMW M5': {
    imageUrl: u('1/1d/BMW%2C_Techno_Classica_2018%2C_Essen_%28IMG_8995%29.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/BMW_M5', attribution: W,
  },
  'BMW X5': {
    imageUrl: u('0/03/BMW_G05_45e_IMG_3714.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/BMW_X5_(G05)', attribution: W,
  },
  'Audi RS5': {
    imageUrl: u('1/1d/Audi_A5_B10_DSC_7314.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Audi_A5', attribution: `${W} (Baureihe A5)`,
  },
  'Audi RS6 Avant': {
    imageUrl: u('2/20/2021_Audi_RS6_Avant_in_Nardo_Gray%2C_front_right.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Audi_RS_6', attribution: W,
  },
  'Audi A6 Avant': {
    imageUrl: u('e/eb/Audi_A6_C9_IAA_2025_DSC_1920.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Audi_A6', attribution: W,
  },
  'Mercedes-AMG C63': {
    imageUrl: u('5/52/Mercedes-Benz_C_200_Avantgarde_%28W_205%29_%E2%80%93_Frontansicht%2C_26._April_2014%2C_D%C3%BCsseldorf.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Mercedes-Benz_C-Class_(W205)', attribution: `${W} (Baureihe W205)`,
  },
  'Mercedes-Benz E-Klasse T-Modell': {
    imageUrl: u('9/9b/2019_Mercedes-Benz_E220d_SE_Automatic_2.0_Front.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Mercedes-Benz_E-Class_(W213)', attribution: W,
  },
  'Mercedes-Benz GLC': {
    imageUrl: u('2/2c/Mercedes-Benz_X254_1X7A6343.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Mercedes-Benz_GLC', attribution: W,
  },
  'Tesla Model 3 Performance': {
    imageUrl: u('a/ab/Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Tesla_Model_3', attribution: W,
  },
  'Tesla Model Y': {
    imageUrl: u('e/e7/Tesla_Model_Y_Premium_%28Facelift%29_%E2%80%93_f_05052026.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Tesla_Model_Y', attribution: W,
  },
  'Cupra Formentor': {
    imageUrl: u('9/9f/Cupra_Formentor_IMG_9668.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Cupra_Formentor', attribution: W,
  },
  'Volkswagen Golf GTI': {
    imageUrl: u('8/8a/2020_Volkswagen_Golf_Style_1.5_Front.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Volkswagen_Golf_Mk8', attribution: `${W} (Golf 8)`,
  },
  'Volkswagen Arteon Shooting Brake': {
    imageUrl: u('5/5d/2018_Volkswagen_Arteon_2.0.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Volkswagen_Arteon', attribution: W,
  },
  'Land Rover Range Rover Sport': {
    imageUrl: u('a/aa/2015_Land_Rover_Range_Rover_Sport_HSE_3.0_Front.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Range_Rover_Sport', attribution: W,
  },
  'Alfa Romeo Giulia Quadrifoglio': {
    imageUrl: u('2/29/Alfa_952_26.06.19_JM_%281%29_%28cropped%29.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Alfa_Romeo_Giulia_(2015)', attribution: W,
  },
  'Ford Mustang': {
    imageUrl: u('9/9c/Ford_Mustang_VII_GT_Rutesheimer_Autoschau_2025_DSC_9234.jpg'),
    infoUrl: 'https://en.wikipedia.org/wiki/Ford_Mustang', attribution: W,
  },
}

export function findModelImage(make: string, model: string, variant?: string | null): ModelImage | null {
  const exact =
    modelImages[`${make} ${model}${variant ? ` ${variant}` : ''}`] ?? modelImages[`${make} ${model}`]
  if (exact) return exact
  // Präfix-Match: Inserat "BMW M340i xDrive" ↔ Modell "BMW M340i Touring"
  const prefix = `${make} ${model}`
  const hit = Object.entries(modelImages).find(([key]) => key.startsWith(prefix))
  return hit ? hit[1] : null
}
