"use client"

import { Search, FileText, Video, Bot, Sparkles, Command } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

interface HelpHeroProps {
  searchQuery: string
  setSearchQuery?: (value: string) => void
  onSearchChange?: (value: string) => void
  onSearch?: (e: React.FormEvent) => void
  searchInputRef?: React.RefObject<HTMLInputElement>
}

export function HelpHero({ searchQuery, setSearchQuery, onSearchChange, onSearch, searchInputRef }: HelpHeroProps) {
  const handleChange = (value: string) => {
    if (setSearchQuery) setSearchQuery(value)
    if (onSearchChange) onSearchChange(value)
  }
  return (
    <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="container max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Badge className="px-4 py-1.5 text-sm bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              KI-gestütztes Hilfecenter
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Wie können wir{" "}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              helfen
            </span>
            ?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Durchsuchen Sie unsere Wissensdatenbank, schauen Sie Video-Tutorials oder fragen Sie unseren
            KI-Assistenten.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                ref={searchInputRef || null}
                placeholder="Suchen Sie nach Artikeln, Videos oder Themen..."
                value={searchQuery}
                onChange={(e) => handleChange(e.target.value)}
                className="pl-12 pr-24 h-14 text-base rounded-2xl border-2 focus:border-primary shadow-lg shadow-primary/5 bg-background/80 backdrop-blur-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
                  <Command className="h-3 w-3" />K
                </kbd>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-6 mt-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>35+ Artikel</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              <span>6+ Videos</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>KI-Assistent 24/7</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
