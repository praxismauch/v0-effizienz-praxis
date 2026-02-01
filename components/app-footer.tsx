"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function AppFooter() {
  const [currentYear, setCurrentYear] = useState<number>(2026)

  useEffect(() => {
    // Set current year on client side only
    setCurrentYear(new Date().getFullYear())
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
      </div>
    </footer>
  )
}

export default AppFooter
