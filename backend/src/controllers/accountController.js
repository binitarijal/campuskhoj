import Favorite from '../models/Favorite.js'
import Review from '../models/Review.js'

export async function getAccountProfile(req, res, next) {
  try {
    const [reviews, favorites] = await Promise.all([
      Review.find({ author: req.authUser._id })
        .select('institution overallRating title body status createdAt updatedAt')
        .populate('institution', 'name slug logo location.city location.country')
        .sort({ createdAt: -1 })
        .lean(),
      Favorite.find({ user: req.authUser._id })
        .select('institution createdAt')
        .populate('institution', 'name slug logo location.city location.country status')
        .sort({ createdAt: -1 })
        .lean(),
    ])

    return res.json({
      data: {
        user: {
          id: req.authUser._id.toString(),
          name: req.authUser.name,
          email: req.authUser.email,
          avatarUrl: req.authUser.avatarUrl,
          role: req.authUser.role,
          createdAt: req.authUser.createdAt,
        },
        reviews: reviews.map(({ _id, institution, overallRating, title, body, status, createdAt }) => ({
          id: _id.toString(), institution, overallRating, title, body, status, createdAt,
        })),
        favorites: favorites
          .filter(({ institution }) => institution?.status === 'published')
          .map(({ _id, institution, createdAt }) => ({ id: _id.toString(), institution, createdAt })),
      },
    })
  } catch (error) {
    return next(error)
  }
}
