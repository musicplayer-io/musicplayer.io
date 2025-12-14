import { useEffect } from 'react'
import { usePlayerStore } from '@/lib/store/player-store'

/**
 * Hydrates player store from localStorage on client-side only
 * This prevents SSR hydration mismatches
 */
export function usePlayerHydration() {
  useEffect(() => {
    try {
      const selectedSubreddits = localStorage.getItem('reddit_music_player_subreddits')
      const sortMethod = localStorage.getItem('reddit_music_player_sort_method')
      const topPeriod = localStorage.getItem('reddit_music_player_top_period')
      const volume = localStorage.getItem('reddit_music_player_volume')

      usePlayerStore.setState({
        selectedSubreddits: selectedSubreddits ? JSON.parse(selectedSubreddits) : ['listentothis'],
        sortMethod: sortMethod ? JSON.parse(sortMethod) : 'hot',
        topPeriod: topPeriod ? JSON.parse(topPeriod) : 'week',
        volume: volume ? JSON.parse(volume) : 100,
      })
    } catch (error) {
      console.error('Failed to hydrate player state from localStorage:', error)
    }
  }, [])
}
