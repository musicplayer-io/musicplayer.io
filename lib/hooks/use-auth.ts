'use client'

import { useCallback, useMemo } from 'react'

export function useAuth() {
  const isClient = typeof window !== 'undefined'

  const isAuthenticated = useMemo(() => {
    if (!isClient) return false
    return !!localStorage.getItem('reddit_access_token')
  }, [isClient])

  const username = useMemo(() => {
    if (!isClient) return null
    return localStorage.getItem('reddit_username')
  }, [isClient])

  const login = useCallback(() => {
    if (!isClient) return

    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || 'YOUR_CLIENT_ID'
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback')
    const scope = 'identity,read,vote,submit'
    const state = Math.random().toString(36).substring(2)

    localStorage.setItem('reddit_oauth_state', state)

    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=permanent&scope=${scope}`

    window.location.href = authUrl
  }, [isClient])

  const logout = useCallback(() => {
    if (!isClient) return
    localStorage.removeItem('reddit_access_token')
    localStorage.removeItem('reddit_refresh_token')
    localStorage.removeItem('reddit_username')
    window.location.reload()
  }, [isClient])

  return {
    isAuthenticated,
    username,
    login,
    logout,
  }
}
