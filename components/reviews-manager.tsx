"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ReviewImportDialog from "@/components/review-import-dialog"
import { Star, Plus, ExternalLink, Calendar, MessageSquare, RefreshCw, Filter, Search, Upload, Reply, Sparkles, Loader2, Send } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useUser } from "@/contexts/user-context"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "@/components/ui/use-toast"

interface Review {
  id: string
  reviewer_name: string | null
  rating: number
  review_text: string | null
  review_date: string | null
  response_text: string | null
  response_date: string | null
  created_at: string
}

interface PlatformStats {
  count: number
  average: number
  distribution: number[]
}

interface PlatformData {
  reviews: Review[]
  stats: PlatformStats
}

interface ReviewsData {
  google: PlatformData
  jameda: PlatformData
  sanego: PlatformData
}

const platformConfig = {
  google: {
    name: "Google",
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: "🔵",
    url: "https://business.google.com",
  },
  jameda: {
    name: "Jameda",
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: "🟢",
    url: "https://www.jameda.de",
  },
  sanego: {
    name: "Sanego",
    color: "bg-orange-500",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: "🟠",
    url: "https://www.sanego.de",
  },
}

function ReviewsManager({ practiceId: propPracticeId }: { practiceId?: string } = {}) {
  const { currentUser, currentPractice } = useUser()
  const practiceId = propPracticeId || currentPractice?.id?.toString()

  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<"google" | "jameda" | "sanego">("google")
  const [filterRating, setFilterRating] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [replyingToReview, setReplyingToReview] = useState<Review & { platform: "google" | "jameda" | "sanego" } | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [isSavingReply, setIsSavingReply] = useState(false)

  // Form state for adding reviews
  const [newReview, setNewReview] = useState({
    reviewer_name: "",
    rating: 5,
    review_text: "",
    review_date: format(new Date(), "yyyy-MM-dd"),
  })

  useEffect(() => {
    if (practiceId) {
      loadReviews()
    } else {
      setIsLoading(false)
    }
  }, [practiceId])

  const loadReviews = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bewertungen können nicht geladen werden.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviewsData(data)
      } else {
        toast({
          title: "Fehler",
          description: "Bewertungen konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading reviews:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Bewertungen.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddReview = async () => {
    if (!practiceId || !newReview.reviewer_name) {
      toast({
        title: "Fehler",
        description: !practiceId
          ? "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu."
          : "Bitte geben Sie einen Reviewer-Namen ein.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: selectedPlatform,
          review: newReview,
        }),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Bewertung erfolgreich hinzugefügt.",
        })
        setShowAddDialog(false)
        setNewReview({
          reviewer_name: "",
          rating: 5,
          review_text: "",
          review_date: format(new Date(), "yyyy-MM-dd"),
        })
        loadReviews()
      } else {
        toast({
          title: "Fehler",
          description: "Bewertung konnte nicht hinzugefügt werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding review:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Hinzufügen der Bewertung.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClass = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-6 w-6" : "h-4 w-4"
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    )
  }

  const getTotalStats = () => {
    if (!reviewsData) return { total: 0, average: 0, trend: 0 }

    const allReviews = [...reviewsData.google.reviews, ...reviewsData.jameda.reviews, ...reviewsData.sanego.reviews]

    const total = allReviews.length
    const average = total > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0

    return { total, average, trend: 0.2 } // Trend would be calculated from historical data
  }

  const filterReviews = (reviews: Review[]) => {
    return reviews.filter((review) => {
      const matchesRating = filterRating === "all" || review.rating === Number.parseInt(filterRating)
      const matchesSearch =
        !searchQuery ||
        review.reviewer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        review.review_text?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesRating && matchesSearch
    })
  }

  const fetchReviews = () => {
    loadReviews()
  }

  if (!practiceId) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Star className="h-16 w-16 mx-auto text-muted-foreground/20" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Keine Praxis-ID verfügbar</h3>
              <p className="text-muted-foreground">
                Bitte stellen Sie sicher, dass Sie einer Praxis zugeordnet sind.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bewertungen</h2>
          <p className="text-muted-foreground">Verwalten Sie Ihre Online-Bewertungen von allen Plattformen</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowImportDialog(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importieren
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Bewertung hinzufügen
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Bewertungen verwalten
              </CardTitle>
              <CardDescription>Alle Bewertungen von Google, Jameda und Sanego</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadReviews}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Aktualisieren
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="google" className="gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Google ({reviewsData?.google?.stats?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="jameda" className="gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Jameda ({reviewsData?.jameda?.stats?.count || 0})
                </TabsTrigger>
                <TabsTrigger value="sanego" className="gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  Sanego ({reviewsData?.sanego?.stats?.count || 0})
                </TabsTrigger>
              </TabsList>

              {activeTab !== "overview" && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="w-32">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="5">5 Sterne</SelectItem>
                      <SelectItem value="4">4 Sterne</SelectItem>
                      <SelectItem value="3">3 Sterne</SelectItem>
                      <SelectItem value="2">2 Sterne</SelectItem>
                      <SelectItem value="1">1 Stern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <TabsContent value="overview" className="space-y-6">
              {/* Platform Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["google", "jameda", "sanego"] as const).map((platform) => {
                  const config = platformConfig[platform]
                  const data = reviewsData?.[platform]
                  const stats = data?.stats || { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] }

                  return (
                    <Card key={platform} className={`${config.bgColor} ${config.borderColor} border`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className={`text-lg ${config.textColor}`}>{config.name}</CardTitle>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={config.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-3xl font-bold">{stats.average.toFixed(1)}</div>
                            {renderStars(Math.round(stats.average), "sm")}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-semibold">{stats.count}</div>
                            <div className="text-xs text-muted-foreground">Bewertungen</div>
                          </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = stats.distribution[rating - 1] || 0
                            const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0
                            return (
                              <div key={rating} className="flex items-center gap-2 text-xs">
                                <span className="w-3">{rating}</span>
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                <Progress value={percentage} className="h-2 flex-1" />
                                <span className="w-8 text-right text-muted-foreground">{count}</span>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Recent Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Neueste Bewertungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      ...(reviewsData?.google?.reviews || []).map((r) => ({ ...r, platform: "google" as const })),
                      ...(reviewsData?.jameda?.reviews || []).map((r) => ({ ...r, platform: "jameda" as const })),
                      ...(reviewsData?.sanego?.reviews || []).map((r) => ({ ...r, platform: "sanego" as const })),
                    ]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((review) => {
                        const config = platformConfig[review.platform]
                        return (
                          <div
                            key={`${review.platform}-${review.id}`}
                            className="flex items-start gap-4 p-4 rounded-lg border"
                          >
                            <div
                              className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}
                            >
                              <span className="text-lg">{config.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{review.reviewer_name || "Anonym"}</span>
                                <Badge variant="outline" className="text-xs">
                                  {config.name}
                                </Badge>
                                {renderStars(review.rating, "sm")}
                              </div>
                              {review.review_text && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{review.review_text}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {review.review_date
                                  ? format(new Date(review.review_date), "dd. MMMM yyyy", { locale: de })
                                  : "Datum unbekannt"}
                                {review.response_text && (
                                  <Badge variant="secondary" className="ml-2">
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Beantwortet
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    {totalStats.total === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Noch keine Bewertungen vorhanden</p>
                        <p className="text-sm">Fügen Sie Ihre ersten Bewertungen hinzu</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Platform-specific tabs */}
            {(["google", "jameda", "sanego"] as const).map((platform) => (
              <TabsContent key={platform} value={platform}>
                <div className="space-y-4">
                  {filterReviews(reviewsData?.[platform]?.reviews || []).map((review) => (
                    <Card key={review.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-10 h-10 rounded-full ${platformConfig[platform].bgColor} flex items-center justify-center shrink-0`}
                          >
                            <span className="font-semibold text-sm">
                              {(review.reviewer_name || "A")[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{review.reviewer_name || "Anonym"}</span>
                                {renderStars(review.rating, "sm")}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {review.review_date
                                  ? format(new Date(review.review_date), "dd.MM.yyyy", { locale: de })
                                  : "-"}
                              </span>
                            </div>
                            {review.review_text && (
                              <p className="text-sm text-muted-foreground mt-2">{review.review_text}</p>
                            )}
                            {review.response_text && (
                              <div className="mt-4 pl-4 border-l-2 border-primary/30">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>Ihre Antwort</span>
                                  {review.response_date && (
                                    <span>
                                      • {format(new Date(review.response_date), "dd.MM.yyyy", { locale: de })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm">{review.response_text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filterReviews(reviewsData?.[platform]?.reviews || []).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Keine Bewertungen gefunden</p>
                      {(filterRating !== "all" || searchQuery) && (
                        <Button
                          variant="link"
                          onClick={() => {
                            setFilterRating("all")
                            setSearchQuery("")
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ReviewImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        practiceId={practiceId}
        onImportComplete={fetchReviews}
      />
    </div>
  )
}

export default ReviewsManager
