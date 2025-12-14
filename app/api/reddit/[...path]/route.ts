import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 minute

/**
 * Reddit API Proxy
 * GET /api/reddit/r/:subreddit/:sort
 * GET /api/reddit/search
 */
export async function GET(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  try {
    // Parse path
    const pathParts = pathname.split('/api/reddit/')[1]?.split('/') || []

    let redditUrl: string

    // Handle search
    if (pathParts[0] === 'search') {
      const query = searchParams.get('q')
      if (!query) {
        return NextResponse.json({ error: { message: 'Missing search query' } }, { status: 400 })
      }

      const params = new URLSearchParams({
        q: query,
        limit: searchParams.get('limit') || '100',
        sort: searchParams.get('sort') || 'relevance',
        t: searchParams.get('t') || 'all',
      })

      if (searchParams.has('after')) {
        params.append('after', searchParams.get('after')!)
      }

      redditUrl = `https://www.reddit.com/search.json?${params}`
    }
    // Handle subreddit listing
    else if (pathParts[0] === 'r') {
      const subreddit = pathParts[1]
      const sort = pathParts[2] || 'hot'

      if (!subreddit) {
        return NextResponse.json({ error: { message: 'Missing subreddit' } }, { status: 400 })
      }

      const params = new URLSearchParams({
        limit: searchParams.get('limit') || '100',
      })

      if (sort === 'top' && searchParams.has('t')) {
        params.append('t', searchParams.get('t')!)
      }

      if (searchParams.has('after')) {
        params.append('after', searchParams.get('after')!)
      }

      redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?${params}`
    } else {
      return NextResponse.json({ error: { message: 'Invalid API route' } }, { status: 400 })
    }

    // Check cache
    const cached = cache.get(redditUrl)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      })
    }

    // Fetch from Reddit with retries
    let response: Response | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }

        response = await fetch(redditUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json',
          },
          next: { revalidate: 60 }, // Next.js cache
        })

        if (response.ok) break
        if (response.status !== 403 || attempt === 2) break
      } catch (error) {
        if (attempt === 2) throw error
      }
    }

    if (!response || !response.ok) {
      const errorText = await response?.text()
      console.error('Reddit API error:', response?.status, errorText)

      return NextResponse.json(
        {
          error: {
            message: 'Failed to fetch from Reddit',
            status: response?.status,
          },
        },
        { status: response?.status || 500 }
      )
    }

    const data = await response.json()

    // Validate response
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: { message: 'Invalid Reddit response' } }, { status: 500 })
    }

    // Cache response
    cache.set(redditUrl, { data, timestamp: Date.now() })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (error: any) {
    console.error('Reddit API error:', error)

    return NextResponse.json(
      {
        error: {
          message: error.message || 'Internal server error',
          type: error.name || 'Error',
        },
      },
      { status: 500 }
    )
  }
}
