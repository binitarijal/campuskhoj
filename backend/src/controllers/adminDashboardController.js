import Institution from '../models/Institution.js'
import Report from '../models/Report.js'
import Review from '../models/Review.js'
import User from '../models/User.js'

function sixMonthStart() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
}

async function monthlyCounts(Model, dateField = 'createdAt') {
  return Model.aggregate([
    { $match: { [dateField]: { $gte: sixMonthStart() } } },
    { $group: { _id: { $dateTrunc: { date: `$${dateField}`, unit: 'month' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ])
}

export async function getAdminDashboard(_req, res, next) {
  try {
    const [
      totalInstitutions, schools, colleges, universities, publishedInstitutions,
      totalUsers, activeUsers, suspendedUsers, deactivatedUsers,
      totalReviews, pendingReviews, approvedReviews, rejectedReviews, flaggedReviews, hiddenReviews, removedReviews,
      openReports, ratingStats, institutionDistribution,
      recentUsers, recentReviews, recentInstitutions, userTrends, reviewTrends,
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ type: 'School' }),
      Institution.countDocuments({ type: 'College' }),
      Institution.countDocuments({ type: 'University' }),
      Institution.countDocuments({ status: 'published' }),
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'deactivated' }),
      Review.countDocuments(),
      Review.countDocuments({ status: 'pending' }),
      Review.countDocuments({ status: 'approved' }),
      Review.countDocuments({ status: 'rejected' }),
      Review.countDocuments({ status: 'flagged' }),
      Review.countDocuments({ status: 'hidden' }),
      Review.countDocuments({ status: 'removed' }),
      Report.countDocuments({ status: 'open' }),
      Institution.aggregate([{ $match: { status: 'published', ratingCount: { $gt: 0 } } }, { $group: { _id: null, average: { $avg: '$ratingAverage' } } }]),
      Institution.aggregate([{ $match: { status: 'published' } }, { $group: { _id: '$type', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      User.find().select('name email avatarUrl role status createdAt lastLoginAt').sort({ createdAt: -1 }).limit(6).lean(),
      Review.find().select('title overallRating status createdAt').populate('author', 'name avatarUrl').populate('institution', 'name slug').sort({ createdAt: -1 }).limit(6).lean(),
      Institution.find().select('name slug type status createdAt logo location.city location.country').sort({ createdAt: -1 }).limit(6).lean(),
      monthlyCounts(User), monthlyCounts(Review),
    ])

    const padTrend = (rows) => {
      const byMonth = new Map(rows.map(({ _id, count }) => [new Date(_id).toISOString().slice(0, 7), count]))
      const start = sixMonthStart()
      return Array.from({ length: 6 }, (_, index) => {
        const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1))
        const key = date.toISOString().slice(0, 7)
        return { month: key, count: byMonth.get(key) || 0 }
      })
    }

    return res.json({
      data: {
        stats: {
          totalInstitutions, schools, colleges, universities, collegesAndUniversities: colleges + universities, publishedInstitutions,
          totalUsers, activeUsers, suspendedUsers, deactivatedUsers, totalReviews, pendingReviews,
          approvedReviews, rejectedReviews, flaggedReviews, hiddenReviews, removedReviews, openReports,
          averageInstitutionRating: Number((ratingStats[0]?.average || 0).toFixed(2)),
        },
        institutionDistribution: institutionDistribution.map(({ _id, count }) => ({ type: _id, count })),
        moderation: [
          { status: 'pending', count: pendingReviews }, { status: 'approved', count: approvedReviews },
          { status: 'rejected', count: rejectedReviews }, { status: 'flagged', count: flaggedReviews },
          { status: 'hidden', count: hiddenReviews }, { status: 'removed', count: removedReviews },
        ],
        trends: { users: padTrend(userTrends), reviews: padTrend(reviewTrends) },
        recentUsers, recentReviews, recentInstitutions,
      },
    })
  } catch (error) {
    return next(error)
  }
}
