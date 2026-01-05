"use client"

import { useEffect } from "react"

import { useState } from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"

export function LandingPageHeader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    if (path.startsWith("/#")) {
      return mounted && pathname === "/" && window.location.hash === path.slice(1)
    }
    return pathname === path || pathname.startsWith(path + "/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Logo className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-bold">Effizienz Praxis</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/alle-funktionen"
            className={`text-sm font-medium transition-colors ${
              isActive("/alle-funktionen")
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Features
          </Link>
          <Link
            href="/#benefits"
            className={`text-sm font-medium transition-colors ${
              isActive("/#benefits") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Vorteile
          </Link>
          <Link
            href="/preise"
            className={`text-sm font-medium transition-colors ${
              isActive("/preise") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Preise
          </Link>
          <Link
            href="/effizienz"
            className={`text-sm font-medium transition-colors ${
              isActive("/effizienz") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Effizienz
          </Link>
          <Link
            href="/coming-soon"
            className={`text-sm font-medium transition-colors ${
              isActive("/coming-soon") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Coming Soon
          </Link>
          <Link href="/auth/login">
            <Button>
              Zum Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default LandingPageHeader
