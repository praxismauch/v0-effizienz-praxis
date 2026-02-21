"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, CheckCircle2, Globe, ExternalLink, Users } from "lucide-react"
import type { Competitor } from "../types"

interface CompetitorsTabProps {
  competitors?: Competitor[]
}

export function CompetitorsTab({ competitors }: CompetitorsTabProps) {
  if (!competitors || competitors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Keine Wettbewerber-Daten verfuegbar</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {competitors.map((competitor: Competitor, index: number) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{competitor.name}</CardTitle>
            {competitor.address && (
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {competitor.address}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {competitor.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{competitor.rating}</span>
                {competitor.review_count && (
                  <span className="text-sm text-muted-foreground">
                    ({competitor.review_count} Bewertungen)
                  </span>
                )}
              </div>
            )}
            {competitor.specialties && (
              <div>
                <div className="text-xs font-medium mb-1">Fachbereiche</div>
                <div className="flex flex-wrap gap-1">
                  {competitor.specialties.map((specialty: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {competitor.strengths && (
              <div>
                <div className="text-xs font-medium mb-1">Stärken</div>
                <ul className="space-y-1">
                  {competitor.strengths.slice(0, 3).map((strength: string, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {competitor.website && (
              <Button variant="outline" size="sm" className="w-full bg-transparent" asChild>
                <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                  <Globe className="h-3 w-3 mr-1" />
                  Website besuchen
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
