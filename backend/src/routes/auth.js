import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { getCurrentUser, signInWithGoogle, signOut } from '../controllers/authController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many sign-in attempts. Try again shortly.' } },
})

router.post('/google', signInLimiter, signInWithGoogle)
router.get('/me', requireAuth, getCurrentUser)
router.post('/logout', signOut)

export default router
