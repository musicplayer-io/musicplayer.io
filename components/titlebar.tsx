"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { 
  Music2, 
  User, 
  ExternalLink, 
  Bot, 
  Newspaper, 
  LogIn, 
  LogOut,
  Menu,
  ChevronDown,
  Github,
  MessageSquare,
  Link as LinkIcon,
  TrendingUp
} from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { usePlaylistStore } from "@/lib/store"

const VERSION = "0.6.14"

export function TitleBar() {
  const pathname = usePathname()
  const [activePage, setActivePage] = useState("/playlist")
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, login, logout } = useAuth()
  const mobileView = usePlaylistStore((state) => state.mobileView)
  const setMobileView = usePlaylistStore((state) => state.setMobileView)

  useEffect(() => {
    setMounted(true)
    setActivePage(pathname || "/playlist")
  }, [pathname])

  if (!mounted) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-black">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="hidden md:flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
            >
              <img 
                src="/favicon.ico" 
                alt="Reddit Music Player"
                className="w-6 h-6"
              />
              <span className="font-semibold text-sm">Reddit Music</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Title Bar - Super Cool & Compact */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-t border-white/5 border-b border-white/5 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between px-4 h-12">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity group"
            >
              <img 
                src="/favicon.ico" 
                alt="Reddit Music Player"
                className="w-6 h-6 flex-shrink-0 rounded-md"
              />
              <span className="hidden md:inline font-semibold text-base">Reddit Music</span>
              <span className="hidden lg:inline text-xs text-gray-500 ml-1">v{VERSION}</span>
            </Link>
          </div>

          {/* Right Menu */}
          <div className="flex items-center gap-2">
            {/* Authentication */}
            {mounted && (
              <div className="flex items-center">
                {isAuthenticated && user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white hover:bg-[#252525] transition-all group focus:outline-none focus:ring-0">
                      {user.icon_img && (
                        <img 
                          src={user.icon_img.replace(/&amp;/g, '&')} 
                          alt={user.name}
                          className="w-5 h-5 rounded-full ring-1 ring-white/20 group-hover:ring-[#FDC00F]/50 transition-all"
                        />
                      )}
                      <span className="hidden md:inline text-sm font-medium">{user.name}</span>
                      <ChevronDown className="w-3 h-3 hidden md:block opacity-50 group-hover:opacity-100 transition-opacity" />
                      <User className="w-4 h-4 md:hidden" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border border-white/10 min-w-[220px] p-2 shadow-xl backdrop-blur-xl">
                      <DropdownMenuLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 mb-1">
                        Account
                      </DropdownMenuLabel>
                      <DropdownMenuItem className="text-white cursor-default px-3 py-2.5 rounded-md hover:bg-[#252525] transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDC00F]/20 to-[#f99b1d]/20 flex items-center justify-center mr-3 flex-shrink-0">
                          <User className="w-4 h-4 text-[#FDC00F]" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate">{user.name}</span>
                          <span className="text-xs text-gray-400">Logged in</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10 my-2" />
                      <DropdownMenuItem 
                        onClick={logout}
                        className="text-white hover:bg-red-500/20 hover:text-red-400 px-3 py-2.5 rounded-md transition-all duration-200 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                          <LogOut className="w-4 h-4 text-red-400" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <button
                    onClick={login}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FDC00F] hover:bg-[#f99b1d] text-black text-sm font-semibold transition-all duration-200 shadow-lg shadow-[#FDC00F]/20 hover:shadow-[#FDC00F]/40 active:scale-95 focus:outline-none focus:ring-0"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Sign In</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Main Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-white hover:bg-[#252525] transition-all group focus:outline-none focus:ring-0">
                <Menu className="w-4 h-4" />
                <span className="hidden md:inline text-sm font-medium">Menu</span>
                <ChevronDown className="w-3 h-3 hidden md:block opacity-50 group-hover:opacity-100 transition-opacity" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border border-white/10 min-w-[240px] p-2 shadow-xl backdrop-blur-xl">
                <DropdownMenuLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 mb-1">
                  Resources
                </DropdownMenuLabel>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://github.com/musicplayer-io/redditmusicplayer" 
                    target="_blank" 
                    rel="nofollow" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <Github className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">Source Code</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://www.reddit.com/r/musicplayer" 
                    target="_blank" 
                    rel="nofollow" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">Reddit Community</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-white/10 my-2" />
                
                <DropdownMenuLabel className="text-gray-400 text-xs font-semibold uppercase tracking-wide px-3 py-2 mb-1">
                  More Projects
                </DropdownMenuLabel>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://il.ly" 
                    target="_blank" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">Ilias Ism</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://magicbuddy.chat" 
                    target="_blank" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <Bot className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">ChatGPT in Telegram</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://swissobserver.com" 
                    target="_blank" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <Newspaper className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">Swiss News</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link 
                    href="https://magicspace.agency" 
                    target="_blank" 
                    className="flex items-center px-3 py-2.5 rounded-md text-white hover:bg-[#252525] hover:text-[#FDC00F] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-md bg-[#252525] flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-[#FDC00F]/10 transition-colors">
                      <TrendingUp className="w-4 h-4 text-gray-400 group-hover:text-[#FDC00F] transition-colors" />
                    </div>
                    <span className="font-medium">MagicSpace SEO</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 group-hover:text-[#FDC00F] transition-all" />
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="fixed top-12 left-0 right-0 z-40 md:hidden bg-[#111] border-b border-black">
        <div className="flex items-center justify-around h-12">
          <button 
            className={`flex-1 h-full text-sm font-medium transition-all relative ${
              mobileView === "browse" 
                ? "text-[#FDC00F]" 
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMobileView("browse")
              setActivePage("/browse")
            }}
          >
            <span className="relative z-10">Browse</span>
            {mobileView === "browse" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FDC00F] to-[#f99b1d] rounded-t-full" />
            )}
          </button>
          <button 
            className={`flex-1 h-full text-sm font-medium transition-all relative ${
              mobileView === "playlist" 
                ? "text-[#FDC00F]" 
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMobileView("playlist")
              setActivePage("/playlist")
            }}
          >
            <span className="relative z-10">Playlist</span>
            {mobileView === "playlist" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FDC00F] to-[#f99b1d] rounded-t-full" />
            )}
          </button>
          <button 
            className={`flex-1 h-full text-sm font-medium transition-all relative ${
              mobileView === "song" 
                ? "text-[#FDC00F]" 
                : "text-gray-400 hover:text-white"
            }`}
            onClick={() => {
              setMobileView("song")
              setActivePage("/song")
            }}
          >
            <span className="relative z-10">Song</span>
            {mobileView === "song" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FDC00F] to-[#f99b1d] rounded-t-full" />
            )}
          </button>
        </div>
      </div>
    </>
  )
}

