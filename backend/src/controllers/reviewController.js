import mongoose from 'mongoose'
import Institution from '../models/Institution.js'
import Report from '../models/Report.js'
import Review from '../models/Review.js'
import { deleteCloudinaryImage, uploadImageBuffer, validImageBuffer } from '../services/imageUpload.js'

function pagination(query) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 12))
  return { page, limit, skip: (page - 1) * limit }
}

export async function createReview(req, res, next) {
  try {
    const institution = await Institution.findOne({ _id: req.validatedBody.institutionId, status: 'published' }).select('_id')
    if (!institution) return res.status(404).json({ error: { code: 'INSTITUTION_NOT_FOUND', message: 'Choose an institution that is currently published.' } })
    const review = await Review.create({
      institution: institution._id,
      author: req.authUser._id,
      overallRating: req.validatedBody.overallRating,
      categoryRatings: req.validatedBody.categoryRatings || {},
      title: req.validatedBody.title,
      body: req.validatedBody.body,
      pros: req.validatedBody.pros,
      cons: req.validatedBody.cons,
      attendancePeriod: req.validatedBody.attendancePeriod,
      status: 'pending',
    })
    return res.status(201).json({ data: { id: review._id.toString(), status: review.status, createdAt: review.createdAt } })
  } catch (error) {
    return next(error)
  }
}

export async function getMyReviews(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query)
    const filter = { author: req.authUser._id }
    const [reviews, total] = await Promise.all([
      Review.find(filter).select('institution overallRating categoryRatings title body pros cons status createdAt updatedAt')
        .populate('institution', 'name slug logo location.city location.country status').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Review.countDocuments(filter),
    ])
    return res.json({ data: reviews, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function reportReview(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.validatedBody.reviewId, status: 'approved' }).select('author')
    if (!review) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'This review is not available to report.' } })
    if (review.author.equals(req.authUser._id)) {
      return res.status(400).json({ error: { code: 'OWN_REVIEW', message: 'You cannot report your own review.' } })
    }
    const report = await Report.create({
      review: review._id,
      reporter: req.authUser._id,
      reason: req.validatedBody.reason,
      details: req.validatedBody.details,
    })
    return res.status(201).json({ data: { id: report._id.toString(), status: report.status } })
  } catch (error) {
    return next(error)
  }
}

export async function uploadReviewAttachment(req, res, next) {
  let uploaded
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Review ID is invalid.' } })
    const mimeType = req.get('content-type')?.split(';')[0]
    if (!validImageBuffer(req.body, mimeType)) return res.status(415).json({ error: { code: 'INVALID_IMAGE', message: 'Upload a valid JPEG, PNG, or WebP image.' } })
    const review = await Review.findOne({ _id: req.params.id, author: req.authUser._id, status: 'pending' })
    if (!review) return res.status(404).json({ error: { code: 'REVIEW_NOT_AVAILABLE', message: 'Only your pending review can receive attachments.' } })
    if (review.attachments.length >= 4) return res.status(409).json({ error: { code: 'ATTACHMENT_LIMIT', message: 'A review can have at most four images.' } })
    uploaded = await uploadImageBuffer(req.body, `campuscompass/reviews/${review._id}`)
    const attachment = {
      publicId: uploaded.public_id, secureUrl: uploaded.secure_url,
      width: uploaded.width, height: uploaded.height,
      alt: String(req.query.alt || '').trim().slice(0, 200), status: 'pending',
    }
    review.attachments.push(attachment)
    try { await review.save() } catch (error) { await deleteCloudinaryImage(uploaded.public_id).catch(() => undefined); throw error }
    return res.status(201).json({ data: attachment })
  } catch (error) {
    if (uploaded?.public_id) await deleteCloudinaryImage(uploaded.public_id).catch(() => undefined)
    return next(error)
  }
}
