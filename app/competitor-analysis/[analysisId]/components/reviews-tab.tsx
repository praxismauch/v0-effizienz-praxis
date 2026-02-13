"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react"
import type { CompetitorAnalysis, Review } from "../types"

interface ReviewsTabProps {
  analysis: CompetitorAnalysis
}

export function ReviewsTab({ analysis }: ReviewsTabProps) {
  const reviews: Review[] = analysis.reviews || []

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "N/A"

  const positiveCount = reviews.filter(r => (r.rating || 0) >= 4).length
  const negativeCount = reviews.filter(r => (r.rating || 0) < 3).length

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{avgRating}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Durchschnittsbewertung</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{reviews.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Bewertungen gesamt</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{positiveCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Positive</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold">{negativeCount}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Negative</p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Keine Bewertungen erfasst
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{review.author || "Anonym"}</CardTitle>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < (review.rating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </div>
                {review.date && (
                  <CardDescription>{new Date(review.date).toLocaleDateString("de-DE")}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm">{review.text}</p>
                {review.source && (
                  <Badge variant="outline" className="mt-2">{review.source}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
