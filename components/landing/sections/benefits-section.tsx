"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const benefits = [
  "KI-gestützte Analysen und priorisierte Optimierungsvorschläge",
  "Zentrale Verwaltung von Team, Workflows und Dokumenten",
  "Datenbasierte Entscheidungen durch Echtzeit-Analytics und KPIs",
  "Nahtlose Zusammenarbeit mit granularen Rollen und Berechtigungen",
  "Komplettes Recruiting-System reduziert Time-to-Hire",
  "DSGVO-konforme Datenhaltung mit höchsten Sicherheitsstandards",
  "Intuitiv bedienbar ohne aufwändige Schulungen",
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="w-full py-16 md:py-24 bg-muted/30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <ScrollReveal variant="fadeRight" className="mx-auto">
            <Image
              src="/medical-practice-team-collaboration-meeting.jpg"
              alt="Medizinisches Praxisteam bei der erfolgreichen Zusammenarbeit"
              width={500}
              height={400}
              className="rounded-xl border shadow-lg"
            />
          </ScrollReveal>
          <div className="space-y-6">
            <ScrollReveal variant="fadeLeft" delay={100}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Optimieren Sie Ihre Praxisführung nachhaltig
              </h2>
            </ScrollReveal>
            <ScrollReveal variant="fadeLeft" delay={200}>
              <p className="text-lg text-muted-foreground">
                Mit Effizienz Praxis steigern Sie die Produktivität Ihres Teams, verbessern die Patientenversorgung
                und treffen bessere Entscheidungen durch datenbasierte Insights.
              </p>
            </ScrollReveal>
            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <ScrollReveal key={index} variant="fadeLeft" delay={300 + index * 80}>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <Star className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
