import { config } from '../config.js'
import { syncAllProviders } from './syncListings.js'
import { detectPriceDropsAndGone } from './priceDropDetection.js'

type Logger = { info: (msg: string) => void; error: (err: unknown, msg?: string) => void }

/**
 * Job-Runner.
 * MVP ohne Redis: Intervall-Jobs im API-Prozess (startInProcessJobs).
 * Mit REDIS_URL: dieser Prozess läuft separat (npm run worker) — die
 * BullMQ-Queue-Anbindung folgt in v0.2, Interface bleibt gleich.
 */
export function startInProcessJobs(log: Logger): void {
  const intervalMs = config.SYNC_INTERVAL_MINUTES * 60_000
  const run = async () => {
    try {
      log.info('[jobs] Provider-Sync startet')
      const result = await syncAllProviders()
      log.info(`[jobs] Sync fertig: ${JSON.stringify(result)}`)
      await detectPriceDropsAndGone()
    } catch (e) {
      log.error(e, '[jobs] Fehler im Job-Lauf')
    }
  }
  void run()
  setInterval(run, intervalMs)
}

// Standalone-Worker (npm run worker)
if (import.meta.url === `file://${process.argv[1]}`) {
  startInProcessJobs(console as unknown as Logger)
}
