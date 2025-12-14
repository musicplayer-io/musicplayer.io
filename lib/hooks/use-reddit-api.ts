import { useRef, useCallback } from 'react'
import { usePlayerStore } from '@/lib/store/player-store'
import { parseSong, filterPlayableSongs } from '@/lib/utils/song-utils'
import type { Song } from '@/lib/store/player-store'

// ============================================================================
// REDDIT API HOOK
// ============================================================================

export function useRedditAPI() {
  const abortControllerRef = useRef<AbortController | null>(null)
  const storeRef = useRef(usePlayerStore.getState())

  // Keep store ref updated
  usePlayerStore.subscribe(state => {
    storeRef.current = state
  })

  /**
   * Fetch songs from Reddit
   */
  const fetchSongs = useCallback(async (pagination?: string) => {
    const state = storeRef.current

    // Use search if query exists
    if (state.searchQuery) {
      return fetchSearch(state.searchQuery, pagination)
    }

    // Use selected subreddits or default to listentothis
    const subreddits =
      state.selectedSubreddits.length > 0 ? state.selectedSubreddits : ['listentothis']

    return fetchFromSubreddits(subreddits, pagination)
  }, [])

  /**
   * Fetch from subreddits
   */
  const fetchFromSubreddits = useCallback(async (subreddits: string[], pagination?: string) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const state = storeRef.current
    state.setLoading(true)

    try {
      const subredditString = subreddits.join('+')
      const params = new URLSearchParams({
        limit: '100',
      })

      if (state.sortMethod === 'top') {
        params.append('t', state.topPeriod)
      }

      if (pagination) {
        params.append('after', pagination)
      }

      const url = `/api/reddit/r/${subredditString}/${state.sortMethod}?${params}`

      const response = await fetch(url, {
        signal: controller.signal,
      })

      if (controller.signal.aborted) return []
      if (!response.ok) throw new Error('Failed to fetch from Reddit')

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Reddit API error')
      }

      if (!data?.data?.children) {
        console.warn('Unexpected API response structure')
        return []
      }

      // Filter and parse songs
      const filtered = filterPlayableSongs(data.data.children)
      const songs = filtered.map((item: any) => parseSong(item.data))

      // Update store
      if (pagination) {
        state.addSongs(songs)
      } else {
        state.setSongs(songs)
      }

      state.setAfter(data.data.after || null)

      return songs
    } catch (error: any) {
      if (error.name === 'AbortError') return []
      console.error('Error fetching from Reddit:', error)
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [])

  /**
   * Search Reddit
   */
  const fetchSearch = useCallback(async (query: string, pagination?: string) => {
    if (!query?.trim()) return []

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const state = storeRef.current
    state.setLoading(true)

    try {
      const params = new URLSearchParams({
        q: query,
        limit: '100',
        sort: state.sortMethod,
      })

      if (state.sortMethod === 'top') {
        params.append('t', state.topPeriod)
      }

      if (pagination) {
        params.append('after', pagination)
      }

      const url = `/api/reddit/search?${params}`

      const response = await fetch(url, {
        signal: controller.signal,
      })

      if (controller.signal.aborted) return []
      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Search error')
      }

      if (!data?.data?.children) {
        console.warn('Unexpected search response')
        return []
      }

      // Filter and parse songs
      const filtered = filterPlayableSongs(data.data.children)
      const songs = filtered.map((item: any) => parseSong(item.data))

      // Update store
      if (pagination) {
        state.addSongs(songs)
      } else {
        state.setSongs(songs)
      }

      state.setAfter(data.data.after || null)

      return songs
    } catch (error: any) {
      if (error.name === 'AbortError') return []
      console.error('Search error:', error)
      throw error
    } finally {
      if (!controller.signal.aborted) {
        state.setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [])

  return {
    fetchSongs,
    fetchFromSubreddits,
    fetchSearch,
  }
}
