import mongoose from 'mongoose'
import Category from '../models/Category.js'
import { recordAdminAction } from '../services/auditLog.js'

export async function listCategories(req, res, next) {
  try {
    const filter = {}
    if (['institution', 'course'].includes(req.query.kind)) filter.kind = req.query.kind
    const categories = await Category.find(filter).sort({ kind: 1, name: 1 }).lean()
    return res.json({ data: categories })
  } catch (error) {
    return next(error)
  }
}

export async function createCategory(req, res, next) {
  try {
    const category = await Category.create(req.validatedBody)
    await recordAdminAction({ entityType: 'category', entityId: category._id, action: 'create-category', actor: req.authUser._id, after: { name: category.name, slug: category.slug, kind: category.kind } })
    return res.status(201).json({ data: category })
  } catch (error) {
    return next(error)
  }
}

export async function updateCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Category ID is invalid.' } })
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } })
    const before = { name: category.name, slug: category.slug, active: category.active }
    category.set(req.validatedBody)
    await category.save()
    await recordAdminAction({ entityType: 'category', entityId: category._id, action: 'update-category', actor: req.authUser._id, before, after: { name: category.name, slug: category.slug, active: category.active } })
    return res.json({ data: category })
  } catch (error) {
    return next(error)
  }
}

export async function deactivateCategory(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Category ID is invalid.' } })
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found.' } })
    category.active = false
    await category.save()
    await recordAdminAction({ entityType: 'category', entityId: category._id, action: 'delete-category', actor: req.authUser._id, after: { active: false } })
    return res.json({ data: { id: category._id.toString(), active: false } })
  } catch (error) {
    return next(error)
  }
}
