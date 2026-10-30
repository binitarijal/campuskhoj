import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import './config/cloudinary.js'
import { env } from './config/env.js'
import './models/index.js'

let server
let shuttingDown = false
let databaseRetryTimer

async function connectDatabaseWithRetry() {
  if (shuttingDown) return
  try {
    await connectDatabase()
    console.info('[database] MongoDB connection established.')
  } catch (error) {
    const causeCodes = new Set([error.code, error.cause?.code].filter((code) => typeof code === 'string' && /^[A-Z0-9_]+$/.test(code)))
    for (const serverDescription of error.reason?.servers?.values?.() ?? []) {
      const cause = serverDescription.error?.cause ?? serverDescription.error
      if (typeof cause?.code === 'string' && /^[A-Z0-9_]+$/.test(cause.code)) causeCodes.add(cause.code)
    }
    const details = causeCodes.size ? `; causes=${[...causeCodes].join(',')}` : ''
    console.error(`[database] Connection failed (${error.name || 'Error'}${details}); retrying in 15 seconds.`)
    if (!shuttingDown) {
      databaseRetryTimer = setTimeout(() => void connectDatabaseWithRetry(), 15_000)
      databaseRetryTimer.unref()
    }
  }
}

function start() {
  server = app.listen(env.PORT, () => {
    console.info(`[server] CampusCompass API listening on port ${env.PORT}.`)
  })
  void connectDatabaseWithRetry()
}

async function shutdown(signal) {
  if (shuttingDown) return
  shuttingDown = true
  clearTimeout(databaseRetryTimer)
  console.info(`[server] Received ${signal}; shutting down.`)

  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }

  await disconnectDatabase()
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

await start()
