import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import app from '../app.js'
import { env } from '../config/env.js'
import { AdminRoster, Category, Favorite, Institution, ModerationLog, Report, Review, User } from '../models/index.js'

const testDatabase = `campuscompass_test_${randomUUID().replaceAll('-', '').slice(0, 18)}`
const cookieName = 'campuscompass_session'
let server
let baseUrl

function makeCookie(user) {
  const token = jwt.sign({ sub: user._id.toString(), ver: user.sessionVersion || 0 }, env.SESSION_SECRET, {
    algorithm: 'HS256', issuer: 'campuscompass-api', audience: 'campuscompass-web', expiresIn: '15m',
  })
  return `${cookieName}=${token}`
}

async function jsonRequest(path, { cookie, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...options.headers },
  })
  return { response, body: await response.json().catch(() => ({})) }
}

async function createUser(role = 'user') {
  return User.create({
    googleSub: `test-${randomUUID()}`,
    email: `${randomUUID()}@example.test`,
    name: role === 'admin' ? 'Test Administrator' : 'Test Member',
    role,
    status: 'active',
  })
}

before(async () => {
  await mongoose.connect(env.MONGODB_URI, { dbName: testDatabase, serverSelectionTimeoutMS: 12000 })
  await Promise.all([User.init(), Institution.init(), Review.init(), Favorite.init(), Report.init(), ModerationLog.init(), Category.init(), AdminRoster.init()])
  server = app.listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}/api`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

test('moderation visibility, rating updates, admin gates, user revocation, and reports', async () => {
  const admin = await createUser('admin')
  const author = await createUser()
  const reporter = await createUser()
  const adminCookie = makeCookie(admin)
  let authorCookie = makeCookie(author)
  const reporterCookie = makeCookie(reporter)
  const institution = await Institution.create({
    name: 'Integration Test University', slug: `integration-${randomUUID().slice(0, 8)}`, type: 'University',
    status: 'published', description: 'A sufficiently detailed test institution used only in an isolated test database.',
    location: { country: 'Testland', city: 'Test City' },
    courses: [{ name: 'Computer Science', isPublic: true }],
  })

  const denied = await jsonRequest('/admin/dashboard')
  assert.equal(denied.response.status, 401)
  const userDenied = await jsonRequest('/admin/dashboard', { cookie: authorCookie })
  assert.equal(userDenied.response.status, 403)
  const dashboard = await jsonRequest('/admin/dashboard', { cookie: adminCookie })
  assert.equal(dashboard.response.status, 200)

  const submitted = await jsonRequest('/reviews', {
    cookie: authorCookie, method: 'POST',
    body: JSON.stringify({
      institutionId: institution._id.toString(), overallRating: 5,
      categoryRatings: { academicQuality: 5, faculty: 4 },
      title: 'A thoughtful test review', body: 'This integration test review contains enough text to pass the minimum length validator.',
      pros: 'Helpful instructors', cons: 'Busy parking areas',
    }),
  })
  assert.equal(submitted.response.status, 201)
  assert.equal(submitted.body.data.status, 'pending')
  const reviewId = submitted.body.data.id

  const publicPending = await jsonRequest(`/institutions/${institution.slug}/reviews`)
  assert.equal(publicPending.response.status, 200)
  assert.equal(publicPending.body.data.length, 0)
  const institutionBefore = await Institution.findById(institution._id).lean()
  assert.equal(institutionBefore.ratingCount, 0)

  const approval = await jsonRequest(`/admin/reviews/${reviewId}/moderation`, {
    cookie: adminCookie, method: 'POST', body: JSON.stringify({ action: 'approve' }),
  })
  assert.equal(approval.response.status, 200)
  assert.equal(approval.body.data.status, 'approved')
  assert.equal(approval.body.data.ratings.ratingCount, 1)

  const duplicateApproval = await jsonRequest(`/admin/reviews/${reviewId}/moderation`, {
    cookie: adminCookie, method: 'POST', body: JSON.stringify({ action: 'approve' }),
  })
  assert.equal(duplicateApproval.response.status, 409)
  const publicApproved = await jsonRequest(`/institutions/${institution.slug}/reviews`)
  assert.equal(publicApproved.body.data.length, 1)
  assert.equal(publicApproved.body.data[0].status, undefined)
  assert.equal(publicApproved.body.data[0].moderation, undefined)
  const institutionAfterApproval = await Institution.findById(institution._id).lean()
  assert.equal(institutionAfterApproval.ratingCount, 1)
  assert.equal(institutionAfterApproval.ratingAverage, 5)

  const report = await jsonRequest('/reports', {
    cookie: reporterCookie, method: 'POST',
    body: JSON.stringify({ reviewId, reason: 'misleading-information', details: 'Test report details.' }),
  })
  assert.equal(report.response.status, 201)
  const duplicateReport = await jsonRequest('/reports', {
    cookie: reporterCookie, method: 'POST',
    body: JSON.stringify({ reviewId, reason: 'spam' }),
  })
  assert.equal(duplicateReport.response.status, 409)
  const dismissReport = await jsonRequest(`/admin/reports/${report.body.data.id}/resolve`, {
    cookie: adminCookie, method: 'POST', body: JSON.stringify({ action: 'dismiss', reason: 'Test report reviewed.' }),
  })
  assert.equal(dismissReport.response.status, 200)

  const hideReview = await jsonRequest(`/admin/reviews/${reviewId}/moderation`, {
    cookie: adminCookie, method: 'POST', body: JSON.stringify({ action: 'hide', reason: 'Test approved review removal from public listing.' }),
  })
  assert.equal(hideReview.response.status, 200)
  const publicHidden = await jsonRequest(`/institutions/${institution.slug}/reviews`)
  assert.equal(publicHidden.body.data.length, 0)
  const institutionAfterHide = await Institution.findById(institution._id).lean()
  assert.equal(institutionAfterHide.ratingCount, 0)
  assert.equal(institutionAfterHide.ratingAverage, 0)

  const suspend = await jsonRequest(`/admin/users/${author._id}/status`, {
    cookie: adminCookie, method: 'PATCH', body: JSON.stringify({ status: 'suspended' }),
  })
  assert.equal(suspend.response.status, 200)
  const revokedSession = await jsonRequest('/auth/me', { cookie: authorCookie })
  assert.equal(revokedSession.response.status, 401)
  authorCookie = makeCookie({ ...author.toObject(), status: 'active', sessionVersion: 1 })
  const suspendedWithFreshToken = await jsonRequest('/auth/me', { cookie: authorCookie })
  assert.equal(suspendedWithFreshToken.response.status, 401)
  const reactivate = await jsonRequest(`/admin/users/${author._id}/status`, {
    cookie: adminCookie, method: 'PATCH', body: JSON.stringify({ status: 'active' }),
  })
  assert.equal(reactivate.response.status, 200)
  const oldSessionAfterReactivation = await jsonRequest('/auth/me', { cookie: authorCookie })
  assert.equal(oldSessionAfterReactivation.response.status, 401)

  const logs = await ModerationLog.find({ entityType: 'review', entityId: reviewId })
  assert.equal(logs.length, 2)
})
