"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import {
  Loader2,
  MapPin,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Users,
  Globe,
  Star,
  BarChart3,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  ThumbsUp,
  Shield,
  ArrowLeft,
  Edit,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

interface CompetitorAnalysis {
  id: string
  practice_id: string
  created_by: string
  location: string
  specialty: string
  radius_km: number
  additional_keywords: string[]
  title: string
  name: string
  status: string
  summary: string
  market_overview: any
  competitors: any[]
  strengths_weaknesses: any
  opportunities: any[]
  threats: any[]
  recommendations: any[]
  pricing_comparison: any
  service_comparison: any
  online_presence: any
  patient_reviews_analysis: any
  ai_analysis: any
  created_at: string
  updated_at: string
}

interface CompetitorAnalysisDetailClientProps {
  analysisId: string
}

export default function CompetitorAnalysisDetailClient({ analysisId }: CompetitorAnalysisDetailClientProps) {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (currentPractice?.id && analysisId) {
      loadAnalysis()
    }
  }, [currentPractice?.id, analysisId])

  const loadAnalysis = async () => {
    if (!currentPractice?.id || !analysisId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysisId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        toast({
          title: "Fehler",
          description: "Konkurrenzanalyse konnte nicht geladen werden",
          variant: "destructive",
        })
        router.push("/competitor-analysis")
      }
    } catch (error) {
      console.error("Error loading analysis:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!currentPractice?.id || !analysis) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysis.id}/generate`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Analyse wird neu generiert",
          description: "Die Konkurrenzanalyse wird mit aktuellen Daten neu erstellt",
        })
        await loadAnalysis()
      } else {
        toast({
          title: "Fehler",
          description: "Analyse konnte nicht neu generiert werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error regenerating analysis:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Abgeschlossen</Badge>
        )
      case "generating":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Wird generiert...</Badge>
        )
      case "error":
        return <Badge variant="destructive">Fehler</Badge>
      default:
        return <Badge variant="secondary">Entwurf</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "hoch":
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "mittel":
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "niedrig":
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <AppLayout loading={loading} loadingMessage="Konkurrenzanalyse wird geladen...">
        <div className="flex min-h-screen w-full bg-background">
          <div className="flex flex-1 flex-col">
            <main className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </main>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <AppLayout loading={loading} loadingMessage="Konkurrenzanalyse wird geladen...">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Button variant="ghost" size="sm" onClick={() => router.push("/competitor-analysis")} className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Konkurrenzanalyse: {analysis.name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{analysis.location}</span>
              <span>•</span>
              <Briefcase className="h-4 w-4" />
              <span>{analysis.specialty}</span>
              <span>•</span>
              <span>{analysis.radius_km} km Radius</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(analysis.status)}
            <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
              Neu generieren
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/competitor-analysis`)}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="competitors">Konkurrenten</TabsTrigger>
            <TabsTrigger value="ratings">Bewertungen</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="pricing">Preise</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {analysis.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle>Zusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.market_overview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Marktübersicht
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.market_overview.total_competitors && (
                      <div>
                        <div className="text-sm font-medium mb-1">Anzahl Wettbewerber</div>
                        <div className="text-2xl font-bold">{analysis.market_overview.total_competitors}</div>
                      </div>
                    )}
                    {analysis.market_overview.market_saturation && (
                      <div>
                        <div className="text-sm font-medium mb-1">Marktsättigung</div>
                        <div className="text-lg">{analysis.market_overview.market_saturation}</div>
                      </div>
                    )}
                    {analysis.market_overview.key_insights && (
                      <div>
                        <div className="text-sm font-medium mb-2">Wichtige Erkenntnisse</div>
                        <ul className="space-y-1">
                          {analysis.market_overview.key_insights.map((insight: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground">
                              • {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Competitors Tab */}
            <TabsContent value="competitors" className="space-y-4">
              {analysis.competitors && analysis.competitors.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {analysis.competitors.map((competitor: any, index: number) => (
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
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Keine Wettbewerber-Daten verfügbar</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Ratings Tab */}
            <TabsContent value="ratings" className="space-y-4">
              {analysis.patient_reviews_analysis ? (
                <>
                  {analysis.patient_reviews_analysis.average_rating && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          Durchschnittliche Bewertung
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{analysis.patient_reviews_analysis.average_rating}</div>
                        {analysis.patient_reviews_analysis.total_reviews && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Basierend auf {analysis.patient_reviews_analysis.total_reviews} Bewertungen
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {analysis.patient_reviews_analysis.common_praise && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                          <ThumbsUp className="h-5 w-5" />
                          Häufiges Lob
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.patient_reviews_analysis.common_praise.map((praise: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500 mt-1">✓</span>
                              {praise}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.patient_reviews_analysis.common_complaints && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="h-5 w-5" />
                          Häufige Kritikpunkte
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.patient_reviews_analysis.common_complaints.map((complaint: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <span className="text-red-500 mt-1">✗</span>
                              {complaint}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Keine Bewertungsdaten verfügbar</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SWOT Tab */}
            <TabsContent value="swot" className="space-y-4">
              {analysis.strengths_weaknesses && (
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="border-green-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        Marktstärken
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.strengths_weaknesses.market_strengths?.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-1">✓</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Marktschwächen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.strengths_weaknesses.market_weaknesses?.map((w: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-red-500 mt-1">✗</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {analysis.opportunities?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Chancen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.opportunities.map((opp: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{opp.title}</h4>
                            <Badge className={getPriorityColor(opp.priority)}>{opp.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                          {opp.implementation_effort && (
                            <p className="text-xs text-muted-foreground mt-2">Aufwand: {opp.implementation_effort}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.threats?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-500" />
                      Risiken
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.threats.map((threat: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium">{threat.title}</h4>
                            <Badge className={getPriorityColor(threat.severity)}>{threat.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{threat.description}</p>
                          {threat.mitigation && (
                            <p className="text-xs text-primary mt-2">
                              <strong>Gegenmaßnahme:</strong> {threat.mitigation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              {analysis.pricing_comparison ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Preisvergleich
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysis.pricing_comparison.average_consultation_fee && (
                        <div>
                          <div className="text-sm font-medium">Durchschnittliche Konsultationsgebühr</div>
                          <div className="text-lg font-bold">
                            {analysis.pricing_comparison.average_consultation_fee}
                          </div>
                        </div>
                      )}
                      {analysis.pricing_comparison.price_positioning && (
                        <div>
                          <div className="text-sm font-medium">Preispositionierung</div>
                          <p className="text-sm text-muted-foreground">
                            {analysis.pricing_comparison.price_positioning}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Keine Preisdaten verfügbar</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Online Tab */}
            <TabsContent value="online" className="space-y-4">
              {analysis.online_presence ? (
                <>
                  {analysis.online_presence.website_quality && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Globe className="h-5 w-5" />
                          Website-Qualität
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.online_presence.website_quality.average_score && (
                            <div>
                              <div className="text-sm font-medium mb-2">Durchschnittlicher Score</div>
                              <Progress
                                value={analysis.online_presence.website_quality.average_score * 10}
                                className="h-2"
                              />
                              <div className="text-2xl font-bold mt-2">
                                {analysis.online_presence.website_quality.average_score}/10
                              </div>
                            </div>
                          )}
                          {analysis.online_presence.website_quality.key_findings && (
                            <div>
                              <div className="text-sm font-medium mb-2">Wichtige Erkenntnisse</div>
                              <ul className="space-y-1">
                                {analysis.online_presence.website_quality.key_findings.map(
                                  (finding: string, i: number) => (
                                    <li key={i} className="text-sm text-muted-foreground">
                                      • {finding}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {analysis.online_presence.social_media_presence && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ThumbsUp className="h-5 w-5" />
                          Social Media Präsenz
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {analysis.online_presence.social_media_presence}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Keine Online-Präsenz-Daten verfügbar</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-4">
              {analysis.recommendations && analysis.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {analysis.recommendations.map((rec: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            {rec.category && (
                              <Badge variant="outline" className="mt-2">
                                {rec.category}
                              </Badge>
                            )}
                          </div>
                          {rec.priority && <Badge className={getPriorityColor(rec.priority)}>{rec.priority}</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                        {rec.expected_impact && (
                          <div>
                            <div className="text-xs font-medium mb-1">Erwarteter Effekt</div>
                            <p className="text-sm text-primary">{rec.expected_impact}</p>
                          </div>
                        )}
                        {rec.implementation_steps && (
                          <div>
                            <div className="text-xs font-medium mb-1">Umsetzungsschritte</div>
                            <ul className="space-y-1">
                              {rec.implementation_steps.map((step: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground">
                                  {i + 1}. {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.estimated_cost && (
                          <div className="pt-2 border-t text-xs text-muted-foreground">
                            Geschätzte Kosten: {rec.estimated_cost}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">Keine Empfehlungen verfügbar</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  )
}
