import Category from '../models/Category.js'

export async function listPublicCategories(req, res, next) {
  try {
    const filter = { active: true }
    if (req.query.kind !== undefined) {
      if (!['institution', 'course'].includes(req.query.kind)) {
        return res.status(400).json({ error: { code: 'INVALID_CATEGORY_KIND', message: 'Category kind must be institution or course.' } })
      }
      filter.kind = req.query.kind
    }
    const categories = await Category.find(filter)
      .select('_id name slug kind description')
      .sort({ kind: 1, name: 1 })
      .limit(200)
      .lean()
    return res.json({ data: categories })
  } catch (error) {
    return next(error)
  }
}
