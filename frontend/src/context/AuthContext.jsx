import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { AuthContext } from './authContext'

let initialUserRequest

function loadCurrentUser() {
  if (!initialUserRequest) {
    initialUserRequest = apiRequest('/auth/me').then((data) => data.user).catch((error) => {
      if (error.status === 401) return null
      throw error
    }).finally(() => { initialUserRequest = undefined })
  }
  return initialUserRequest
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshUser = useCallback(async () => {
    setIsLoading(true)
    setAuthError('')
    try {
      const currentUser = await loadCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch (error) {
      setAuthError(error.message || 'Could not verify your session.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    const handleSessionExpired = () => setUser(null)
    window.addEventListener('campuscompass:session-expired', handleSessionExpired)
    loadCurrentUser().then((currentUser) => { if (active) setUser(currentUser) }).catch((error) => {
      if (active) setAuthError(error.message || 'Could not verify your session.')
    }).finally(() => { if (active) setIsLoading(false) })
    return () => {
      active = false
      window.removeEventListener('campuscompass:session-expired', handleSessionExpired)
    }
  }, [])

  const login = useCallback(async (credential) => {
    setIsLoading(true)
    setAuthError('')
    try {
      await apiRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) })
      const currentUser = await apiRequest('/auth/me').then((data) => data.user)
      setUser(currentUser)
      return currentUser
    } catch (error) {
      setAuthError(error.message || 'Sign-in failed.')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await apiRequest('/auth/logout', { method: 'POST' })
    setUser(null)
    setAuthError('')
  }, [])

  const value = useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    login,
    logout,
    refreshUser,
  }), [user, isLoading, authError, login, logout, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
