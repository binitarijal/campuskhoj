import { Router } from 'express'
import { databaseIsConnected } from '../config/database.js'

const router = Router()

router.get('/', (_req, res) => {
  const connected = databaseIsConnected()
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
    checkedAt: new Date().toISOString(),
  })
})

export default router
