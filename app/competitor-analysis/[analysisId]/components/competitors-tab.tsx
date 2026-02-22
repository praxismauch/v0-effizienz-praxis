"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Star,
  CheckCircle2,
  Globe,
  ExternalLink,
  Users,
  AlertTriangle,
  Phone,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"

interface GoogleRating {
  rating: number
  review_count: number
  rating_distribution?: Record<string, number>
  recent_trend?: string
  average_response_time?: string
}

interface JamedaRating {
  rating: number
  review_count: number
  recommendation_rate?: string
}

interface SanegoRating {
  rating: number
  review_count: number
}

interface CompetitorData {
  name: string
  address?: string
  specialty?: string
  phone?: string
  website?: string
  strengths?: string[]
  weaknesses?: string[]
  estimated_patient_volume?: string
  unique_selling_points?: string[]
  google_rating?: GoogleRating | number
  jameda_rating?: JamedaRating | number
  sanego_rating?: SanegoRating | number
  rating?: number
  review_count?: number
  specialties?: string[]
  website_quality?: string
  online_presence_score?: number
  social_media?: Record<string, boolean>
  threat_level?: string
  distance_km?: number
}

interface CompetitorsTabProps {
  competitors?: CompetitorData[]
  dataSource?: string
}

function getThreatColor(level?: string): string {
  switch (level?.toLowerCase()) {
    case "hoch":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    case "mittel":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "niedrig":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
  }
}

function getTrendIcon(trend?: string) {
  switch (trend?.toLowerCase()) {
    case "steigend":
      return <TrendingUp className="h-3 w-3 text-green-500" />
    case "fallend":
      return <TrendingDown className="h-3 w-3 text-red-500" />
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />
  }
}

function getGoogleRating(competitor: CompetitorData): { rating: number; count: number; trend?: string } | null {
  if (typeof competitor.google_rating === "object" && competitor.google_rating) {
    return {
      rating: competitor.google_rating.rating,
      count: competitor.google_rating.review_count,
      trend: competitor.google_rating.recent_trend,
    }
  }
  if (competitor.rating) {
    return { rating: competitor.rating, count: competitor.review_count || 0 }
  }
  return null
}

function getJamedaRating(competitor: CompetitorData): { rating: number; count: number; recRate?: string } | null {
  if (typeof competitor.jameda_rating === "object" && competitor.jameda_rating) {
    return {
      rating: competitor.jameda_rating.rating,
      count: competitor.jameda_rating.review_count,
      recRate: competitor.jameda_rating.recommendation_rate,
    }
  }
  return null
}

export function CompetitorsTab({ competitors, dataSource }: CompetitorsTabProps) {
  if (!competitors || competitors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Wettbewerber-Daten verfügbar</p>
          <p className="text-sm text-muted-foreground mt-1">
            Starten Sie eine KI-Analyse, um Wettbewerber zu identifizieren
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {competitors.length} Wettbewerber identifiziert
        </p>
        {dataSource === "google-places" ? (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <Globe className="h-3 w-3 mr-1" />
            Google-verifiziert
          </Badge>
        ) : (
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            KI-geschätzt
          </Badge>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {competitors.map((competitor, index) => {
          const google = getGoogleRating(competitor)
          const jameda = getJamedaRating(competitor)

          return (
            <Card key={index} className="relative overflow-hidden">
              {/* Threat level indicator bar */}
              {competitor.threat_level && (
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    competitor.threat_level.toLowerCase() === "hoch"
                      ? "bg-red-500"
                      : competitor.threat_level.toLowerCase() === "mittel"
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                />
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{competitor.name}</CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    {competitor.threat_level && (
                      <Badge className={getThreatColor(competitor.threat_level)} variant="secondary">
                        {competitor.threat_level}
                      </Badge>
                    )}
                  </div>
                </div>
                {competitor.address && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {competitor.address}
                    {competitor.distance_km && (
                      <span className="ml-1 text-primary font-medium">({competitor.distance_km} km)</span>
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Ratings */}
                <div className="flex flex-wrap gap-3">
                  {google && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{google.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({google.count})
                      </span>
                      {google.trend && getTrendIcon(google.trend)}
                      <span className="text-xs text-muted-foreground">Google</span>
                    </div>
                  )}
                  {jameda && (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-blue-400 text-blue-400" />
                      <span className="font-semibold">{jameda.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({jameda.count}) Jameda
                      </span>
                    </div>
                  )}
                </div>

                {/* Strengths */}
                {competitor.strengths && competitor.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Stärken</p>
                    <ul className="space-y-0.5">
                      {competitor.strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-medium mb-1">Schwächen</p>
                    <ul className="space-y-0.5">
                      {competitor.weaknesses.slice(0, 2).map((w, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                          <XCircle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* USPs */}
                {competitor.unique_selling_points && competitor.unique_selling_points.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {competitor.unique_selling_points.map((usp, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {usp}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Footer info */}
                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {competitor.estimated_patient_volume && (
                      <span>{competitor.estimated_patient_volume} Pat./Quartal</span>
                    )}
                    {competitor.website_quality && (
                      <span>Web: {competitor.website_quality}</span>
                    )}
                  </div>
                  {competitor.website && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
                      <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-3 w-3 mr-1" />
                        Website
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {competitor.phone && !competitor.website && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" asChild>
                      <a href={`tel:${competitor.phone}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        {competitor.phone}
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
