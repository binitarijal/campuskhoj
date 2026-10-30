import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import User from '../models/User.js'

const cookieName = 'campuscompass_session'
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
}

function unauthenticated(res) {
  res.clearCookie(cookieName, cookieOptions)
  return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } })
}

export async function requireAuth(req, res, next) {
  const token = req.cookies?.[cookieName]
  if (!token) return unauthenticated(res)

  try {
    const session = jwt.verify(token, env.SESSION_SECRET, {
      algorithms: ['HS256'],
      issuer: 'campuscompass-api',
      audience: 'campuscompass-web',
    })
    const user = await User.findById(session.sub)
    if (!user || user.status !== 'active' || (session.ver ?? 0) !== (user.sessionVersion ?? 0)) {
      return unauthenticated(res)
    }
    req.authUser = user
    return next()
  } catch (error) {
    if (['TokenExpiredError', 'JsonWebTokenError'].includes(error.name)) return unauthenticated(res)
    return next(error)
  }
}

export function requireAdmin(req, res, next) {
  if (req.authUser?.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrator access is required.' } })
  }
  return next()
}
