import { OAuth2Client } from 'google-auth-library'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { databaseIsConnected } from '../config/database.js'
import { env } from '../config/env.js'
import User from '../models/User.js'

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID)
const cookieName = 'campuscompass_session'
const sessionMaxAge = 7 * 24 * 60 * 60 * 1000

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: sessionMaxAge,
  }
}

function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function createSession(user) {
  return jwt.sign({ sub: user._id.toString(), ver: user.sessionVersion ?? 0 }, env.SESSION_SECRET, {
    algorithm: 'HS256',
    issuer: 'campuscompass-api',
    audience: 'campuscompass-web',
    expiresIn: '7d',
  })
}

export async function signInWithGoogle(req, res, next) {
  const requestId = randomUUID()
  let stage = 'A request received'
  console.info(`[auth.google ${requestId}] A Google authentication request received.`)

  try {
    const credential = req.body?.credential
    if (typeof credential !== 'string' || credential.length > 10_000) {
      return res.status(400).json({ error: { code: 'INVALID_CREDENTIAL', message: 'A Google credential is required.' } })
    }
    stage = 'B Google credential received'
    console.info(`[auth.google ${requestId}] B Google ID token received (value omitted).`)

    let ticket
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      })
    } catch (error) {
      console.warn(`[auth.google ${requestId}] C Google ID token verification failed (${error.name || 'Error'}).`)
      return res.status(401).json({ error: { code: 'INVALID_GOOGLE_CREDENTIAL', message: 'Google sign-in could not be verified. Please try again.' } })
    }
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      console.warn(`[auth.google ${requestId}] C Google token did not contain a verified account.`)
      return res.status(401).json({ error: { code: 'UNVERIFIED_GOOGLE_ACCOUNT', message: 'Google could not verify this account.' } })
    }
    stage = 'C Google token verified'
    console.info(`[auth.google ${requestId}] C Google ID token verified.`)

    stage = 'D MongoDB user lookup'
    if (!databaseIsConnected()) {
      console.error(`[auth.google ${requestId}] D MongoDB is disconnected; user lookup skipped.`)
      return res.status(503).json({ error: { code: 'DATABASE_UNAVAILABLE', message: 'Sign-in is temporarily unavailable. Please try again shortly.' } })
    }
    let user = await User.findOne({ googleSub: payload.sub })
    console.info(`[auth.google ${requestId}] D MongoDB user lookup completed (match=${Boolean(user)}).`)
    if (user && user.status !== 'active') {
      return res.status(403).json({ error: { code: 'ACCOUNT_UNAVAILABLE', message: 'This account cannot sign in.' } })
    }

    const accountAction = user ? 'retrieved' : 'created'
    if (!user) {
      user = new User({
        googleSub: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatarUrl: payload.picture,
        lastLoginAt: new Date(),
      })
    } else {
      user.name = payload.name || user.name
      user.avatarUrl = payload.picture || user.avatarUrl
      user.lastLoginAt = new Date()
    }
    stage = 'E user persistence'
    await user.save()
    console.info(`[auth.google ${requestId}] E User ${accountAction}.`)

    res.cookie(cookieName, createSession(user), sessionCookieOptions())
    stage = 'F session established'
    console.info(`[auth.google ${requestId}] F HTTP-only session established.`)
    return res.status(200).json({ data: { user: toPublicUser(user) } })
  } catch (error) {
    const safeCode = typeof error.code === 'string' && /^[A-Z0-9_]+$/.test(error.code) ? `; code=${error.code}` : ''
    console.error(`[auth.google ${requestId}] Failed at ${stage} (${error.name || 'Error'}${safeCode}).`)
    if (error.code === 11000) {
      return res.status(409).json({ error: { code: 'ACCOUNT_CONFLICT', message: 'This Google account cannot be linked automatically.' } })
    }
    return next(error)
  }
}

export async function getCurrentUser(req, res) {
  return res.json({ data: { user: toPublicUser(req.authUser) } })
}

export async function signOut(req, res, next) {
  try {
    const token = req.cookies?.[cookieName]
    if (token) {
      try {
        const session = jwt.verify(token, env.SESSION_SECRET, {
          algorithms: ['HS256'], issuer: 'campuscompass-api', audience: 'campuscompass-web',
        })
        await User.updateOne({ _id: session.sub }, { $inc: { sessionVersion: 1 } })
      } catch (error) {
        if (!['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) throw error
      }
    }
    res.clearCookie(cookieName, sessionCookieOptions())
    return res.json({ data: { loggedOut: true } })
  } catch (error) {
    return next(error)
  }
}
