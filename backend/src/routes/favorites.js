import { Router } from 'express'
import { addFavorite, listFavorites, removeFavorite } from '../controllers/favoriteController.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()
router.use(requireAuth)
router.get('/', listFavorites)
router.post('/:institutionId', addFavorite)
router.delete('/:institutionId', removeFavorite)

export default router
