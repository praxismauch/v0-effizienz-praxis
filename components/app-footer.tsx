"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

const LEITBILD_CACHE_KEY = "effizienz-praxis-leitbild-cache"

export function AppFooter() {
  const currentYear = new Date().getFullYear()
  const [leitbild, setLeitbild] = useState<string | null>(null)

  useEffect(() => {
    // Read cached leitbild from localStorage
    try {
      const cached = localStorage.getItem(LEITBILD_CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        setLeitbild(parsed.leitbildOneSentence || null)
      }
    } catch {
      // Ignore errors
    }

    // Listen for updates from leitbild page
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LEITBILD_CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          setLeitbild(parsed.leitbildOneSentence || null)
        } catch {
          // Ignore errors
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <footer className="w-full border-t border-border bg-background z-10 shrink-0">
      <div className="w-full px-4 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <Link href="/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Separator orientation="vertical" className="h-3" />
          <Link href="/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
          <Separator orientation="vertical" className="h-3" />
          <Link href="/agb" className="hover:text-foreground transition-colors">
            AGB
          </Link>
          <Separator orientation="vertical" className="h-3" />
          <Link href="/cookies" className="hover:text-foreground transition-colors">
            Cookie-Richtlinie
          </Link>
          <Separator orientation="vertical" className="h-3" />
          <Link href="/contact" className="hover:text-foreground transition-colors">
            Kontakt
          </Link>
          <Separator orientation="vertical" className="h-3" />
          <span>© {currentYear} Effizienz Praxis</span>
        </div>
        {/* Cached leitbild display */}
        {leitbild && (
          <div className="mt-1 text-center">
            <p className="text-[10px] text-muted-foreground/60 italic max-w-4xl mx-auto truncate">{leitbild}</p>
          </div>
        )}
      </div>
    </footer>
  )
}

export default AppFooter
