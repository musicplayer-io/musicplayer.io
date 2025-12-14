'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing login...')

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const error = searchParams.get('error')

      // Check for errors
      if (error) {
        setStatus(`Login failed: ${error}`)
        setTimeout(() => router.push('/'), 3000)
        return
      }

      // Verify state
      const savedState = localStorage.getItem('reddit_oauth_state')
      if (state !== savedState) {
        setStatus('Security check failed. Please try again.')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      if (!code) {
        setStatus('No authorization code received')
        setTimeout(() => router.push('/'), 3000)
        return
      }

      try {
        // Exchange code for access token
        const response = await fetch('/api/auth/reddit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        // Save tokens
        localStorage.setItem('reddit_access_token', data.access_token)
        localStorage.setItem('reddit_refresh_token', data.refresh_token)
        localStorage.setItem('reddit_username', data.username)

        setStatus('Login successful! Redirecting...')
        setTimeout(() => router.push('/'), 1000)
      } catch (error: any) {
        setStatus(`Login failed: ${error.message}`)
        setTimeout(() => router.push('/'), 3000)
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-medium">{status}</p>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
}
