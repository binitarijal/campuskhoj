import { Router } from 'express'
import { requireAdmin, requireAuth } from '../middleware/requireAuth.js'
import { getAdminDashboard } from '../controllers/adminDashboardController.js'
import { createInstitution, deleteInstitution, getAdminInstitution, listAdminInstitutions, setInstitutionStatus, updateInstitution, } from '../controllers/adminInstitutionController.js'
import { getAdminReview, getReviewModerationHistory, listAdminReviews, moderateReview } from '../controllers/adminReviewController.js'
import { changeUserRole, changeUserStatus, getUser, listAdminActivity, listUsers } from '../controllers/adminUserController.js'
import { listReports, resolveReport } from '../controllers/adminReportController.js'
import express from 'express'
import { deleteInstitutionImage, uploadInstitutionImage } from '../controllers/adminMediaController.js'
import { createCategory, deactivateCategory, listCategories, updateCategory } from '../controllers/adminCategoryController.js'
import { validateBody } from '../middleware/validate.js'
import { categorySchema, createInstitutionSchema, reviewActionSchema, reportResolutionSchema, updateInstitutionSchema, userRoleSchema, userStatusSchema } from '../validators/schemas.js'
import rateLimit from 'express-rate-limit'

const router = Router()

router.use(requireAuth, requireAdmin)
const adminWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  keyGenerator: (req) => req.authUser._id.toString(),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many administrator changes. Try again shortly.' } },
})
router.use((req, res, next) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? next() : adminWriteLimiter(req, res, next))
router.get('/session', (req, res) => res.json({ data: { authorized: true, role: req.authUser.role } }))
router.get('/dashboard', getAdminDashboard)
router.get('/analytics', getAdminDashboard)

router.route('/institutions')
  .get(listAdminInstitutions)
  .post(validateBody(createInstitutionSchema), createInstitution)
router.route('/institutions/:id')
  .get(getAdminInstitution)
  .patch(validateBody(updateInstitutionSchema), updateInstitution)
  .delete(deleteInstitution)
// Keep the specific media path ahead of the generic institution status action.
// Otherwise POST /institutions/:id/media is captured with action === "media".
router.post('/institutions/:id/media', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '8mb' }), uploadInstitutionImage)
router.delete('/institutions/:id/media', deleteInstitutionImage)
router.post('/institutions/:id/:action', setInstitutionStatus)

router.get('/reviews', listAdminReviews)
router.get('/reviews/:id/moderation-history', getReviewModerationHistory)
router.get('/reviews/:id', getAdminReview)
router.post('/reviews/:id/moderation', validateBody(reviewActionSchema), moderateReview)

router.get('/users', listUsers)
router.get('/users/:id', getUser)
router.patch('/users/:id/status', validateBody(userStatusSchema), changeUserStatus)
router.patch('/users/:id/role', validateBody(userRoleSchema), changeUserRole)

router.get('/reports', listReports)
router.post('/reports/:id/resolve', validateBody(reportResolutionSchema), resolveReport)

router.route('/categories')
  .get(listCategories)
  .post(validateBody(categorySchema), createCategory)
router.patch('/categories/:id', validateBody(categorySchema.partial()), updateCategory)
router.delete('/categories/:id', deactivateCategory)
router.get('/activity-logs', listAdminActivity)

export default router
