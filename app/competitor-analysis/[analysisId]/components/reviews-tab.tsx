"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Globe, TrendingUp } from "lucide-react"

interface PatientReviewsAnalysis {
  average_rating?: number
  total_reviews?: number
  common_praise?: string[]
  common_complaints?: string[]
  common_praise_topics?: string[]
  common_complaint_topics?: string[]
  opportunities_from_reviews?: string[]
  review_strategy?: string
}

interface OnlinePresence {
  importance?: string
  competitor_analysis?: string
  seo_opportunities?: string[]
  social_media_recommendations?: string[]
  review_management?: string
  website_quality?: {
    average_score?: number
    key_findings?: string[]
  }
  social_media_presence?: string
}

interface ReviewsTabProps {
  reviewsAnalysis?: PatientReviewsAnalysis | null
  onlinePresence?: OnlinePresence | null
}

export function ReviewsTab({ reviewsAnalysis, onlinePresence }: ReviewsTabProps) {
  const commonPraise = reviewsAnalysis?.common_praise || reviewsAnalysis?.common_praise_topics || []
  const commonComplaints = reviewsAnalysis?.common_complaints || reviewsAnalysis?.common_complaint_topics || []
  const opportunitiesFromReviews = reviewsAnalysis?.opportunities_from_reviews || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{commonPraise.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Positive Aspekte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{commonComplaints.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Kritikpunkte</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{opportunitiesFromReviews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Chancen aus Bewertungen</p>
          </CardContent>
        </Card>
      </div>

      {/* Common Praise */}
      {commonPraise.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <ThumbsUp className="h-5 w-5" />
              Häufig gelobte Aspekte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {commonPraise.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5 shrink-0">{'\u2713'}</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Common Complaints */}
      {commonComplaints.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <ThumbsDown className="h-5 w-5" />
              Häufige Kritikpunkte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {commonComplaints.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-red-500 mt-0.5 shrink-0">{'\u2717'}</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Opportunities from Reviews */}
      {opportunitiesFromReviews.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
              Chancen aus Bewertungsanalyse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {opportunitiesFromReviews.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-500 mt-0.5 shrink-0">{'\u2022'}</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Review Strategy */}
      {reviewsAnalysis?.review_strategy && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Bewertungsstrategie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reviewsAnalysis.review_strategy}</p>
          </CardContent>
        </Card>
      )}

      {/* Online Presence */}
      {onlinePresence && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Online-Präsenz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {onlinePresence.importance && (
              <p className="text-sm text-muted-foreground">{onlinePresence.importance}</p>
            )}
            {onlinePresence.competitor_analysis && (
              <div>
                <p className="text-sm font-medium mb-1">Konkurrenz-Websites</p>
                <p className="text-sm text-muted-foreground">{onlinePresence.competitor_analysis}</p>
              </div>
            )}
            {onlinePresence.seo_opportunities && onlinePresence.seo_opportunities.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">SEO-Chancen</p>
                <ul className="space-y-1">
                  {onlinePresence.seo_opportunities.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onlinePresence.review_management && (
              <div>
                <p className="text-sm font-medium mb-1">Bewertungsmanagement</p>
                <p className="text-sm text-muted-foreground">{onlinePresence.review_management}</p>
              </div>
            )}
            {onlinePresence.social_media_recommendations && onlinePresence.social_media_recommendations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Social-Media-Empfehlungen</p>
                <ul className="space-y-1">
                  {onlinePresence.social_media_recommendations.map((item: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!reviewsAnalysis && !onlinePresence && (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Keine Bewertungsanalyse verfügbar</p>
            <p className="text-sm text-muted-foreground mt-1">
              Starten Sie eine KI-Analyse, um Bewertungsdaten zu generieren
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
