"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { featuresData, getFeatureIcon } from "@/lib/features-data"
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Sparkles,
  Brain,
  Users,
  FileText,
  Calendar,
  Target,
  Settings,
  MessageSquare,
} from "lucide-react"

// Feature categories for filtering
const featureCategories = [
  {
    id: "all",
    name: "Alle Funktionen",
    icon: Sparkles,
    description: "Komplette Übersicht aller Funktionen",
  },
  {
    id: "analytics",
    name: "Analyse & KI",
    icon: Brain,
    slugs: ["ki-praxisanalyse", "praxis-auswertung"],
    description: "KI-gestützte Analysen und Auswertungen",
  },
  {
    id: "team",
    name: "Team & Personal",
    icon: Users,
    slugs: ["team-management"],
    description: "Personalverwaltung und Teamorganisation",
  },
  {
    id: "documentation",
    name: "Dokumentation",
    icon: FileText,
    slugs: ["dokumente"],
    description: "Dokumentenmanagement und Protokolle",
  },
  {
    id: "planning",
    name: "Planung & Organisation",
    icon: Calendar,
    slugs: ["kalender", "aufgaben"],
    description: "Terminplanung und Aufgabenmanagement",
  },
  {
    id: "strategy",
    name: "Strategie & Entwicklung",
    icon: Target,
    slugs: ["ziele"],
    description: "Strategische Praxisentwicklung",
  },
  {
    id: "resources",
    name: "Ressourcen & Inventar",
    icon: Settings,
    slugs: [],
    description: "Raum-, Geräte- und Materialverwaltung",
  },
  {
    id: "communication",
    name: "Kommunikation",
    icon: MessageSquare,
    slugs: ["nachrichten"],
    description: "Interne und externe Kommunikation",
  },
]

export default function AlleFunktionenPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Filter features based on search and category
  const filteredFeatures = useMemo(() => {
    let filtered = [...featuresData]

    // Filter by category
    if (activeCategory !== "all") {
      const category = featureCategories.find((c) => c.id === activeCategory)
      if (category?.slugs) {
        filtered = filtered.filter((f) => category.slugs?.includes(f.slug))
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.subtitle.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query),
      )
    }

    return filtered
  }, [searchQuery, activeCategory])

  return (
    <LandingPageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <Link href="/">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </Link>

          <div className="mx-auto text-center space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              {featuresData.length}+ Funktionen
            </div>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-balance leading-tight">
              Alle Funktionen im Überblick
            </h1>
            <p className="text-lg text-muted-foreground text-pretty mx-auto max-w-2xl">
              Entdecken Sie die komplette Funktionsvielfalt von Effizienz Praxis.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Funktionen durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {featureCategories.map((category) => {
              const CategoryIcon = category.icon
              const isActive = activeCategory === category.id
              const count =
                category.id === "all"
                  ? featuresData.length
                  : category.slugs?.filter((slug) => featuresData.some((f) => f.slug === slug)).length || 0

              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="gap-2 whitespace-nowrap shrink-0"
                >
                  <CategoryIcon className="h-4 w-4" />
                  {category.name}
                  <Badge variant={isActive ? "secondary" : "outline"} className="ml-1">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Keine Funktionen gefunden für "{searchQuery}"</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("")
                  setActiveCategory("all")
                }}
                className="mt-2"
              >
                Filter zurücksetzen
              </Button>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-8">
                <p className="text-muted-foreground">
                  {filteredFeatures.length} Funktion{filteredFeatures.length !== 1 ? "en" : ""} gefunden
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFeatures.map((feature) => {
                  const FeatureIcon = getFeatureIcon(feature.iconName)
                  return (
                    <Link key={feature.slug} href={`/features/${feature.slug}`} className="group">
                      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color} shrink-0`}
                            >
                              <FeatureIcon className="h-6 w-6" />
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </div>
                          <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                            {feature.title}
                          </CardTitle>
                          <CardDescription className="text-sm">{feature.subtitle}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-3">{feature.description}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {feature.benefits.slice(0, 3).map((benefit, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {benefit.title}
                              </Badge>
                            ))}
                            {feature.benefits.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{feature.benefits.length - 3} mehr
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-background rounded-xl border">
              <div className="text-4xl font-bold text-primary mb-2">{featuresData.length}+</div>
              <div className="text-sm text-muted-foreground">Funktionen</div>
            </div>
            <div className="text-center p-6 bg-background rounded-xl border">
              <div className="text-4xl font-bold text-primary mb-2">8</div>
              <div className="text-sm text-muted-foreground">Kategorien</div>
            </div>
            <div className="text-center p-6 bg-background rounded-xl border">
              <div className="text-4xl font-bold text-primary mb-2">KI</div>
              <div className="text-sm text-muted-foreground">Unterstützung</div>
            </div>
            <div className="text-center p-6 bg-background rounded-xl border">
              <div className="text-4xl font-bold text-primary mb-2">DSGVO</div>
              <div className="text-sm text-muted-foreground">Konform</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold">Bereit, Ihre Praxis zu transformieren?</h2>
            <p className="text-muted-foreground text-lg">Starten Sie noch heute mit Effizienz Praxis.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="w-full sm:w-auto">
                  Kostenlos testen
                </Button>
              </Link>
              <Link href="/preise">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Preise ansehen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </LandingPageLayout>
  )
}
