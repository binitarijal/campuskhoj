import Institution from '../models/Institution.js'
import Review from '../models/Review.js'

export async function refreshInstitutionRatings(institutionId, session) {
  let aggregation = Review.aggregate([
    { $match: { institution: institutionId, status: 'approved' } },
    { $facet: {
      overall: [{ $group: { _id: null, average: { $avg: '$overallRating' }, count: { $sum: 1 } } }],
      categories: [
        { $project: { categories: { $objectToArray: { $ifNull: ['$categoryRatings', {}] } } } },
        { $unwind: '$categories' },
        { $group: { _id: '$categories.k', average: { $avg: '$categories.v' } } },
      ],
    } },
  ])
  if (session) aggregation = aggregation.session(session)
  const [result = { overall: [], categories: [] }] = await aggregation
  const overall = result.overall[0]
  const categoryAverages = Object.fromEntries(result.categories.map(({ _id, average }) => [_id, Number(average.toFixed(2))]))
  const update = await Institution.updateOne({ _id: institutionId }, {
    $set: {
      ratingAverage: overall ? Number(overall.average.toFixed(2)) : 0,
      ratingCount: overall?.count || 0,
      categoryAverages,
    },
  }, { session, runValidators: true })
  if (!update.matchedCount) {
    const error = new Error('The institution for this review no longer exists.')
    error.status = 409
    throw error
  }
  return { ratingAverage: overall ? Number(overall.average.toFixed(2)) : 0, ratingCount: overall?.count || 0, categoryAverages }
}
