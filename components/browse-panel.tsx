"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePlaylistStore } from "@/lib/store"
import { useRedditMusic } from "@/lib/hooks/use-reddit-music"
import { ShareModal } from "@/components/share-modal"
import _ from "lodash"

interface Subreddit {
  name: string
  key: string
  category: string
  created: number
  subscribers: number
  title: string
  description: string
}

export function BrowsePanel() {
  const [subreddits, setSubreddits] = useState<Subreddit[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [customSubreddit, setCustomSubreddit] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  
  const selectedSubreddits = usePlaylistStore((state) => state.selectedSubreddits)
  const searchQuery = usePlaylistStore((state) => state.searchQuery)
  const setSelectedSubreddits = usePlaylistStore((state) => state.setSelectedSubreddits)
  const setSearchQuery = usePlaylistStore((state) => state.setSearchQuery)
  const { fetchMusicForSubreddits, fetchSearch } = useRedditMusic()

  useEffect(() => {
    // Load subreddits from API
    fetch("/api/subreddits")
      .then((res) => res.json())
      .then((data) => {
        setSubreddits(data as Subreddit[])
        // Don't auto-fetch here - let useUrlParams handle initial loading
        // This prevents hydration mismatches
      })
      .catch((err) => console.error("Error loading subreddits:", err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubredditClick = async (subreddit: Subreddit) => {
    const key = subreddit.key.toLowerCase()
    let newSelected: string[]
    
    if (selectedSubreddits.includes(key)) {
      newSelected = selectedSubreddits.filter((s) => s !== key)
    } else {
      newSelected = [...selectedSubreddits, key]
    }
    
    // Smooth state update
    setSelectedSubreddits(newSelected)
    
    // Fetch music when subreddits change
    if (newSelected.length > 0) {
      // Use requestAnimationFrame for smoother transition
      requestAnimationFrame(() => {
        fetchMusicForSubreddits(newSelected)
      })
    }
  }

  const handleCustomSubreddit = async () => {
    const subredditName = customSubreddit.trim().toLowerCase().replace(/^\/?r\//, "")
    if (subredditName) {
      // Add custom subreddit if not already selected
      if (!selectedSubreddits.includes(subredditName)) {
        const newSelected = [...selectedSubreddits, subredditName]
        setSelectedSubreddits(newSelected)
        // Smooth transition
        requestAnimationFrame(() => {
          fetchMusicForSubreddits(newSelected)
        })
      }
      setCustomSubreddit("")
    }
  }

  const handleRemoveSubreddit = async (subredditKey: string) => {
    const newSelected = selectedSubreddits.filter((s) => s !== subredditKey)
    setSelectedSubreddits(newSelected)
    
    // Fetch music when subreddits change
    if (newSelected.length > 0) {
      await fetchMusicForSubreddits(newSelected)
    } else {
      // If no subreddits selected, default to listentothis
      const defaultSelected = ["listentothis"]
      setSelectedSubreddits(defaultSelected)
      await fetchMusicForSubreddits(defaultSelected)
    }
  }

  const handleSearch = async () => {
    const query = searchInput.trim()
    if (query.length < 3) {
      return // Minimum 3 characters for search
    }
    
    // Set search query in store
    setSearchQuery(query)
    
    // Clear selected subreddits when searching
    setSelectedSubreddits([])
    
    // Fetch search results
    await fetchSearch(query)
  }

  const groupedSubreddits = _.groupBy(
    _.sortBy(subreddits, "category"),
    "category"
  )

  return (
    <div className="content-browse p-5 md:p-6 smooth-scroll overflow-y-auto h-full bg-[#111111]">
      {/* Header - Enhanced */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="p-2 bg-[#FDC00F]/10 rounded-lg">
          <svg className="w-5 h-5 text-[#FDC00F]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13V5q0-.825.588-1.413T5 3h6v10H3ZM13 3h6q.825 0 1.413.588T21 5v4h-8V3Zm0 18V11h8v8q0 .825-.588 1.413T19 21h-6ZM3 15h8v6H5q-.825 0-1.413-.588T3 19v-4Z"/>
          </svg>
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold text-white">Browse Subreddits</h1>
          <p className="text-xs text-gray-500">Discover music communities</p>
        </div>
      </div>

      {/* Search Input - Enhanced */}
      <div className="flex gap-2 mb-6 md:mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search Reddit..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:bg-white/8 focus:border-[#FDC00F]/50 focus-visible:ring-2 focus-visible:ring-[#FDC00F]/30 focus-visible:ring-offset-0 transition-all duration-200"
          />
        </div>
        <Button
          onClick={handleSearch}
          size="sm"
          className="bg-[#FDC00F] hover:bg-[#f99b1d] text-black font-semibold px-4 shadow-lg shadow-[#FDC00F]/20 hover:shadow-[#FDC00F]/40 transition-all duration-200"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* My Subreddit Playlist - Clean */}
      <div className="mb-8 p-4 bg-[#181818] rounded-lg border border-white/5 hover:border-white/10 transition-colors relative">
        <div className="flex items-start justify-between mb-4 pr-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white mb-0.5">
              {searchQuery ? `Search: ${searchQuery}` : "My Subreddit Playlist"}
            </div>
            {selectedSubreddits.length > 0 && !searchQuery && (
              <div className="text-xs text-gray-500">
                {selectedSubreddits.length} {selectedSubreddits.length === 1 ? 'subreddit' : 'subreddits'} selected
              </div>
            )}
          </div>
        {selectedSubreddits.length > 0 && !searchQuery && (
          <button
            onClick={() => setShowShareModal(true)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-[#111111] rounded-lg border border-white/10 hover:border-[#FDC00F]/40 flex items-center justify-center text-gray-400 hover:text-[#FDC00F] transition-all duration-200 shadow-lg hover:shadow-[#FDC00F]/20 z-10"
            title="Share"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="currentColor" d="M15.991 1.035a4 4 0 1 1-.855 6.267l-6.28 3.626a4.007 4.007 0 0 1 0 2.144l6.28 3.626a4.002 4.002 0 0 1 6.32 4.803a4 4 0 0 1-7.32-3.07l-6.28-3.627a4.002 4.002 0 1 1 0-5.608l6.28-3.626a4.002 4.002 0 0 1 1.855-4.535ZM19.723 3.5a2 2 0 1 0-3.464 2a2 2 0 0 0 3.464-2ZM3.071 12.527a2.002 2.002 0 0 0 2.93 1.204a2 2 0 1 0-2.93-1.204Zm15.92 5.242a2 2 0 1 0-2 3.464a2 2 0 0 0 2-3.464Z"/>
            </svg>
          </button>
        )}
          {searchQuery && (
            <Button
              onClick={() => {
                setSearchQuery(null)
                if (selectedSubreddits.length > 0) {
                  fetchMusicForSubreddits(selectedSubreddits)
                }
              }}
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-white h-8 w-8 p-0 flex-shrink-0"
              title="Clear"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          )}
        </div>
        {searchQuery ? (
          <p className="text-xs text-gray-500">
            Showing results for: <span className="text-white">{searchQuery}</span>
          </p>
        ) : selectedSubreddits.length === 0 ? (
          <p className="text-xs text-gray-500">
            Select subreddits below to build your playlist
          </p>
        ) : (
          <div className="space-y-1">
            {selectedSubreddits.map((subKey, index) => {
              const subreddit = subreddits.find((s) => s.key.toLowerCase() === subKey)
              return (
                <div
                  key={subKey}
                  className="flex items-center justify-between px-3 py-2 bg-[#181818] rounded-md border border-white/5 hover:bg-[#222222] hover:border-white/10 group transition-all duration-300 ease-out"
                  style={{ 
                    animation: `fadeInSlide 0.3s ease-out ${index * 50}ms both`
                  }}
                >
                  <span className="text-sm text-white font-medium transition-all duration-300">/r/{subKey}</span>
                  <Button
                    onClick={() => handleRemoveSubreddit(subKey)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 p-1 h-auto w-auto active:scale-95"
                    title="Remove"
                  >
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom Subreddit Input - Enhanced */}
      <div className="flex gap-0 mb-8">
        <span className="flex items-center px-3 bg-white/5 border border-r-0 border-white/10 text-gray-400 text-sm rounded-l-md transition-colors duration-200">
          /r/
        </span>
        <Input
          type="text"
          placeholder="custom-subreddit"
          value={customSubreddit}
          onChange={(e) => setCustomSubreddit(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleCustomSubreddit()}
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-none focus:bg-white/8 focus:border-[#FDC00F]/50 focus-visible:ring-2 focus-visible:ring-[#FDC00F]/30 focus-visible:ring-offset-0 transition-all duration-200"
        />
        <Button
          onClick={handleCustomSubreddit}
          size="sm"
          className="bg-[#FDC00F] hover:bg-[#f99b1d] text-black rounded-l-none rounded-r-md px-4 font-semibold shadow-lg shadow-[#FDC00F]/20 hover:shadow-[#FDC00F]/40 transition-all duration-300 ease-out active:scale-95 hover:scale-105 group"
        >
          <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
        </Button>
      </div>

      {/* Subreddit Categories - Clean Professional Design */}
      <div className="space-y-12">
        {Object.entries(groupedSubreddits).map(([category, subs], categoryIndex) => {
          return (
            <div
              key={category}
              className="subreddit-category"
              data-category={_.camelCase(category)}
            >
              {/* Category Header - Clean Two-Line Design */}
              <div className="mb-4">
                <div className="mb-2">
                  <h2 className="text-base font-semibold text-white tracking-tight mb-0.5">
                    {category}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {subs.length} {subs.length === 1 ? 'subreddit' : 'subreddits'}
                  </p>
                </div>
                <div className="h-px bg-white/5" />
              </div>
              
              {/* Category Content - Clean List */}
              <div className="space-y-1">
                {_.sortBy(subs, "name").map((sub) => {
                  const isActive = selectedSubreddits.includes(sub.key.toLowerCase())
                  return (
                    <Button
                      key={sub.key}
                      onClick={() => handleSubredditClick(sub)}
                      variant="ghost"
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm rounded-md transition-all duration-300 ease-out group h-auto active:scale-[0.98] ${
                        isActive
                          ? "bg-[#FDC00F]/10 text-[#FDC00F] border border-[#FDC00F]/30 hover:bg-[#FDC00F]/15 hover:text-[#FDC00F] hover:border-[#FDC00F]/40 shadow-sm shadow-[#FDC00F]/10 scale-[1.02]"
                          : "text-gray-300 hover:bg-white/5 hover:text-white hover:border-white/10 border border-transparent hover:scale-[1.01]"
                      }`}
                      data-value={sub.key.toLowerCase()}
                      data-name={sub.name}
                      data-category={sub.category}
                      data-created={sub.created}
                      data-subscribers={sub.subscribers}
                      data-title={sub.title}
                      data-content={sub.description}
                    >
                      <span className="font-medium truncate transition-all duration-300">{sub.name}</span>
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 ml-2 transition-all duration-300 ease-out ${
                        isActive 
                          ? "bg-[#FDC00F]/20 text-[#FDC00F] scale-110 shadow-sm shadow-[#FDC00F]/20" 
                          : "bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-[#FDC00F] group-hover:scale-105"
                      }`}>
                        <Plus className={`w-3.5 h-3.5 transition-all duration-300 ease-out ${
                          isActive ? "rotate-45 scale-110" : "rotate-0"
                        }`} />
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        subreddits={selectedSubreddits}
      />
    </div>
  )
}

