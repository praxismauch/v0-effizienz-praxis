"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, CheckCircle2, Lightbulb, Cog, HelpCircle } from "lucide-react"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { LandingPageChatbot } from "@/components/landing-page-chatbot"
import { LandingPageHeader } from "@/components/landing-page-header"
import { LandingPageFooter } from "@/components/landing-page-footer"

function extractTextColor(colorString: string | undefined): string {
  if (!colorString) return "text-primary"
  const parts = colorString.split(" ")
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("text-")) return parts[i]
  }
  return "text-primary"
}

function extractBgColor(colorString: string | undefined): string {
  if (!colorString) return "bg-primary/10"
  const parts = colorString.split(" ")
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("bg-")) return parts[i]
  }
  return "bg-primary/10"
}

export interface FeaturePageProps {
  title: string
  subtitle: string
  description: string
  detailedDescription?: {
    intro: string
    howItWorks: string
    whyItHelps: string
  }
  icon: any // LucideIcon
  color: string
  heroImage?: string
  benefits: {
    title: string
    description: string
  }[]
  features: {
    title: string
    description: string
    icon: any // LucideIcon
  }[]
  useCases?: {
    title: string
    description: string
  }[]
  faq?: {
    question: string
    answer: string
  }[]
  relatedFeatures?: {
    title: string
    href: string
    icon: any // LucideIcon
    color: string
  }[]
}

function DynamicIcon({ icon: IconComponent, className }: { icon: any; className?: string }) {
  return <IconComponent className={className} />
}

export function FeaturePageTemplate({
  title,
  subtitle,
  description,
  detailedDescription,
  icon: Icon,
  color,
  heroImage,
  benefits,
  features,
  useCases,
  faq,
  relatedFeatures,
}: FeaturePageProps) {
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  const benefitTextColor = extractTextColor(color)

  return (
    <div className="min-h-screen bg-background">
      {/* Landing Page Header */}
      <LandingPageHeader />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="mb-8">
            <Link href="/#features">
              <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal variant="fadeRight">
              <div className="space-y-6">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${color}`}>
                  <Icon className="h-10 w-10" />
                </div>
                <Badge variant="secondary" className="mb-2">
                  Effizienz Praxis Feature
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">{title}</h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium">{subtitle}</p>
                <p className="text-lg text-muted-foreground leading-relaxed">{description}</p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="/coming-soon">
                    <Button size="lg" className="w-full sm:w-auto">
                      Jetzt starten
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/#features">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                      Alle Features entdecken
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal variant="fadeLeft">
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center">
                  <Icon className="h-32 w-32 text-primary/40" />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {detailedDescription && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Was ist {title}?</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Erfahren Sie im Detail, wie diese Funktion Ihnen hilft, Ihre Praxis effizienter zu führen.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-8">
              <ScrollReveal variant="fadeUp">
                <Card className="h-full border-none shadow-lg bg-background">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                      <Lightbulb className="h-7 w-7 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Überblick</h3>
                    <p className="text-muted-foreground leading-relaxed">{detailedDescription.intro}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal variant="fadeUp">
                <Card className="h-full border-none shadow-lg bg-background">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                      <Cog className="h-7 w-7 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">So funktioniert es</h3>
                    <p className="text-muted-foreground leading-relaxed">{detailedDescription.howItWorks}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>

              <ScrollReveal variant="fadeUp">
                <Card className="h-full border-none shadow-lg bg-background">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                      <HelpCircle className="h-7 w-7 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">Warum es hilft</h3>
                    <p className="text-muted-foreground leading-relaxed">{detailedDescription.whyItHelps}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ihre Vorteile</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Entdecken Sie, wie {title} Ihren Praxisalltag verbessert
              </p>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const bgColorClass = extractBgColor(color)
              return (
                <ScrollReveal key={index} variant="fadeUp">
                  <Card className="h-full min-h-[200px] border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-card">
                    <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                      {/* Icon with colored background */}
                      <div
                        className={`flex-shrink-0 w-16 h-16 rounded-2xl ${bgColorClass} flex items-center justify-center mb-4`}
                      >
                        <CheckCircle2 className={`h-8 w-8 ${benefitTextColor}`} />
                      </div>
                      {/* Content */}
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold tracking-tight">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fadeUp">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Funktionen im Detail</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Leistungsstarke Tools für Ihren Erfolg</p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <ScrollReveal key={index} variant={index % 2 === 0 ? "fadeRight" : "fadeLeft"}>
                <Card className="h-full border-none shadow-md">
                  <CardContent className="p-8">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${color} mb-6`}>
                      <DynamicIcon icon={feature.icon} className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      {useCases && useCases.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Anwendungsbeispiele</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  So setzen andere Praxen {title} erfolgreich ein
                </p>
              </div>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-8">
              {useCases.map((useCase, index) => (
                <ScrollReveal key={index} variant="fadeUp">
                  <Card className="h-full border-2 border-primary/10 hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="text-4xl font-bold text-primary/20 mb-4">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h3 className="font-semibold mb-2">{useCase.title}</h3>
                      <p className="text-muted-foreground">{useCase.description}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faq && faq.length > 0 && (
        <section className="py-20 bg-muted/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Häufige Fragen</h2>
                <p className="text-lg text-muted-foreground">Antworten auf Ihre Fragen zu {title}</p>
              </div>
            </ScrollReveal>
            <div className="space-y-6">
              {faq.map((item, index) => (
                <ScrollReveal key={index} variant="fadeUp">
                  <Card className="border-none shadow-md">
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-3">{item.question}</h3>
                      <p className="text-muted-foreground">{item.answer}</p>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Features Section */}
      {relatedFeatures && relatedFeatures.length > 0 && (
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fadeUp">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Verwandte Funktionen</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Entdecken Sie weitere Features, die perfekt zu {title} passen
                </p>
              </div>
            </ScrollReveal>
            <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
              {relatedFeatures.map((feature, index) => {
                const bgColorClass = extractBgColor(feature.color)
                const textColorClass = extractTextColor(feature.color)
                return (
                  <ScrollReveal key={index} variant="scaleUp">
                    <Link href={feature.href}>
                      <Card className="w-[280px] h-[180px] border-none shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
                          <div
                            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${bgColorClass} mb-4`}
                          >
                            <DynamicIcon icon={feature.icon} className={`h-6 w-6 ${textColorClass}`} />
                          </div>
                          <h3 className="font-semibold">{feature.title}</h3>
                        </CardContent>
                      </Card>
                    </Link>
                  </ScrollReveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal variant="fadeUp">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Bereit, {title} zu nutzen?</h2>
            <p className="text-xl mb-8 opacity-90">
              Starten Sie jetzt und erleben Sie, wie Effizienz Praxis Ihren Arbeitsalltag transformiert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/coming-soon">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Kostenlos testen
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10"
                >
                  Mehr erfahren
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <LandingPageFooter />

      {/* Floating Chatbot */}
      <LandingPageChatbot />
    </div>
  )
}

export default FeaturePageTemplate
