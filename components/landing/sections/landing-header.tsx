"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/logo"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between mx-auto px-4">
        <div className="flex items-center gap-2">
          <Logo width={32} height={32} />
          <span className="text-xl font-bold">Effizienz Praxis</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#benefits"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Vorteile
          </a>
          <Link
            href="/preise"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Preise
          </Link>
          <Link
            href="/effizienz"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Effizienz
          </Link>
          <Link
            href="/academy"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Academy
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
