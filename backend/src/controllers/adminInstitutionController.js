import mongoose from 'mongoose'
import Favorite from '../models/Favorite.js'
import Institution from '../models/Institution.js'
import Review from '../models/Review.js'
import { recordAdminAction } from '../services/auditLog.js'

const objectId = (value) => mongoose.isValidObjectId(value)
const listPage = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20))
  return { page, limit, skip: (page - 1) * limit }
}
const safeRegex = (text) => String(text).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function listAdminInstitutions(req, res, next) {
  try {
    const { page, limit, skip } = listPage(req.query)
    const filter = {}
    if (['School', 'College', 'University'].includes(req.query.type)) filter.type = req.query.type
    if (['draft', 'published', 'archived'].includes(req.query.status)) filter.status = req.query.status
    if (req.query.country) filter['location.country'] = String(req.query.country).slice(0, 100)
    if (req.query.city) filter['location.city'] = String(req.query.city).slice(0, 100)
    if (req.query.q) {
      const term = new RegExp(safeRegex(req.query.q), 'i')
      filter.$or = [{ name: term }, { slug: term }, { 'location.city': term }]
    }
    const sortOptions = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 }, rating: { ratingAverage: -1 } }
    const sort = sortOptions[req.query.sort] || sortOptions.newest
    const [items, total] = await Promise.all([
      Institution.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Institution.countDocuments(filter),
    ])
    return res.json({ data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (error) {
    return next(error)
  }
}

export async function createInstitution(req, res, next) {
  const session = await mongoose.startSession()
  try {
    let created
    await session.withTransaction(async () => {
      const institution = new Institution({ ...req.validatedBody, status: 'draft' })
      await institution.save({ session })
      await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: 'create-institution', actor: req.authUser._id, reason: 'Created draft institution.', after: { name: institution.name, slug: institution.slug, status: institution.status }, session })
      created = institution.toObject()
    })
    return res.status(201).json({ data: created })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function getAdminInstitution(req, res, next) {
  try {
    if (!objectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
    const institution = await Institution.findById(req.params.id).lean()
    if (!institution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution not found.' } })
    return res.json({ data: institution })
  } catch (error) {
    return next(error)
  }
}

export async function updateInstitution(req, res, next) {
  if (!objectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
  const session = await mongoose.startSession()
  try {
    let updated
    await session.withTransaction(async () => {
      const institution = await Institution.findById(req.params.id).session(session)
      if (!institution) {
        const error = new Error('Institution not found.')
        error.status = 404
        throw error
      }
      const before = { name: institution.name, slug: institution.slug, status: institution.status, verificationStatus: institution.verificationStatus }
      institution.set(req.validatedBody)
      await institution.save({ session, runValidators: true })
      await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: 'edit', actor: req.authUser._id, before, after: { name: institution.name, slug: institution.slug, status: institution.status, verificationStatus: institution.verificationStatus }, session })
      updated = institution.toObject()
    })
    return res.json({ data: updated })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function setInstitutionStatus(req, res, next) {
  const transitions = { publish: ['published', 'publish'], unpublish: ['draft', 'unpublish'], archive: ['archived', 'archive'] }
  const transition = transitions[req.params.action]
  if (!transition) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Institution action not found.' } })
  if (!objectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const institution = await Institution.findById(req.params.id).session(session)
      if (!institution) {
        const error = new Error('Institution not found.')
        error.status = 404
        throw error
      }
      if (req.params.action === 'publish' && (institution.description?.trim().length < 40 || !institution.courses.some((course) => course.isPublic !== false))) {
        const error = new Error('Add a detailed description and at least one visible course before publishing.')
        error.status = 400
        error.publicCode = 'PUBLISH_REQUIREMENTS_NOT_MET'
        error.publicMessage = 'To publish this institution, add a description with at least 40 characters and at least one public course, then save your changes.'
        throw error
      }
      const before = institution.status
      if (before === transition[0]) {
        const error = new Error('Institution already has that status.')
        error.status = 409
        throw error
      }
      institution.status = transition[0]
      await institution.save({ session })
      await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: transition[1], actor: req.authUser._id, before: { status: before }, after: { status: institution.status } ,session })
      result = institution.toObject()
    })
    return res.json({ data: result })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

export async function deleteInstitution(req, res, next) {
  if (req.query.confirm !== 'true') return res.status(400).json({ error: { code: 'CONFIRMATION_REQUIRED', message: 'Confirm institution deletion before retrying.' } })
  if (!objectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const institution = await Institution.findById(req.params.id).session(session)
      if (!institution) {
        const error = new Error('Institution not found.')
        error.status = 404
        throw error
      }
      const reviewCount = await Review.countDocuments({ institution: institution._id }).session(session)
      const favoriteCount = await Favorite.countDocuments({ institution: institution._id }).session(session)
      if (reviewCount || favoriteCount) {
        const error = new Error('This institution has associated reviews or saved records. Archive it instead of deleting it.')
        error.status = 409
        throw error
      }
      await recordAdminAction({ entityType: 'institution', entityId: institution._id, action: 'delete-institution', actor: req.authUser._id, before: { name: institution.name, slug: institution.slug, status: institution.status }, session })
      await Institution.deleteOne({ _id: institution._id }, { session })
    })
    return res.json({ data: { deleted: true } })
  } catch (error) {
    return next(error)
  } finally {
    await session.endSession()
  }
}

