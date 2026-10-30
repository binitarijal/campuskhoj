import mongoose from 'mongoose'
import Review from '../models/Review.js'
import ModerationLog from '../models/ModerationLog.js'
import User from '../models/User.js'
import { applyReviewModeration } from '../services/reviewModeration.js'

const pageOptions = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}
const escapeRegex = (value) => String(value).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function listAdminReviews(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query)
    const filter = {}
    if (['pending', 'approved', 'rejected', 'flagged', 'hidden', 'removed'].includes(req.query.status)) filter.status = req.query.status
    if (req.query.q) {
      const term = new RegExp(escapeRegex(req.query.q), 'i')
      const matchingAuthors = await User.find({ $or: [{ name: term }, { email: term }] }).select('_id').limit(500).lean()
      filter.$or = [{ title: term }, { body: term }, { author: { $in: matchingAuthors.map((user) => user._id) } }]
    }
    const [reviews, total] = await Promise.all([
      Review.find(filter).select('+moderation.note +moderation.reason')
        .populate('author', 'name email avatarUrl role status')
        .populate('institution', 'name slug status').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])
    return res.json({ data: reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function getAdminReview(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review ID is invalid.' } })
    const review = await Review.findById(req.params.id).select('+moderation.note +moderation.reason')
      .populate('author', 'name email avatarUrl role status').populate('institution', 'name slug status').lean()
    if (!review) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Review not found.' } })
    return res.json({ data: review })
  } catch (error) {
    return next(error)
  }
}

export async function moderateReview(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review ID is invalid.' } })
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await applyReviewModeration({
        reviewId: req.params.id, moderatorId: req.authUser._id,
        action: req.validatedBody.action, note: req.validatedBody.note,
        reason: req.validatedBody.reason, session,
      })
    })
    return res.json({ data: { id: result.review._id.toString(), status: result.review.status, ratings: result.ratings } })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function getReviewModerationHistory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review ID is invalid.' } })
    const logs = await ModerationLog.find({ entityType: 'review', entityId: req.params.id })
      .populate('actor', 'name avatarUrl').sort({ createdAt: -1 }).limit(100).lean()
    return res.json({ data: logs })
  } catch (error) {
    return next(error)
  }
}
