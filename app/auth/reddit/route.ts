import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * Exchange Reddit authorization code for access token
 * POST /api/auth/reddit
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
    }

    const clientId = process.env.REDDIT_CLIENT_ID || 'YOUR_CLIENT_ID'
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || 'YOUR_CLIENT_SECRET'
    const redirectUri = process.env.NEXT_PUBLIC_SITE_URL + '/auth/callback'

    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'User-Agent': 'Reddit Music Player/1.0',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      throw new Error(tokenData.error)
    }

    // Get user info
    const userResponse = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Reddit Music Player/1.0',
      },
    })

    const userData = await userResponse.json()

    return NextResponse.json({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      username: userData.name,
    })
  } catch (error: any) {
    console.error('Reddit auth error:', error)
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 })
  }
}
