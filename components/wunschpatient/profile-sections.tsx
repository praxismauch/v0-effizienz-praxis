"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Heart,
  MapPin,
  MessageSquare,
  Euro,
  Target,
  Lightbulb,
  CheckCircle,
  Sparkles,
  Activity,
  Car,
  Brain,
  Stethoscope,
  User,
} from "lucide-react"
import {
  getFamilyStatusLabel,
  getHealthConsciousnessLabel,
  getFinancialWillingnessLabel,
  getCommunicationLabel,
  getTransportLabel,
} from "./wunschpatient-labels"

interface WunschpatientProfile {
  family_status: string
  location_area: string
  communication_preference: string
  financial_willingness: string
  health_concerns: string[]
  lifestyle_factors: string[]
  health_consciousness: string
  values: string[]
  expectations: string[]
  transport_method: string
  persona_description: string
  marketing_strategy: string
  communication_tips: string
  services_interested: string[]
  service_recommendations: string[]
}

function QuickStatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  label: string
  value: string
}) {
  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-medium text-sm">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function QuickStats({ profile }: { profile: WunschpatientProfile }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {profile.family_status && (
        <QuickStatCard
          icon={Heart}
          iconBg="bg-pink-100 dark:bg-pink-900/30"
          iconColor="text-pink-600 dark:text-pink-400"
          label="Familienstand"
          value={getFamilyStatusLabel(profile.family_status)}
        />
      )}
      {profile.location_area && (
        <QuickStatCard
          icon={MapPin}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="Wohngebiet"
          value={profile.location_area}
        />
      )}
      {profile.communication_preference && (
        <QuickStatCard
          icon={MessageSquare}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          label="Kommunikation"
          value={getCommunicationLabel(profile.communication_preference)}
        />
      )}
      {profile.financial_willingness && (
        <QuickStatCard
          icon={Euro}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          label="Zahlungsbereitschaft"
          value={getFinancialWillingnessLabel(profile.financial_willingness)}
        />
      )}
    </div>
  )
}

export function PersonaDescription({ description }: { description: string }) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-semibold">Persona-Beschreibung</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}

function TagSection({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  tags,
  tagClass,
  variant = "secondary",
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  tags: string[]
  tagClass?: string
  variant?: "secondary" | "outline"
}) {
  if (!tags || tags.length === 0) return null
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <h4 className="font-medium">{title}</h4>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant={variant} className={tagClass}>
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function HealthLifestyleCard({ profile }: { profile: WunschpatientProfile }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <TagSection
          icon={Stethoscope}
          iconBg="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          title="Gesundheitsthemen"
          tags={profile.health_concerns}
          tagClass="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
        />
        <TagSection
          icon={Activity}
          iconBg="bg-orange-100 dark:bg-orange-900/30"
          iconColor="text-orange-600 dark:text-orange-400"
          title="Lebensstil"
          tags={profile.lifestyle_factors}
          tagClass="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
        />
        {profile.health_consciousness && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <span className="text-sm text-muted-foreground">Gesundheitsbewusstsein</span>
            <Badge variant="outline">{getHealthConsciousnessLabel(profile.health_consciousness)}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ValuesExpectationsCard({ profile }: { profile: WunschpatientProfile }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-5">
        <TagSection
          icon={Heart}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          title="Werte"
          tags={profile.values}
          variant="outline"
          tagClass="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
        />
        <TagSection
          icon={Target}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          title="Erwartungen"
          tags={profile.expectations}
          variant="outline"
          tagClass="border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
        />
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
  )
}

function ParsedListOrText({ text, dotColor }: { text: string; dotColor: string }) {
  try {
    const items = JSON.parse(text)
    if (Array.isArray(items)) {
      return (
        <>
          {items.map((item: string, idx: number) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`mt-1.5 h-2 w-2 rounded-full ${dotColor} shrink-0`} />
              <p className="text-muted-foreground leading-relaxed">{item}</p>
            </div>
          ))}
        </>
      )
    }
  } catch { /* not JSON */ }
  return <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{text}</p>
}

export function MarketingStrategyCard({ strategy }: { strategy: string }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <h3 className="font-semibold text-lg">Marketingstrategie</h3>
        </div>
        <div className="space-y-2">
          <ParsedListOrText text={strategy} dotColor="bg-primary/60" />
        </div>
      </CardContent>
    </Card>
  )
}

export function CommunicationTipsCard({ tips }: { tips: string }) {
  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-800/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-yellow-200 dark:bg-yellow-800/50">
            <Lightbulb className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
          </div>
          <h3 className="font-semibold text-lg">Kommunikationstipps</h3>
        </div>
        <div className="space-y-2">
          <ParsedListOrText text={tips} dotColor="bg-yellow-500" />
        </div>
      </CardContent>
    </Card>
  )
}

export function ServiceRecommendationsCard({ services }: { services: string[] }) {
  if (!services || services.length === 0) return null
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-800/30">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-green-200 dark:bg-green-800/50">
            <Sparkles className="h-4 w-4 text-green-700 dark:text-green-400" />
          </div>
          <h3 className="font-semibold">Empfohlene Leistungen</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-2">
          {services.map((service, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-white/60 dark:bg-white/5">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm">{service}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function ServicesInterestedCard({ services }: { services: string[] }) {
  if (!services || services.length === 0) return null
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
            <Brain className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h3 className="font-semibold">Interessiert an</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
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
  )
}
