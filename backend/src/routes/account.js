import { Router } from 'express'
import { getAccountProfile } from '../controllers/accountController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.get('/profile', requireAuth, getAccountProfile)

export default router
