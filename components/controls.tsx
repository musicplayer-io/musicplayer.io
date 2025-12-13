"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlaylistStore } from "@/lib/store"

export function Controls() {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    currentSong,
    playPause,
    forward,
    backward,
    setVolume,
    seekTo,
  } = usePlaylistStore()
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [seekingTime, setSeekingTime] = useState<number | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlayPause = () => {
    playPause()
  }

  const handleForward = () => {
    forward()
  }

  const handleBackward = () => {
    backward()
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newTime = (percentage / 100) * duration
    
    // Immediately update visual feedback
    setSeekingTime(newTime)
    
    // Update store time
    seekTo(newTime)
    
    // Seek in actual players - keep playing state
    const wasPlaying = isPlaying
    
    // YouTube
    if ((window as any).YT && (window as any).__youtubePlayer) {
      try {
        const player = (window as any).__youtubePlayer
        player.seekTo(newTime, true)
        // Ensure it keeps playing if it was playing
        if (wasPlaying && player.getPlayerState() !== 1) {
          player.playVideo()
        }
      } catch (e) {
        // Ignore
      }
    }
    
    // Vimeo
    if ((window as any).__vimeoPlayer) {
      try {
        const player = (window as any).__vimeoPlayer
        player.setCurrentTime(newTime).then(() => {
          // Ensure it keeps playing if it was playing
          if (wasPlaying) {
            player.getPaused().then((paused: boolean) => {
              if (paused) {
                player.play()
              }
            })
          }
        })
      } catch (e) {
        // Ignore
      }
    }
    
    // MP3
    const audio = (window as any).__mp3AudioRef?.current as HTMLAudioElement
    if (audio) {
      audio.currentTime = newTime
      // Ensure it keeps playing if it was playing
      if (wasPlaying && audio.paused) {
        audio.play().catch(() => {
          // Ignore autoplay errors
        })
      }
    }
    
    // SoundCloud
    if ((window as any).__soundcloudWidget) {
      try {
        const widget = (window as any).__soundcloudWidget
        widget.getDuration((duration: number) => {
          const seekPosition = (newTime / duration) * 1000
          widget.seekTo(seekPosition)
          // Ensure it keeps playing if it was playing
          if (wasPlaying) {
            widget.play()
          }
        })
      } catch (e) {
        // Ignore
      }
    }
    
    // Clear seeking time after a short delay to sync with actual player time
    setTimeout(() => {
      setSeekingTime(null)
    }, 100)
  }

  // Reset seeking time and ensure progress resets when song changes
  useEffect(() => {
    setSeekingTime(null)
    // Force reset progress bar when song changes
    // The store should already have currentTime: 0 and duration: 0 from setCurrentSong/forward/backward
    // But we ensure seekingTime is cleared for visual reset
    
    // Also clear any stale SoundCloud widget references if song type changed
    if (currentSong?.type !== 'soundcloud') {
      // Don't clear if it's still SoundCloud, just ensure URL matches
      const scUrl = (window as any).__soundcloudUrl
      if (scUrl && scUrl !== currentSong?.url) {
        // Clear stale reference
        ;(window as any).__soundcloudWidget = null
        ;(window as any).__soundcloudUrl = null
      }
    }
  }, [currentSong?.id, currentSong?.type, currentSong?.url])

  // Reset seeking time when currentTime updates from player
  useEffect(() => {
    if (seekingTime === null) return
    // If the player time has caught up, clear the seeking state
    if (Math.abs(currentTime - seekingTime) < 0.5) {
      setSeekingTime(null)
    }
  }, [currentTime, seekingTime])

  // Calculate display time (use seekingTime if actively seeking, otherwise use currentTime)
  // Ensure we never show progress if duration is 0 or invalid
  const displayTime = seekingTime !== null ? seekingTime : currentTime
  
  // Always show 0% if duration is 0, invalid, or if we don't have a current song
  let displayPercentage = 0
  if (currentSong && duration > 0 && !isNaN(duration) && !isNaN(displayTime) && isFinite(duration) && isFinite(displayTime)) {
    const calculated = (displayTime / duration) * 100
    displayPercentage = Math.max(0, Math.min(100, calculated))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#141414] border-t border-[#FDC00F]/20 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <div className="flex flex-col">
        {/* Main Controls Row */}
        <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 h-16 md:h-18">
          {/* Playback Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleBackward}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full text-white hover:text-[#FDC00F] hover:bg-white/10 transition-all duration-200 touch-manipulation active:scale-95"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button
              onClick={handlePlayPause}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#FDC00F] hover:bg-[#f99b1d] text-black transition-all duration-200 shadow-lg shadow-[#FDC00F]/30 hover:shadow-[#FDC00F]/50 touch-manipulation active:scale-95"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <button
              onClick={handleForward}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full text-white hover:text-[#FDC00F] hover:bg-white/10 transition-all duration-200 touch-manipulation active:scale-95"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar Section - Separated */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-white w-14 text-right font-mono tabular-nums flex-shrink-0">
              {formatTime(displayTime)}
            </span>
            <div
              ref={progressBarRef}
              className="flex-1 cursor-pointer relative h-2 min-w-0 group"
              onClick={handleSeek}
            >
              {/* Background track */}
              <div className="absolute top-1/2 left-0 right-0 h-full -translate-y-1/2 bg-gray-800/60 rounded-full" />
              
              {/* Completed portion - yellow filled */}
              <div
                className="absolute top-1/2 left-0 h-full -translate-y-1/2 bg-[#FDC00F] rounded-full transition-[width] duration-75 ease-linear will-change-[width]"
                style={{ width: `${displayPercentage}%` }}
              />
              
              {/* Yellow dot at current position - appears on hover */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-[#FDC00F] rounded-full transition-[left] duration-75 ease-linear will-change-[left] shadow-lg shadow-[#FDC00F]/50 opacity-0 group-hover:opacity-100 z-10 border-2 border-[#141414]"
                style={{ left: `${displayPercentage}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <span className="text-xs text-white w-14 font-mono tabular-nums flex-shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Right Volume Control */}
          <div className="relative flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full text-white hover:text-[#FDC00F] hover:bg-white/10 transition-all duration-200 touch-manipulation active:scale-95"
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            {showVolumeSlider && (
              <div className="absolute bottom-full right-0 mb-3 w-10 h-32 bg-[#181818] border border-white/10 rounded-lg p-3 slide-in-right shadow-xl">
                <div
                  className="w-full h-full flex flex-col-reverse cursor-pointer rounded"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const y = e.clientY - rect.top
                    const percentage = ((rect.height - y) / rect.height) * 100
                    handleVolumeChange(Math.max(0, Math.min(100, percentage)))
                  }}
                >
                  <div
                    className="w-full bg-gradient-to-t from-[#FDC00F] to-[#f99b1d] rounded transition-all shadow-sm shadow-[#FDC00F]/20"
                    style={{ height: `${volume}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

