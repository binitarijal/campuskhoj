import mongoose from 'mongoose'
import ModerationLog from '../models/ModerationLog.js'
import Report from '../models/Report.js'
import { applyReviewModeration } from '../services/reviewModeration.js'
import { recordAdminAction } from '../services/auditLog.js'

const pageOptions = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}

export async function listReports(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query)
    const filter = {}
    if (['open', 'resolved', 'dismissed'].includes(req.query.status)) filter.status = req.query.status
    if (['fake-review', 'spam', 'abusive-language', 'misleading-information', 'conflict-of-interest', 'other'].includes(req.query.reason)) filter.reason = req.query.reason
    const [reports, total] = await Promise.all([
      Report.find(filter).populate({ path: 'review', select: 'title body overallRating status createdAt author institution', populate: [{ path: 'author', select: 'name email avatarUrl' }, { path: 'institution', select: 'name slug' }] })
        .populate('reporter', 'name email avatarUrl').populate('resolution.resolvedBy', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Report.countDocuments(filter),
    ])
    return res.json({ data: reports, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function resolveReport(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Report ID is invalid.' } })
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const report = await Report.findById(req.params.id).session(session)
      if (!report) {
        const error = new Error('Report not found.')
        error.status = 404
        throw error
      }
      if (report.status !== 'open') {
        const error = new Error('This report has already been handled.')
        error.status = 409
        throw error
      }
      const { action, reason } = req.validatedBody
      if (action === 'remove-review') {
        await applyReviewModeration({ reviewId: report.review, moderatorId: req.authUser._id, action: 'remove', reason, note: reason, session })
      }
      const nextStatus = action === 'dismiss' ? 'dismissed' : 'resolved'
      const before = { status: report.status }
      report.status = nextStatus
      report.resolution = { reason, resolvedBy: req.authUser._id, resolvedAt: new Date() }
      await report.save({ session })
      const auditAction = action === 'dismiss' ? 'dismiss-report' : 'resolve-report'
      await recordAdminAction({ entityType: 'report', entityId: report._id, action: auditAction, actor: req.authUser._id, reason, before, after: { status: report.status } ,session })
      result = { id: report._id.toString(), status: report.status }
    })
    return res.json({ data: result })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}
