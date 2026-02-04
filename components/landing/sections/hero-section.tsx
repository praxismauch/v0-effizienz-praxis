"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { TypewriterText } from "../animated-text"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-20 bg-gradient-to-b from-background to-muted/20 flex-grow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <ScrollReveal variant="fadeDown" delay={100}>
            <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">
              Für medizinische Praxen, MVZ und Gesundheitszentren
            </div>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={200}>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-balance leading-tight">
              Die Plattform für
              <br />
              <TypewriterText 
                text="effizientes Praxismanagement" 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              />
            </h1>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={300}>
            <p className="text-lg text-muted-foreground text-pretty mx-auto">
              Revolutionieren Sie Ihre Praxisverwaltung mit{" "}
              <span className="relative inline-block">
                <span className="relative z-10 font-semibold bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  künstlicher Intelligenz
                </span>
                <span className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-r from-primary/20 via-blue-600/20 to-cyan-600/20 -z-0 rounded" />
              </span>
              . Komplette Lösung für Team-Management, Workflows, Recruiting, Wissen, Analytics und mehr. Alles in
              einer intelligenten, DSGVO-konformen Plattform.
            </p>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={400}>
            <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center">
              <Link href="/coming-soon">
                <Button size="lg" className="w-full sm:w-auto">
                  Jetzt vorregistrieren
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Hero Image/Demo Section */}
          <ScrollReveal variant="scaleUp" delay={500} duration={900}>
            <div className="relative mt-12 mx-auto">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted shadow-2xl">
                <Image
                  src="/modern-medical-practice-dashboard-with-analytics-a.jpg"
                  alt="Effizienz Praxis Dashboard mit KI-Analyse und Analytics"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
