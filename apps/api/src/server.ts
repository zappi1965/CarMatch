import { buildApp } from './app.js'
import { config } from './config.js'
import { startInProcessJobs } from './jobs/worker.js'

const app = await buildApp()

try {
  await app.listen({ port: config.PORT, host: '0.0.0.0' })
  // Ohne Redis laufen die Jobs in-process (MVP); mit REDIS_URL separater Worker-Prozess.
  if (!config.REDIS_URL) startInProcessJobs(app.log)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
