"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  User,
  Briefcase,
  MapPin,
  Heart,
  Target,
  MessageSquare,
  Euro,
  Lightbulb,
  CheckCircle,
  X,
  Sparkles,
  Activity,
  Car,
  Brain,
  Stethoscope,
} from "lucide-react"
import { useState } from "react"

interface WunschpatientProfile {
  id: string
  name: string
  age_range: string
  gender: string
  occupation: string
  family_status: string
  archetype: string
  health_concerns: string[]
  lifestyle_factors: string[]
  values: string[]
  expectations: string[]
  health_consciousness: string
  prevention_vs_acute: string
  communication_preference: string
  financial_willingness: string
  location_area: string
  transport_method: string
  services_interested: string[]
  persona_description: string
  marketing_strategy: string
  communication_tips: string
  service_recommendations: string[]
  ai_generated_image_url: string
  is_active: boolean
  created_at: string
}

interface ViewWunschpatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: WunschpatientProfile
}

export function ViewWunschpatientDialog({ open, onOpenChange, profile }: ViewWunschpatientDialogProps) {
  const [imageError, setImageError] = useState(false)

  const getArchetypeLabel = (archetype: string) => {
    const labels: Record<string, string> = {
      prevention: "Präventionsorientiert",
      chronic: "Chronischer Patient",
      performance: "Leistungsorientiert",
      acute: "Akut-Patient",
      relationship: "Beziehungstyp",
    }
    return labels[archetype] || archetype
  }

  const getArchetypeColor = (archetype: string) => {
    const colors: Record<string, string> = {
      prevention: "bg-green-500",
      chronic: "bg-blue-500",
      performance: "bg-orange-500",
      acute: "bg-red-500",
      relationship: "bg-pink-500",
    }
    return colors[archetype] || "bg-primary"
  }

  const getFamilyStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      single: "Single",
      partnership: "In Partnerschaft",
      married: "Verheiratet",
      married_children: "Verheiratet mit Kindern",
      single_parent: "Alleinerziehend",
    }
    return labels[status] || status
  }

  const getHealthConsciousnessLabel = (level: string) => {
    const labels: Record<string, string> = {
      very_high: "Sehr hoch",
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    }
    return labels[level] || level
  }

  const getFinancialWillingnessLabel = (level: string) => {
    const labels: Record<string, string> = {
      very_high: "Sehr hoch",
      high: "Hoch",
      medium: "Mittel",
      low: "Niedrig",
    }
    return labels[level] || level
  }

  const getCommunicationLabel = (pref: string) => {
    const labels: Record<string, string> = {
      digital: "Digital",
      phone: "Telefon",
      in_person: "Persönlich",
      mixed: "Gemischt",
    }
    return labels[pref] || pref
  }

  const getTransportLabel = (transport: string) => {
    const labels: Record<string, string> = {
      car: "Auto",
      public_transport: "ÖPNV",
      bike: "Fahrrad",
      walking: "Zu Fuß",
    }
    return labels[transport] || transport
  }

  const placeholderQuery = encodeURIComponent(
    `professionelles Portrait ${profile.gender === "female" ? "Frau" : "Mann"} ${profile.age_range} Jahre ${profile.occupation || "Person"} freundlich lächelnd Fotostudio`,
  )

  const imageUrl = imageError
    ? `/placeholder.svg?height=400&width=400&query=${placeholderQuery}`
    : profile.ai_generated_image_url || `/placeholder.svg?height=400&width=400&query=${placeholderQuery}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
        <div
          className={`relative ${getArchetypeColor(profile.archetype)} bg-gradient-to-br from-primary/90 to-primary`}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Header content */}
          <div className="px-8 py-8 flex items-end gap-6">
            {/* Profile image */}
            <div className="relative -mb-16 z-10">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-background shadow-xl bg-background">
                <img
                  src={imageUrl || "/placeholder.svg"}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
              {profile.is_active && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Title and badges */}
            <div className="flex-1 pb-2">
              <h2 className="text-3xl font-bold text-white mb-2">{profile.name}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {getArchetypeLabel(profile.archetype)}
                </Badge>
                <span className="text-white/80 text-sm flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {profile.age_range} Jahre, {profile.gender === "female" ? "weiblich" : "männlich"}
                </span>
                {profile.occupation && (
                  <span className="text-white/80 text-sm flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {profile.occupation}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <ScrollArea className="max-h-[calc(95vh-180px)]">
          <div className="px-8 pt-20 pb-8 space-y-6">
            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {profile.family_status && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                      <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Familienstand</p>
                      <p className="font-medium text-sm">{getFamilyStatusLabel(profile.family_status)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.location_area && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Wohngebiet</p>
                      <p className="font-medium text-sm">{profile.location_area}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.communication_preference && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kommunikation</p>
                      <p className="font-medium text-sm">{getCommunicationLabel(profile.communication_preference)}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.financial_willingness && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Euro className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Zahlungsbereitschaft</p>
                      <p className="font-medium text-sm">
                        {getFinancialWillingnessLabel(profile.financial_willingness)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Persona Description - Featured */}
            {profile.persona_description && (
              <Card className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">Persona-Beschreibung</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {profile.persona_description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Two column layout for tags */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Health & Lifestyle */}
              <Card>
                <CardContent className="p-6 space-y-5">
                  {profile.health_concerns && profile.health_concerns.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                          <Stethoscope className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <h4 className="font-medium">Gesundheitsthemen</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.health_concerns.map((concern) => (
                          <Badge
                            key={concern}
                            variant="secondary"
                            className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                          >
                            {concern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.lifestyle_factors && profile.lifestyle_factors.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h4 className="font-medium">Lebensstil</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.lifestyle_factors.map((factor) => (
                          <Badge
                            key={factor}
                            variant="secondary"
                            className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
                          >
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.health_consciousness && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground">Gesundheitsbewusstsein</span>
                      <Badge variant="outline">{getHealthConsciousnessLabel(profile.health_consciousness)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Values & Expectations */}
              <Card>
                <CardContent className="p-6 space-y-5">
                  {profile.values && profile.values.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Heart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h4 className="font-medium">Werte</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.values.map((value) => (
                          <Badge
                            key={value}
                            variant="outline"
                            className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                          >
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.expectations && profile.expectations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="font-medium">Erwartungen</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {profile.expectations.map((exp) => (
                          <Badge
                            key={exp}
                            variant="outline"
                            className="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                          >
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.transport_method && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" /> Anreise
                      </span>
                      <Badge variant="outline">{getTransportLabel(profile.transport_method)}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Marketing & Tips Section */}
            <div className="space-y-6">
              {profile.marketing_strategy && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Target className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Marketingstrategie</h3>
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        try {
                          const items = JSON.parse(profile.marketing_strategy)
                          if (Array.isArray(items)) {
                            return items.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60 shrink-0" />
                                <p className="text-muted-foreground leading-relaxed">{item}</p>
                              </div>
                            ))
                          }
                          return (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {profile.marketing_strategy}
                            </p>
                          )
                        } catch {
                          return (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {profile.marketing_strategy}
                            </p>
                          )
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {profile.communication_tips && (
                <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-yellow-200 dark:bg-yellow-800/50">
                        <Lightbulb className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <h3 className="font-semibold text-lg">Kommunikationstipps</h3>
                    </div>
                    <div className="space-y-2">
                      {(() => {
                        try {
                          const items = JSON.parse(profile.communication_tips)
                          if (Array.isArray(items)) {
                            return items.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className="mt-1.5 h-2 w-2 rounded-full bg-yellow-500 shrink-0" />
                                <p className="text-muted-foreground leading-relaxed">{item}</p>
                              </div>
                            ))
                          }
                          return (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {profile.communication_tips}
                            </p>
                          )
                        } catch {
                          return (
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {profile.communication_tips}
                            </p>
                          )
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Service Recommendations */}
            {profile.service_recommendations && profile.service_recommendations.length > 0 && (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-green-200 dark:bg-green-800/50">
                      <Sparkles className="h-4 w-4 text-green-700 dark:text-green-400" />
                    </div>
                    <h3 className="font-semibold">Empfohlene Leistungen</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {profile.service_recommendations.map((service, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services Interested */}
            {profile.services_interested && profile.services_interested.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                      <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h3 className="font-semibold">Interessiert an</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.services_interested.map((service) => (
                      <Badge
                        key={service}
                        variant="secondary"
                        className="bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
