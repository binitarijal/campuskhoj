import mongoose from 'mongoose'
import Favorite from '../models/Favorite.js'
import Institution from '../models/Institution.js'

export async function listFavorites(req, res, next) {
  try {
    const favorites = await Favorite.find({ user: req.authUser._id }).select('institution createdAt')
      .populate({ path: 'institution', match: { status: 'published' }, select: 'name slug type logo coverImage location ratingAverage ratingCount' })
      .sort({ createdAt: -1 }).lean()
    return res.json({ data: favorites.filter((favorite) => favorite.institution) })
  } catch (error) {
    return next(error)
  }
}

export async function addFavorite(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.institutionId)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
    const institution = await Institution.findOne({ _id: req.params.institutionId, status: 'published' }).select('_id')
    if (!institution) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Published institution not found.' } })
    const favorite = await Favorite.create({ user: req.authUser._id, institution: institution._id })
    return res.status(201).json({ data: { id: favorite._id.toString(), institutionId: institution._id.toString() } })
  } catch (error) {
    return next(error)
  }
}

export async function removeFavorite(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.institutionId)) return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Institution ID is invalid.' } })
    await Favorite.deleteOne({ user: req.authUser._id, institution: req.params.institutionId })
    return res.json({ data: { removed: true } })
  } catch (error) {
    return next(error)
  }
}
