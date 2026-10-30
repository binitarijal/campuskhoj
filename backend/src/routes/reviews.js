import { Router } from 'express'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { createReview, getMyReviews, uploadReviewAttachment } from '../controllers/reviewController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'
import { reviewSchema } from '../validators/schemas.js'

const router = Router()
const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false })

router.get('/mine', requireAuth, getMyReviews)
router.post('/', requireAuth, reviewLimiter, validateBody(reviewSchema), createReview)
router.post('/:id/attachments', requireAuth, reviewLimiter, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '8mb' }), uploadReviewAttachment)

export default router
