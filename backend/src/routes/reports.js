import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { reportReview } from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'
import { reportSchema } from '../validators/schemas.js'

const router = Router()
const reportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false })
router.post('/', requireAuth, reportLimiter, validateBody(reportSchema), reportReview)

export default router
