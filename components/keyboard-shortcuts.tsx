'use client'

import { useEffect } from 'react'
import { usePlayerStore } from '@/lib/store/player-store'

interface KeyboardShortcutsProps {
  onShowShortcuts?: () => void
}

export function KeyboardShortcuts({ onShowShortcuts }: KeyboardShortcutsProps) {
  const { isPlaying, volume, togglePlay, next, previous, setVolume, shufflePlaylist } =
    usePlayerStore()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      // ? - Show keyboard shortcuts
      if (e.key === '?' && onShowShortcuts) {
        e.preventDefault()
        onShowShortcuts()
        return
      }

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }

      // Arrow Right or Cmd/Ctrl + Right - Next Track
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        next()
      }

      // Arrow Left or Cmd/Ctrl + Left - Previous Track
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        previous()
      }

      // Arrow Up - Volume Up
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const newVolume = Math.min(100, volume + 10)
        setVolume(newVolume)
      }

      // Arrow Down - Volume Down
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const newVolume = Math.max(0, volume - 10)
        setVolume(newVolume)
      }

      // S - Shuffle
      if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          shufflePlaylist()
        }
      }

      // M - Mute/Unmute
      if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault()
          if (volume > 0) {
            setVolume(0)
          } else {
            setVolume(100)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, volume, togglePlay, next, previous, setVolume, shufflePlaylist, onShowShortcuts])

  return null
}
