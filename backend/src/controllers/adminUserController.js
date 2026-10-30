import mongoose from 'mongoose'
import AdminRoster from '../models/AdminRoster.js'
import ModerationLog from '../models/ModerationLog.js'
import Review from '../models/Review.js'
import User from '../models/User.js'
import { recordAdminAction } from '../services/auditLog.js'

const pageOptions = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}
const escapeRegex = (value) => String(value).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

async function lockAdminRoster(session, rosterId) {
  const update = await AdminRoster.updateOne({ _id: rosterId }, { $inc: { revision: 1 } }, { session })
  if (!update.matchedCount) {
    const error = new Error('Administrator state could not be verified.')
    error.status = 503
    throw error
  }
}

export async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query)
    const filter = {}
    if (['user', 'admin'].includes(req.query.role)) filter.role = req.query.role
    if (['active', 'suspended', 'deactivated'].includes(req.query.status)) filter.status = req.query.status
    if (req.query.q) {
      const term = new RegExp(escapeRegex(req.query.q), 'i')
      filter.$or = [{ name: term }, { email: term }]
    }
    const [users, total] = await Promise.all([
      User.find(filter).select('name email avatarUrl role status createdAt lastLoginAt deactivatedAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ])
    const ids = users.map((user) => user._id)
    const reviewCounts = await Review.aggregate([{ $match: { author: { $in: ids } } }, { $group: { _id: '$author', count: { $sum: 1 } } }])
    const countMap = new Map(reviewCounts.map(({ _id, count }) => [_id.toString(), count]))
    return res.json({ data: users.map((user) => ({ ...user, reviewCount: countMap.get(user._id.toString()) || 0 })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function getUser(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'User ID is invalid.' } })
    const user = await User.findById(req.params.id).select('name email avatarUrl role status createdAt lastLoginAt deactivatedAt').lean()
    if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found.' } })
    const reviews = await Review.find({ author: user._id }).select('institution title overallRating status createdAt updatedAt')
      .populate('institution', 'name slug status').sort({ createdAt: -1 }).limit(100).lean()
    return res.json({ data: { user, reviews } })
  } catch (error) {
    return next(error)
  }
}

export async function changeUserStatus(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'User ID is invalid.' } })
  if (req.params.id === req.authUser._id.toString()) return res.status(409).json({ error: { code: 'SELF_CHANGE_BLOCKED', message: 'Administrators cannot suspend, deactivate, or remove their own account here.' } })
  const roster = await AdminRoster.findOneAndUpdate({ key: 'admin-roster' }, { $setOnInsert: { key: 'admin-roster', revision: 0 } }, { upsert: true, new: true })
  const session = await mongoose.startSession()
  try {
    let changed
    await session.withTransaction(async () => {
      await lockAdminRoster(session, roster._id)
      const user = await User.findById(req.params.id).session(session)
      if (!user) {
        const error = new Error('User not found.')
        error.status = 404
        throw error
      }
      const nextStatus = req.validatedBody.status
      if (user.status === nextStatus) {
        const error = new Error('The account already has that status.')
        error.status = 409
        throw error
      }
      if (user.role === 'admin' && user.status === 'active' && nextStatus !== 'active') {
        const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' }).session(session)
        if (activeAdmins <= 1) {
          const error = new Error('The last active administrator cannot be suspended or deactivated.')
          error.status = 409
          throw error
        }
      }
      const before = { status: user.status }
      user.status = nextStatus
      user.sessionVersion += 1
      user.deactivatedAt = nextStatus === 'deactivated' ? new Date() : undefined
      await user.save({ session })
      const action = nextStatus === 'active' ? 'activate-user' : nextStatus === 'suspended' ? 'suspend-user' : 'deactivate-user'
      await recordAdminAction({ entityType: 'user', entityId: user._id, action, actor: req.authUser._id, before, after: { status: user.status } ,session })
      changed = { id: user._id.toString(), status: user.status, role: user.role }
    })
    return res.json({ data: changed })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function changeUserRole(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'User ID is invalid.' } })
  if (req.params.id === req.authUser._id.toString() && req.validatedBody.role !== 'admin') return res.status(409).json({ error: { code: 'SELF_CHANGE_BLOCKED', message: 'Administrators cannot remove their own administrator role here.' } })
  const roster = await AdminRoster.findOneAndUpdate({ key: 'admin-roster' }, { $setOnInsert: { key: 'admin-roster', revision: 0 } }, { upsert: true, new: true })
  const session = await mongoose.startSession()
  try {
    let changed
    await session.withTransaction(async () => {
      await lockAdminRoster(session, roster._id)
      const user = await User.findById(req.params.id).session(session)
      if (!user) {
        const error = new Error('User not found.')
        error.status = 404
        throw error
      }
      const nextRole = req.validatedBody.role
      if (user.role === nextRole) {
        const error = new Error('The account already has that role.')
        error.status = 409
        throw error
      }
      if (user.role === 'admin' && user.status === 'active' && nextRole !== 'admin') {
        const activeAdmins = await User.countDocuments({ role: 'admin', status: 'active' }).session(session)
        if (activeAdmins <= 1) {
          const error = new Error('The last active administrator cannot be demoted.')
          error.status = 409
          throw error
        }
      }
      const before = { role: user.role }
      user.role = nextRole
      user.sessionVersion += 1
      await user.save({ session })
      await recordAdminAction({ entityType: 'user', entityId: user._id, action: 'change-role', actor: req.authUser._id, before, after: { role: user.role } ,session })
      changed = { id: user._id.toString(), status: user.status, role: user.role }
    })
    return res.json({ data: changed })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function listAdminActivity(req, res, next) {
  try {
    const { page, limit, skip } = pageOptions(req.query)
    const filter = {}
    if (['review', 'institution', 'user', 'report', 'category'].includes(req.query.entityType)) filter.entityType = req.query.entityType
    const [logs, total] = await Promise.all([
      ModerationLog.find(filter).populate('actor', 'name email avatarUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ModerationLog.countDocuments(filter),
    ])
    return res.json({ data: logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}
