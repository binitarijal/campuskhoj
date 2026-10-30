import Review from '../models/Review.js'
import { recordAdminAction } from './auditLog.js'
import { refreshInstitutionRatings } from './reviewRatings.js'

const targetStatus = { approve: 'approved', reject: 'rejected', flag: 'flagged', hide: 'hidden', remove: 'removed' }
const logAction = { approve: 'approve', reject: 'reject', flag: 'flag', hide: 'hide-review', remove: 'remove-review' }

export async function applyReviewModeration({ reviewId, moderatorId, action, note, reason, session }) {
  const nextStatus = targetStatus[action]
  if (!nextStatus) {
    const error = new Error('Unsupported moderation action.')
    error.status = 400
    throw error
  }
  const review = await Review.findById(reviewId).select('+moderation.note +moderation.reason').session(session)
  if (!review) {
    const error = new Error('Review not found.')
    error.status = 404
    throw error
  }
  const allowed = action === 'hide' ? ['approved']
    : action === 'remove' ? ['approved', 'hidden', 'flagged', 'rejected', 'pending']
      : ['pending']
  if (!allowed.includes(review.status)) {
    const error = new Error(`Cannot ${action} a review with ${review.status} status.`)
    error.status = 409
    throw error
  }
  const before = { status: review.status }
  review.status = nextStatus
  review.moderation = {
    note: note || undefined,
    reason: reason || undefined,
    moderatedBy: moderatorId,
    moderatedAt: new Date(),
  }
  if (action === 'approve') review.attachments.forEach((attachment) => { attachment.status = 'approved' })
  if (['reject', 'flag', 'hide', 'remove'].includes(action)) review.attachments.forEach((attachment) => { attachment.status = 'rejected' })
  await review.save({ session })

  const ratings = before.status === 'approved' || nextStatus === 'approved'
    ? await refreshInstitutionRatings(review.institution, session)
    : undefined
  await recordAdminAction({
    entityType: 'review', entityId: review._id, action: logAction[action], actor: moderatorId,
    reason: reason || note, before, after: { status: review.status }, session,
  })
  return { review, ratings }
}
