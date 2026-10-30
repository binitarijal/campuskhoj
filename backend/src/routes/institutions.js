import { Router } from 'express'
import { compareInstitutions, getFeaturedInstitutions, getPublishedInstitution, getPublishedReviews, listPublishedInstitutions } from '../controllers/institutionController.js'

const router = Router()
router.get('/', listPublishedInstitutions)
router.get('/featured', getFeaturedInstitutions)
router.get('/compare', compareInstitutions)
router.get('/:slug/reviews', getPublishedReviews)
router.get('/:slug', getPublishedInstitution)

export default router
