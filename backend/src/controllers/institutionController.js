import Institution from '../models/Institution.js'
import Review from '../models/Review.js'
import mongoose from 'mongoose'

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 12))
  return { page, limit, skip: (page - 1) * limit }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listPublishedInstitutions(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query)
    const filter = { status: 'published' }
    if (['School', 'College', 'University'].includes(req.query.type)) filter.type = req.query.type
    if (req.query.country) filter['location.country'] = String(req.query.country).slice(0, 100)
    if (req.query.state) filter['location.stateProvince'] = String(req.query.state).slice(0, 100)
    if (req.query.city) filter['location.city'] = String(req.query.city).slice(0, 100)
    if (req.query.facility) filter['facilities.code'] = String(req.query.facility).slice(0, 60).toLowerCase()
    if (req.query.minRating) {
      const rating = Number(req.query.minRating)
      if (Number.isFinite(rating) && rating >= 0 && rating <= 5) filter.ratingAverage = { $gte: rating }
    }
    if (req.query.q) {
      const q = escapeRegex(String(req.query.q).trim().slice(0, 80))
      if (q) {
        const match = new RegExp(q, 'i')
        filter.$or = [{ name: match }, { 'location.city': match }, { 'location.stateProvince': match }, { 'location.country': match }, { 'courses.name': match }, { departments: match }]
      }
    }

    const sortMap = {
      rating_desc: { ratingAverage: -1, ratingCount: -1, name: 1 },
      reviews_desc: { ratingCount: -1, ratingAverage: -1, name: 1 },
      newest: { createdAt: -1 },
      name_asc: { name: 1 },
    }
    const sort = sortMap[req.query.sort] || sortMap.rating_desc
    const [items, total] = await Promise.all([
      Institution.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Institution.countDocuments(filter),
    ])
    return res.json({ data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function getFeaturedInstitutions(_req, res, next) {
  try {
    const items = await Institution.find({ status: 'published' }).sort({ ratingAverage: -1, ratingCount: -1 }).limit(6).lean()
    return res.json({ data: items })
  } catch (error) {
    return next(error)
  }
}

export async function compareInstitutions(req, res, next) {
  try {
    const ids = String(req.query.ids || '').split(',').filter(Boolean)
    if (ids.length < 2 || ids.length > 3 || ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ error: { code: 'INVALID_COMPARISON', message: 'Choose two or three institutions to compare.' } })
    }
    const items = await Institution.find({ _id: { $in: ids }, status: 'published' }).lean()
    if (items.length !== ids.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or more institutions are unavailable.' } })
    return res.json({ data: items })
  } catch (error) {
    return next(error)
  }
}

export async function getPublishedInstitution(req, res, next) {
  try {
    const institution = await Institution.findOne({ slug: String(req.params.slug).toLowerCase(), status: 'published' }).lean()
    if (!institution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } })
    return res.json({ data: institution })
  } catch (error) {
    return next(error)
  }
}

export async function getPublishedReviews(req, res, next) {
  try {
    const institution = await Institution.findOne({ slug: String(req.params.slug).toLowerCase(), status: 'published' }).select('_id').lean()
    if (!institution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } })
    const { page, limit, skip } = pagination(req.query)
    const [reviews, total] = await Promise.all([
      Review.find({ institution: institution._id, status: 'approved' })
        .select('overallRating categoryRatings title body pros cons attendancePeriod attachments createdAt')
        .populate('author', 'name avatarUrl')
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments({ institution: institution._id, status: 'approved' }),
    ])
    const visibleReviews = reviews.map((review) => ({
      ...review,
      attachments: (review.attachments || []).filter((item) => item.status === 'approved').map(({ publicId, secureUrl, width, height, alt }) => ({ publicId, secureUrl, width, height, alt })),
    }))
    return res.json({ data: visibleReviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}
