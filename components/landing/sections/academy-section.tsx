"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, BookOpen, Award, Users, ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const academyFeatures = [
  {
    icon: BookOpen,
    title: "Praxis-Kurse",
    description: "Von QM bis Teamführung - praxisnahe Inhalte für den Alltag",
  },
  {
    icon: Award,
    title: "Zertifizierungen",
    description: "Offizielle Nachweise für Ihre Qualifikationen",
  },
  {
    icon: Users,
    title: "Team-Schulungen",
    description: "Gemeinsam lernen und die Praxis verbessern",
  },
]

export function AcademySection() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal variant="fadeUp" delay={100}>
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 dark:bg-amber-900/50 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                <GraduationCap className="h-4 w-4" />
                Coming Soon
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Effizienz-Academy</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Lernen Sie, wie Sie Ihre Praxis auf das nächste Level bringen. Praxisnahe Kurse, Zertifizierungen und
                Weiterbildungen für Ihr gesamtes Team.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={200}>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {academyFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-white/80 dark:bg-card/80 backdrop-blur-sm border-amber-200/50 dark:border-amber-800/30"
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={300}>
            <div className="mt-10 text-center">
              <Link href="/academy">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50 bg-transparent"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Mehr erfahren
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
