import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

/**
 * Fetch comments for a Reddit post
 * GET /api/reddit/comments?permalink=/r/Music/comments/abc123/song_title
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const permalink = searchParams.get('permalink')

    if (!permalink) {
      return NextResponse.json({ error: 'Missing permalink parameter' }, { status: 400 })
    }

    // Build Reddit API URL for comments - get all with no limit
    const url = `https://www.reddit.com${permalink}.json?limit=100&depth=10&sort=top`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Reddit Music Player/1.0',
      },
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()

    // Reddit returns [post, comments] array
    const commentsData = data[1]?.data?.children || []

    // Recursively parse comments and replies
    const formattedComments = parseComments(commentsData)

    return NextResponse.json({
      comments: formattedComments,
      count: formattedComments.length,
    })
  } catch (error: any) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * Recursively parse comments and their replies
 */
function parseComments(children: any[]): any[] {
  const comments: any[] = []

  for (const item of children) {
    // Skip non-comment items (like "more" links)
    if (item.kind !== 't1') continue

    const comment = item.data

    // Skip AutoModerator and deleted
    if (comment.author === 'AutoModerator' || comment.author === '[deleted]') {
      continue
    }

    const formattedComment = {
      id: comment.id,
      author: comment.author,
      body: comment.body,
      body_html: comment.body_html,
      score: comment.score,
      created_utc: comment.created_utc,
      created_ago: formatTimeAgo(comment.created_utc),
      replies: [], // Will be filled below
    }

    // Parse nested replies
    if (comment.replies && comment.replies.data && comment.replies.data.children) {
      formattedComment.replies = parseComments(comment.replies.data.children)
    }

    comments.push(formattedComment)
  }

  return comments
}

/**
 * Format timestamp to human readable time ago
 */
function formatTimeAgo(timestamp: number): string {
  const now = Date.now() / 1000
  const diff = now - timestamp

  const minutes = Math.floor(diff / 60)
  const hours = Math.floor(diff / 3600)
  const days = Math.floor(diff / 86400)
  const months = Math.floor(diff / 2592000)
  const years = Math.floor(diff / 31536000)

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  return 'just now'
}
