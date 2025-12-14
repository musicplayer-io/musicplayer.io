'use client'

import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useState, useRef } from 'react'
import { usePlayerStore } from '@/lib/store/player-store'
import { formatTime } from '@/lib/utils/song-utils'

export function PlayerControls() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentSong,
    togglePlay,
    next,
    previous,
    seekTo,
    setVolume,
  } = usePlayerStore()

  const [showVolume, setShowVolume] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return

    const rect = progressRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newTime = (percentage / 100) * duration

    seekTo(newTime)

    // Seek in actual players
    if (currentSong) {
      // YouTube
      if (currentSong.type === 'youtube' && (window as any).YT && (window as any).__youtubePlayer) {
        try {
          ;(window as any).__youtubePlayer.seekTo(newTime, true)
        } catch {
          // ignore
        }
      }

      // Vimeo
      if (currentSong.type === 'vimeo' && (window as any).__vimeoPlayer) {
        try {
          ;(window as any).__vimeoPlayer.setCurrentTime(newTime)
        } catch {
          // ignore
        }
      }

      // MP3
      if (currentSong.type === 'mp3') {
        const audio = document.querySelector('audio') as HTMLAudioElement
        if (audio) audio.currentTime = newTime
      }

      // SoundCloud
      if (currentSong.type === 'soundcloud' && (window as any).__soundcloudWidget) {
        try {
          const widget = (window as any).__soundcloudWidget
          widget.getDuration((dur: number) => {
            const position = (newTime / dur) * 1000
            widget.seekTo(position)
          })
        } catch {
          // ignore
        }
      }
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="relative h-1 bg-secondary cursor-pointer group"
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 px-4 md:px-6 py-3">
        {/* Time */}
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-1 md:flex-none md:mx-auto">
          <button
            onClick={previous}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            disabled={!currentSong}
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlay}
            className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={!currentSong}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button
            onClick={next}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            disabled={!currentSong}
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {/* Volume */}
        <div className="hidden md:block relative">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            aria-label="Volume control"
          >
            {volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {showVolume && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setShowVolume(false)} />

              {/* Volume Popup - Ultra Minimalistic */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50">
                <div className="bg-[#1a1a1a] rounded-lg p-2 shadow-xl border border-white/10 w-8">
                  {/* Just Slider */}
                  <div className="flex justify-center">
                    <div className="relative h-24 w-1 bg-white/10 rounded-full overflow-hidden">
                      {/* Fill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#FDC00F] rounded-full transition-all duration-150"
                        style={{ height: `${volume}%` }}
                      />

                      {/* Slider Input */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={e => setVolume(Number(e.target.value))}
                        className="absolute inset-0 w-24 h-1 origin-center -rotate-90 opacity-0 cursor-pointer"
                        style={{
                          transform: 'rotate(-90deg) translateX(-50%)',
                          transformOrigin: 'left center',
                          left: '50%',
                          top: '50%',
                          marginTop: '-0.25rem',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile Time */}
        <div className="md:hidden text-xs text-muted-foreground font-mono tabular-nums">
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  )
}
