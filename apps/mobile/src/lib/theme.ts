/**
 * CarMatch Design-System — "Tinder trifft Porsche-Konfigurator".
 * Dunkles Graphit, warmes Weiß, ein einziger roter Akzent. Kein Neon.
 */
export const colors = {
  bg: '#0E0F12',
  surface: '#17181C',
  card: '#1C1D23',
  cardBorder: '#2A2B33',
  text: '#F4F2EE',
  textMuted: '#9B9BA6',
  textFaint: '#5F606B',
  accent: '#D5001C', // Signalrot — sparsam: CTAs & Super-Like
  like: '#2E9E6B',
  dislike: '#B3453E',
  gold: '#C9A15A', // Preis/Highlights
  warn: '#D9A441',
  info: '#5C8DBC',
  overlay: 'rgba(10,10,12,0.6)',
} as const

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 } as const

export const spacing = (n: number) => n * 4

export const typography = {
  display: { fontSize: 30, fontWeight: '700' as const, letterSpacing: -0.5 },
  title: { fontSize: 21, fontWeight: '700' as const, letterSpacing: -0.3 },
  price: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  body: { fontSize: 15, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  badge: { fontSize: 12, fontWeight: '600' as const },
}
