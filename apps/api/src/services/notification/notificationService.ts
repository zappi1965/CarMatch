import { prisma } from '../../db.js'
import { config } from '../../config.js'

export type PushCategory =
  | 'newMatch'
  | 'priceDrop'
  | 'favoriteGone'
  | 'savedSearch'
  | 'dealerReply'
  | 'superMatch'

export interface PushMessage {
  title: string
  body: string
  data?: Record<string, string>
}

/** Push-Provider-Abstraktion — MVP: Expo Push API; austauschbar (FCM/APNs direkt). */
interface PushProvider {
  send(tokens: string[], message: PushMessage): Promise<void>
}

class ExpoPushProvider implements PushProvider {
  async send(tokens: string[], message: PushMessage): Promise<void> {
    if (tokens.length === 0) return
    const payload = tokens.map((to) => ({
      to,
      title: message.title,
      body: message.body,
      data: message.data,
      sound: 'default',
    }))
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Expo Push ${res.status}`)
  }
}

/** Kein Versand (Entwicklung/Push deaktiviert) — loggt nur. */
class NoopPushProvider implements PushProvider {
  async send(tokens: string[], message: PushMessage): Promise<void> {
    console.info(`[push:noop] an ${tokens.length} Geräte: ${message.title} — ${message.body}`)
  }
}

const provider: PushProvider = config.EXPO_PUSH_ENABLED
  ? new ExpoPushProvider()
  : new NoopPushProvider()

const DEFAULT_CATEGORIES: Record<PushCategory, boolean> = {
  newMatch: false, // Opt-in: Push nur mit Zustimmung, Kategorien einzeln schaltbar
  priceDrop: false,
  favoriteGone: false,
  savedSearch: false,
  dealerReply: false,
  superMatch: false,
}

/** Sendet nur, wenn der Nutzer die Kategorie aktiviert hat (DSGVO/Consent). */
export async function sendPushToUser(
  userId: string,
  category: PushCategory,
  message: PushMessage,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pushTokens: true },
  })
  if (!user || user.pushTokens.length === 0) return false
  const categories = { ...DEFAULT_CATEGORIES, ...((user.pushCategories as object) ?? {}) }
  if (!categories[category]) return false

  await provider.send(
    user.pushTokens.map((t) => t.token),
    { ...message, data: { ...message.data, category } },
  )
  return true
}
