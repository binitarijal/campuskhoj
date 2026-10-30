export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const fields = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.') || 'body', issue.message]))
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the highlighted fields.', fields } })
    }
    req.validatedBody = result.data
    return next()
  }
}
