"use client"

import { useEffect, useRef, useState } from "react"
import { Song } from "@/lib/store"

interface SoundCloudPlayerProps {
  song: Song
  onStateChange?: (isPlaying: boolean) => void
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  volume?: number
  isPlaying?: boolean
  currentTime?: number
}

export function SoundCloudPlayer({
  song,
  onStateChange,
  onTimeUpdate,
  onDurationChange,
  volume = 100,
  isPlaying = false,
  currentTime = 0,
}: SoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const widgetRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const initAttemptRef = useRef(0)
  const maxInitAttempts = 3

  useEffect(() => {
    // Reset ready state when song changes
    setIsReady(false)
    initAttemptRef.current = 0
    
    // Immediately reset time and duration when song changes to prevent blocking
    onTimeUpdate?.(0)
    onDurationChange?.(0)

    // Clean up old widget if it exists and is for a different song
    const existingWidget = (window as any).__soundcloudWidget
    const existingUrl = (window as any).__soundcloudUrl
    
    if (existingWidget && existingUrl !== song.url) {
      // Stop and unbind old widget completely
      try {
        if (typeof existingWidget.pause === 'function') {
          existingWidget.pause()
        }
        if (typeof existingWidget.unbind === 'function') {
          existingWidget.unbind(window.SC?.Widget?.Events?.READY)
          existingWidget.unbind(window.SC?.Widget?.Events?.PLAY_PROGRESS)
          existingWidget.unbind(window.SC?.Widget?.Events?.FINISHED)
          existingWidget.unbind(window.SC?.Widget?.Events?.ERROR)
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      // Clear old widget reference
      ;(window as any).__soundcloudWidget = null
      ;(window as any).__soundcloudUrl = null
      widgetRef.current = null
    }

    // Check if widget already exists for this URL
    if (existingWidget && existingUrl === song.url) {
      // Reuse existing widget
      widgetRef.current = existingWidget
      setIsReady(true)
      // Update volume, time, and playing state
      try {
        if (existingWidget && typeof existingWidget.setVolume === 'function') {
          existingWidget.setVolume(volume / 100)
        }
        if (currentTime > 0 && typeof existingWidget.seekTo === 'function') {
          existingWidget.seekTo(currentTime * 1000)
        }
        if (isPlaying && typeof existingWidget.play === 'function') {
          existingWidget.play()
        } else if (typeof existingWidget.pause === 'function') {
          existingWidget.pause()
        }
      } catch (e) {
        console.error('SoundCloud reuse error:', e)
        // If reuse fails, create new widget
        initializePlayer()
      }
      return
    }

    // Load SoundCloud Widget API
    if (!window.SC) {
      const script = document.createElement("script")
      script.src = "https://w.soundcloud.com/player/api.js"
      script.async = true
      script.onerror = () => {
        console.error('Failed to load SoundCloud API')
        setIsReady(false)
      }
      document.body.appendChild(script)

      script.onload = () => {
        // Wait a bit for SC to be fully available
        setTimeout(() => {
          if (window.SC) {
            initializePlayer()
          }
        }, 100)
      }
    } else {
      initializePlayer()
    }

    function initializePlayer() {
      // Safety checks
      if (!iframeRef.current) {
        console.warn('SoundCloud: iframe not ready')
        if (initAttemptRef.current < maxInitAttempts) {
          initAttemptRef.current++
          setTimeout(() => initializePlayer(), 500)
        }
        return
      }

      if (!window.SC || !window.SC.Widget) {
        console.warn('SoundCloud: API not loaded')
        if (initAttemptRef.current < maxInitAttempts) {
          initAttemptRef.current++
          setTimeout(() => initializePlayer(), 500)
        }
        return
      }

      try {
        const widget = window.SC.Widget(iframeRef.current)
        if (!widget) {
          throw new Error('Failed to create SoundCloud widget')
        }

        widgetRef.current = widget

        // Bind READY event with proper error handling
        widget.bind(window.SC.Widget.Events.READY, () => {
          try {
            if (!widgetRef.current) return
            
            // Verify widget is still valid
            const currentWidget = widgetRef.current
            if (!currentWidget) return
            
            setIsReady(true)
            
            // Set volume
            try {
              if (typeof currentWidget.setVolume === 'function') {
                currentWidget.setVolume(volume / 100)
              }
            } catch (volumeError) {
              // Ignore volume errors
            }
            
            // Store widget globally for seek access
            ;(window as any).__soundcloudWidget = currentWidget
            ;(window as any).__soundcloudUrl = song.url
            
            // Reset time to 0 when new song starts
            onTimeUpdate?.(0)
            
            // Get duration when ready
            try {
              if (typeof currentWidget.getDuration === 'function') {
                currentWidget.getDuration((duration: number) => {
                  try {
                    // Validate duration
                    if (!duration || !isFinite(duration) || isNaN(duration) || duration <= 0) return
                    
                    // Verify URL again before updating duration
                    const currentUrl = (window as any).__soundcloudUrl
                    if (currentUrl === song.url) {
                      onDurationChange?.(duration / 1000) // Convert milliseconds to seconds
                    }
                  } catch (durationError) {
                    // Silently ignore duration errors
                  }
                })
              }
            } catch (durationCallError) {
              // Ignore duration call errors
            }
            
            // Seek to current time if it's greater than 0
            try {
              if (currentTime > 0 && isFinite(currentTime) && !isNaN(currentTime) && typeof currentWidget.seekTo === 'function') {
                currentWidget.seekTo(currentTime * 1000) // SoundCloud uses milliseconds
              }
            } catch (seekError) {
              // Ignore seek errors
            }
            
            // Then play if needed
            if (isPlaying && typeof currentWidget.play === 'function') {
              setTimeout(() => {
                try {
                  // Verify widget still exists and URL matches
                  const verifyWidget = widgetRef.current
                  const verifyUrl = (window as any).__soundcloudUrl
                  if (verifyWidget && verifyUrl === song.url) {
                    verifyWidget.play()
                  }
                } catch (playError) {
                  // Ignore play errors
                }
              }, 100)
            }
          } catch (readyError) {
            // Handle ready event errors gracefully
            if (readyError !== null && readyError !== undefined) {
              console.error('SoundCloud ready event error:', readyError)
            }
            setIsReady(false)
          }
        })

        // Bind PLAY_PROGRESS event with null checks and song ID validation
        widget.bind(window.SC.Widget.Events.PLAY_PROGRESS, (e: any) => {
          try {
            if (!widgetRef.current) return
            
            // Double-check URL match to prevent stale updates
            const currentUrl = (window as any).__soundcloudUrl
            
            // Only process if this is still the current song
            if (currentUrl !== song.url) {
              return
            }
            
            // Handle null/undefined event gracefully
            if (!e || typeof e !== 'object') {
              return
            }
            
            if (typeof e.currentPosition === 'number' && e.currentPosition !== undefined && e.currentPosition !== null) {
              const time = e.currentPosition / 1000 // Convert milliseconds to seconds
              if (time >= 0 && isFinite(time) && !isNaN(time)) {
                // Update time
                onTimeUpdate?.(time)
              }
              
              // Also update duration periodically (only once per second to reduce calls)
              const currentWidget = widgetRef.current
              if (currentWidget && typeof currentWidget.getDuration === 'function') {
                // Throttle duration updates
                const now = Date.now()
                if (!(window as any).__lastSCDurationUpdate || now - (window as any).__lastSCDurationUpdate > 1000) {
                  (window as any).__lastSCDurationUpdate = now
                  currentWidget.getDuration((duration: number) => {
                    try {
                      // Validate duration
                      if (!duration || !isFinite(duration) || isNaN(duration) || duration <= 0) return
                      
                      // Verify URL again before updating
                      const verifyUrl = (window as any).__soundcloudUrl
                      if (verifyUrl === song.url) {
                        onDurationChange?.(duration / 1000)
                      }
                    } catch (durationError) {
                      // Silently ignore duration update errors
                    }
                  })
                }
              }
            }
          } catch (progressError) {
            // Silently ignore progress errors to prevent spam
            // Only log if it's a real error, not just null
            if (progressError !== null && progressError !== undefined) {
              // Don't spam console with errors
            }
          }
        })

        // Bind FINISHED event with null-safe handling
        widget.bind(window.SC.Widget.Events.FINISHED, () => {
          try {
            const currentUrl = (window as any).__soundcloudUrl
            if (currentUrl === song.url) {
              onStateChange?.(false)
              // Auto-play next song when current finishes
              try {
                const { usePlaylistStore } = require("@/lib/store")
                const store = usePlaylistStore.getState()
                if (store && store.currentIndex !== undefined && store.songs && store.currentIndex < store.songs.length - 1) {
                  store.forward()
                }
              } catch (storeError) {
                // Ignore store errors
              }
            }
          } catch (finishedError) {
            // Handle finished event errors gracefully
            if (finishedError !== null && finishedError !== undefined) {
              console.error('SoundCloud finished event error:', finishedError)
            }
          }
        })

        // Bind ERROR event with null-safe handling
        widget.bind(window.SC.Widget.Events.ERROR, (e: any) => {
          try {
            // Handle null/undefined error gracefully
            if (e !== null && e !== undefined) {
              console.error('SoundCloud player error:', e)
            } else {
              console.warn('SoundCloud player error: null/undefined error received')
            }
            
            setIsReady(false)
            
            // Try to reinitialize after error (only if we haven't exceeded max attempts)
            if (initAttemptRef.current < maxInitAttempts) {
              initAttemptRef.current++
              setTimeout(() => {
                // Verify iframe and SC API still exist before retrying
                if (iframeRef.current && window.SC && window.SC.Widget) {
                  // Clear widget reference before retrying
                  widgetRef.current = null
                  initializePlayer()
                }
              }, 1000)
            } else {
              // Max attempts reached, clear widget reference
              widgetRef.current = null
              ;(window as any).__soundcloudWidget = null
              ;(window as any).__soundcloudUrl = null
            }
          } catch (errorHandlerError) {
            // Prevent error handler from crashing
            console.error('Error in SoundCloud error handler:', errorHandlerError)
            setIsReady(false)
          }
        })
      } catch (e) {
        // Handle initialization errors gracefully
        if (e !== null && e !== undefined) {
          console.error('SoundCloud initialization error:', e)
        } else {
          console.warn('SoundCloud initialization error: null/undefined')
        }
        setIsReady(false)
        // Retry initialization
        if (initAttemptRef.current < maxInitAttempts) {
          initAttemptRef.current++
          setTimeout(() => {
            // Verify conditions before retrying
            if (iframeRef.current && window.SC && window.SC.Widget) {
              initializePlayer()
            }
          }, 1000)
        } else {
          // Max attempts reached, clear references
          widgetRef.current = null
          ;(window as any).__soundcloudWidget = null
          ;(window as any).__soundcloudUrl = null
        }
      }
    }

    return () => {
      // Cleanup: stop and unbind events if widget exists
      const widget = widgetRef.current
      if (widget) {
        try {
          // Stop playback
          if (typeof widget.pause === 'function') {
            widget.pause()
          }
          // Unbind all events
          if (typeof widget.unbind === 'function') {
            widget.unbind(window.SC?.Widget?.Events?.READY)
            widget.unbind(window.SC?.Widget?.Events?.PLAY_PROGRESS)
            widget.unbind(window.SC?.Widget?.Events?.FINISHED)
            widget.unbind(window.SC?.Widget?.Events?.ERROR)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      // Clear widget reference
      widgetRef.current = null
    }
  }, [song.url, song.id, currentTime])

  useEffect(() => {
    if (!isReady || !widgetRef.current) return

    const widget = widgetRef.current
    if (!widget) return
    
    const currentUrl = (window as any).__soundcloudUrl
    // Only update if this is still the current song
    if (currentUrl !== song.url) return
    
    try {
      if (isPlaying) {
        if (typeof widget.play === 'function') {
          widget.play()
        }
      } else {
        if (typeof widget.pause === 'function') {
          widget.pause()
        }
      }
    } catch (e) {
      console.error('SoundCloud play/pause error:', e)
    }
  }, [isPlaying, isReady, song.url])

  useEffect(() => {
    if (!isReady || !widgetRef.current) return

    const widget = widgetRef.current
    if (!widget) return
    
    const currentUrl = (window as any).__soundcloudUrl
    // Only update if this is still the current song
    if (currentUrl !== song.url) return
    
    try {
      if (typeof widget.setVolume === 'function') {
        widget.setVolume(volume / 100)
      }
    } catch (e) {
      console.error('SoundCloud volume error:', e)
    }
  }, [volume, isReady, song.url])

  const soundcloudUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(song.url)}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`

  // Handle iframe load
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      // Wait a bit for SoundCloud to initialize
      setTimeout(() => {
        if (window.SC && !widgetRef.current && iframeRef.current) {
          // Re-trigger initialization if widget wasn't created
          const existingWidget = (window as any).__soundcloudWidget
          const existingUrl = (window as any).__soundcloudUrl
          if (!existingWidget || existingUrl !== song.url) {
            // Widget will be initialized in the main useEffect
          }
        }
      }, 500)
    }

    iframe.addEventListener('load', handleLoad)
    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [song.url])

  return (
    <div className="w-full h-full">
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src={soundcloudUrl}
        onLoad={() => {
          // Additional load handler
          if (window.SC && iframeRef.current && !widgetRef.current) {
            setTimeout(() => {
              // Widget initialization will happen in useEffect
            }, 300)
          }
        }}
      />
    </div>
  )
}

declare global {
  interface Window {
    SC: any
  }
}

