import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import authRouter from './routes/auth.js'
import accountRouter from './routes/account.js'
import adminRouter from './routes/admin.js'
import institutionRouter from './routes/institutions.js'
import reviewRouter from './routes/reviews.js'
import reportRouter from './routes/reports.js'
import favoriteRouter from './routes/favorites.js'
import categoryRouter from './routes/categories.js'
import { env } from './config/env.js'
import healthRouter from './routes/health.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const allowedOrigins = new Set(env.FRONTEND_URL)

app.disable('x-powered-by')
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}))
app.use(cors({
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true)
    const error = new Error('Origin is not allowed by CORS.')
    error.status = 403
    callback(error)
  },
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/', (_req, res) => res.json({ name: 'CampusCompass API', status: 'running' }))
app.use('/api/auth', authRouter)
app.use('/api/account', accountRouter)
app.use('/api/admin', adminRouter)
app.use('/api/institutions', institutionRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/reports', reportRouter)
app.use('/api/favorites', favoriteRouter)
app.use('/api/categories', categoryRouter)
app.use('/health', healthRouter)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
