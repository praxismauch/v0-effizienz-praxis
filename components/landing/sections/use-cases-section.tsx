"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Settings, Users, Heart, BookOpen, TrendingUp, Briefcase, Target } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const useCases = [
  { title: "Praxismanagement", description: "Effiziente Verwaltung aller Praxisabläufe.", icon: Settings },
  {
    title: "Teamkoordination",
    description: "Optimale Organisation und Kommunikation im Team.",
    icon: Users,
  },
  {
    title: "Patientenmanagement",
    description: "Fokus auf Patienten durch weniger Administration.",
    icon: Heart,
  },
  {
    title: "Qualitätsmanagement",
    description: "SOPs, QM-Dokumente und Weiterbildung im Griff.",
    icon: BookOpen,
  },
  {
    title: "Finanz- & Leistungscontrolling",
    description: "KPIs und Analysen für wirtschaftlichen Erfolg.",
    icon: TrendingUp,
  },
  {
    title: "Recruiting & Personal",
    description: "Schneller und gezielter neue Mitarbeiter finden.",
    icon: Briefcase,
  },
]

export function UseCasesSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16 max-w-2xl mx-auto">
          <ScrollReveal variant="fadeUp" delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Target className="h-4 w-4" />
              Anwendungsfälle
            </div>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={200}>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Ideal für jede Praxisgröße und Fachrichtung
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={300}>
            <p className="text-xl text-muted-foreground">
              Entdecken Sie, wie Effizienz Praxis Ihre spezifischen Herausforderungen lösen kann.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((item, index) => (
            <ScrollReveal key={index} variant="fadeUp" delay={100 + index * 50}>
              <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 mb-4">
                    <item.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
