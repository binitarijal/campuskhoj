export function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.path}`)
  error.status = 404
  next(error)
}

export function errorHandler(error, req, res, _next) {
  let status = Number.isInteger(error.status) ? error.status : 500
  let code = 'INTERNAL_SERVER_ERROR'
  let message = 'An unexpected server error occurred.'
  let fields
  const mongoNetworkCodes = new Set(['ETIMEOUT', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'])
  const mongoCode = typeof error.code === 'string' ? error.code : error.cause?.code

  if (error.name === 'ValidationError') {
    status = 400
    code = 'VALIDATION_ERROR'
    message = 'The submitted data is invalid.'
    fields = Object.fromEntries(Object.entries(error.errors ?? {}).map(([key]) => [key, 'Invalid value.']))
  } else if (error.code === 11000) {
    status = 409
    code = 'DUPLICATE_RESOURCE'
    message = 'A record with these details already exists.'
  } else if (error.name === 'CastError') {
    status = 400
    code = 'INVALID_IDENTIFIER'
    message = 'A supplied identifier is invalid.'
  } else if (['MongooseError', 'MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError'].includes(error.name) || mongoNetworkCodes.has(mongoCode)) {
    status = 503
    code = 'DATABASE_UNAVAILABLE'
    message = 'The database is temporarily unavailable.'
  } else if (error.type === 'entity.too.large') {
    status = 413
    code = 'PAYLOAD_TOO_LARGE'
    message = 'The request body is too large.'
  } else if (error.status === 404) {
    code = 'NOT_FOUND'
    message = 'The requested route was not found.'
  } else if (error.status === 403) {
    code = 'FORBIDDEN'
    message = 'This request origin is not allowed.'
  } else if (error.status === 401) {
    code = 'UNAUTHORIZED'
    message = 'Sign-in could not be verified.'
  } else if (error.status === 429) {
    code = 'RATE_LIMITED'
    message = 'Too many sign-in attempts. Try again shortly.'
  } else if (error.status === 400) {
    code = 'BAD_REQUEST'
    message = 'The request could not be processed.'
  }

  if (typeof error.publicCode === 'string' && /^[A-Z0-9_]+$/.test(error.publicCode)) code = error.publicCode
  if (typeof error.publicMessage === 'string') message = error.publicMessage

  if (status >= 500) {
    console.error(`[api] ${req.method} ${req.path} failed (${error.name || 'Error'}).`)
  }

  res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) } })
}
