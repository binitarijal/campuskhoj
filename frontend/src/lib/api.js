const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...options,
    credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('campuscompass:session-expired'))
    }
    const error = new Error(payload.error?.message || 'The request could not be completed.')
    error.status = response.status
    error.code = payload.error?.code
    error.fields = payload.error?.fields
    throw error
  }
  return Object.hasOwn(payload, 'pagination')
    ? { data: payload.data, pagination: payload.pagination }
    : payload.data
}
