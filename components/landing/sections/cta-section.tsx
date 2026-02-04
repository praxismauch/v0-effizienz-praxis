"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function CTASection() {
  return (
    <section className="w-full py-16 md:py-24 bg-blue-600">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="scaleIn" className="text-center space-y-6 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
            Bereit zu starten?
          </h2>
          <p className="text-xl text-white/90">
            Registrieren Sie sich jetzt kostenlos für die Warteliste und erhalten Sie frühzeitigen Zugang zu Effizienz
            Praxis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/coming-soon">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto bg-white text-blue-600 hover:bg-white/90"
              >
                Jetzt vorregistrieren
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto bg-transparent border-white/50 text-white hover:bg-white/10"
              >
                Zum Login
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
