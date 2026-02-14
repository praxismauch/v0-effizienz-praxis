"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { searchableItems } from "./constants"

export function HeaderSearch() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return searchableItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some((k) => k.includes(query)),
      )
      .slice(0, 8)
  }, [searchQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchSelect = (href: string) => {
    router.push(href)
    setSearchQuery("")
    setIsSearchFocused(false)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchResults.length > 0) {
      handleSearchSelect(searchResults[0].href)
    }
    if (e.key === "Escape") {
      setSearchQuery("")
      setIsSearchFocused(false)
    }
  }

  return (
    <div className="hidden md:flex flex-1 max-w-md" ref={searchRef}>
      <div className="relative w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder="Suchen..."
          className="w-full pl-8 pr-8 bg-muted/50 h-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onKeyDown={handleSearchKeyDown}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isSearchFocused && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-auto">
            {searchResults.length > 0 ? (
              <div className="p-1">
                {searchResults.map((item) => (
                  <button
                    key={item.href}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent rounded-sm transition-colors"
                    onClick={() => handleSearchSelect(item.href)}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {'Keine Ergebnisse für "'}{searchQuery}{'"'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
