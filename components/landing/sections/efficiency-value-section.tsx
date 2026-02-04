"use client"

import { Heart, ShieldCheck, Award, Users, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"

const efficiencyBenefits = [
  {
    icon: Heart,
    label: "Weniger Stress",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    iconBg: "bg-rose-100 dark:bg-rose-500/20",
    border: "border-rose-200 dark:border-rose-500/30",
  },
  {
    icon: ShieldCheck,
    label: "Weniger Fehler",
    color: "text-emerald-500 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconBg: "bg-emerald-100 dark:bg-emerald-500/20",
    border: "border-emerald-200 dark:border-emerald-500/30",
  },
  {
    icon: Award,
    label: "Höhere Qualität",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    iconBg: "bg-amber-100 dark:bg-amber-500/20",
    border: "border-amber-200 dark:border-amber-500/30",
  },
  {
    icon: Users,
    label: "Zufriedenere Mitarbeitende",
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    iconBg: "bg-violet-100 dark:bg-violet-500/20",
    border: "border-violet-200 dark:border-violet-500/30",
  },
  {
    icon: TrendingUp,
    label: "Höhere Gewinne",
    color: "text-sky-500 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    iconBg: "bg-sky-100 dark:bg-sky-500/20",
    border: "border-sky-200 dark:border-sky-500/30",
  },
]

export function EfficiencyValueSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-cyan-500/5 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <ScrollReveal variant="fadeUp" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-medium text-primary">
              <ArrowRight className="h-4 w-4" />
              Warum Effizienz entscheidend ist
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={200}>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              <span className="text-foreground">Effiziente Praxis</span>
              <span className="mx-3 text-muted-foreground">=</span>
              <span className="bg-gradient-to-r from-primary via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                wirtschaftlich starke Praxis
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" delay={300}>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Effizienz bedeutet nicht nur Zeit sparen – es transformiert Ihre gesamte Praxis
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-8">
            {efficiencyBenefits.map((item, index) => (
              <ScrollReveal key={index} variant="fadeUp" delay={400 + index * 100}>
                <div
                  className={`group relative p-6 rounded-2xl ${item.bg} border ${item.border} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg h-full min-h-[160px] flex flex-col items-center justify-center`}
                >
                  <div
                    className={`mb-4 w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                  >
                    <item.icon className={`h-7 w-7 ${item.color}`} />
                  </div>
                  <p className="font-semibold text-foreground text-center">{item.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal variant="fadeUp" delay={900}>
            <div className="text-center mt-8">
              <Link
                href="/effizienz"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
              >
                <span>Mehr über Effizienz erfahren</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
