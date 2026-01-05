"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { SEOKeywordsManager } from "@/components/seo-keywords-manager"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Link2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Globe,
  Sparkles,
  Copy,
  CheckCircle2,
  FileText,
  Tag,
  Zap,
  Smartphone,
  Edit,
  Trash2,
  Plus,
  Download,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/user-context"

export function SEOAnalyticsDashboard() {
  const { toast } = useToast()
  const { isSuperAdmin } = useUser()
  const [keywordInput, setKeywordInput] = useState("")
  const [analyzingKeyword, setAnalyzingKeyword] = useState(false)
  const [loading, setLoading] = useState(true)

  const [overviewMetrics, setOverviewMetrics] = useState<any[]>([])
  const [trafficData, setTrafficData] = useState<any[]>([])
  const [topKeywords, setTopKeywords] = useState<any[]>([])
  const [topPages, setTopPages] = useState<any[]>([])
  const [technicalIssues, setTechnicalIssues] = useState<any[]>([])

  const [aiRecommendations, setAiRecommendations] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [creatingTicket, setCreatingTicket] = useState<string | null>(null) // State to track ticket creation

  const [seoScore, setSeoScore] = useState(0)
  const [seoScoreChange, setSeoScoreChange] = useState(0)
  const [seoScoreBreakdown, setSeoScoreBreakdown] = useState<any>(null)

  useEffect(() => {
    fetchRealData()
  }, [])

  const fetchRealData = async () => {
    try {
      setLoading(true)

      const endpoints = [
        { name: "metrics", url: "/api/super-admin/seo/metrics" },
        { name: "traffic", url: "/api/super-admin/seo/traffic-data" },
        { name: "keywords", url: "/api/super-admin/seo/keywords" },
        { name: "pages", url: "/api/super-admin/seo/top-pages" },
        { name: "issues", url: "/api/super-admin/seo/issues" },
        { name: "score", url: "/api/super-admin/seo/score" },
      ]

      const results = await Promise.allSettled(
        endpoints.map((endpoint) =>
          fetch(endpoint.url, {
            credentials: "include", // Send cookies for authentication
          }).then(async (res) => {
            console.log(`[v0] ${endpoint.name} response status:`, res.status)
            if (!res.ok) {
              const text = await res.text()
              console.error(`[v0] ${endpoint.name} error response:`, text)
              throw new Error(`${endpoint.name} failed with status ${res.status}`)
            }
            const text = await res.text()
            console.log(`[v0] ${endpoint.name} raw response:`, text.substring(0, 200))
            try {
              return { name: endpoint.name, data: JSON.parse(text) }
            } catch (e) {
              console.error(`[v0] ${endpoint.name} JSON parse error:`, e, text.substring(0, 200))
              throw new Error(`${endpoint.name}: Invalid JSON response`)
            }
          }),
        ),
      )

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const { name, data } = result.value

          switch (name) {
            case "metrics":
              if (data.metrics) {
                const metricsArray = [
                  {
                    title: "Indexierte Seiten",
                    value: `${data.metrics.indexedPages}/${data.metrics.totalPages}`,
                    icon: FileText,
                    color: "from-blue-500 to-blue-600",
                    trend: "stable",
                    change: "0%",
                  },
                  {
                    title: "Meta-Tags Abdeckung",
                    value: `${data.metrics.metaTagsCoverage}%`,
                    icon: Tag,
                    color: "from-green-500 to-green-600",
                    trend: data.metrics.metaTagsCoverage > 50 ? "up" : "down",
                    change: `${data.metrics.metaTagsCoverage}%`,
                  },
                  {
                    title: "Ø Ladezeit",
                    value: `${data.metrics.avgLoadTime}s`,
                    icon: Zap,
                    color: "from-yellow-500 to-yellow-600",
                    trend: data.metrics.avgLoadTime < 3 ? "up" : "down",
                    change: data.metrics.avgLoadTime < 3 ? "Gut" : "Verbesserungsbedarf",
                  },
                  {
                    title: "Mobile-Optimiert",
                    value: data.metrics.mobileOptimized ? "Ja" : "Nein",
                    icon: Smartphone,
                    color: "from-purple-500 to-purple-600",
                    trend: data.metrics.mobileOptimized ? "up" : "down",
                    change: data.metrics.mobileOptimized ? "Optimiert" : "Nicht optimiert",
                  },
                ]
                setOverviewMetrics(metricsArray)
              } else {
                setOverviewMetrics([])
              }
              break
            case "traffic":
              setTrafficData(data.trafficData || [])
              break
            case "keywords":
              setTopKeywords(data.keywords || [])
              break
            case "pages":
              setTopPages(data.pages || [])
              break
            case "issues":
              setTechnicalIssues(data.issues || [])
              break
            case "score":
              setSeoScore(data.score || 0)
              setSeoScoreChange(data.change || 0)
              setSeoScoreBreakdown(data.breakdown || null)
              break
          }
        } else {
          console.error(`[v0] Failed to fetch ${endpoints[index].name}:`, result.reason)
        }
      })

      const successCount = results.filter((r) => r.status === "fulfilled").length
      toast({
        title: "Daten aktualisiert",
        description: `${successCount} von ${endpoints.length} SEO-Datenquellen geladen`,
      })
    } catch (error) {
      console.error("[v0] Error fetching SEO data:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der SEO-Daten",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeKeyword = async () => {
    if (!keywordInput.trim()) return

    setAnalyzingKeyword(true)
    try {
      // TODO: Implement proper SEO keyword analysis API endpoint
      const response = await fetch("/api/seo/analyze-keyword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keywordInput }),
      })

      if (!response.ok) {
        throw new Error("Failed to analyze keyword")
      }

      const data = await response.json()

      toast({
        title: "Keyword analysiert",
        description: `Analyse für "${keywordInput}" abgeschlossen`,
      })
      setKeywordInput("")
    } catch (error) {
      console.error("[v0] Keyword analysis error:", error)
      toast({
        title: "Fehler",
        description: "Fehler bei der Keyword-Analyse. API-Endpunkt muss noch implementiert werden.",
        variant: "destructive",
      })
    } finally {
      setAnalyzingKeyword(false)
    }
  }

  const handleDeleteKeyword = async (keywordId: string, keywordName: string) => {
    if (!confirm(`Möchten Sie das Keyword "${keywordName}" wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/super-admin/seo/keywords/manage/${keywordId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast({
        title: "Keyword gelöscht",
        description: "Das Keyword wurde erfolgreich gelöscht",
      })

      // Refresh data
      fetchRealData()
    } catch (error) {
      console.error("[v0] Error deleting keyword:", error)
      toast({
        title: "Fehler",
        description: "Keyword konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleEditKeyword = (keywordId: string) => {
    // Trigger a custom event that the keyword manager can listen to
    window.dispatchEvent(new CustomEvent("edit-keyword", { detail: { keywordId } }))

    // Switch to the keywords tab
    const keywordsTab = document.querySelector('[data-value="keywords"]') as HTMLElement
    if (keywordsTab) {
      keywordsTab.click()
    }

    toast({
      title: "Navigation",
      description: "Navigiere zum Keyword-Manager für die Bearbeitung",
    })
  }

  // TODO: Fetch real ranking history from SEO tracking API or database
  const rankingHistory = [
    { date: "01.11", position: 15 },
    { date: "05.11", position: 12 },
    { date: "10.11", position: 10 },
    { date: "15.11", position: 8 },
    { date: "20.11", position: 7 },
    { date: "25.11", position: 5 },
    { date: "30.11", position: 4 },
  ]

  const competitorAnalysis = [
    { domain: "competitor1.de", position: 1, change: 0 },
    { domain: "competitor2.de", position: 2, change: -1 },
    { domain: "ihre-domain.de", position: 4, change: +2 },
    { domain: "competitor3.de", position: 5, change: -1 },
    { domain: "competitor4.de", position: 6, change: +1 },
  ]

  const sitemapUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`
    : typeof window !== "undefined"
      ? `${window.location.origin}/sitemap.xml`
      : "https://effizienz-praxis.de/sitemap.xml"

  const copySitemapUrl = () => {
    navigator.clipboard.writeText(sitemapUrl)
    toast({
      title: "Kopiert",
      description: "Sitemap-URL wurde in die Zwischenablage kopiert.",
    })
  }

  const downloadSitemap = () => {
    // CHANGED to download instead of just opening in new tab
    const link = document.createElement("a")
    link.href = sitemapUrl
    link.download = "sitemap.xml"
    link.click()
  }

  const fetchAIRecommendations = async () => {
    try {
      setLoadingAI(true)
      const response = await fetch("/api/super-admin/seo/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentKeywords: topKeywords.map((k) => k.keyword),
          topPages: topPages.map((p) => p.page),
          technicalIssues: technicalIssues,
        }),
      })

      if (!response.ok) throw new Error("AI assistant request failed")

      const data = await response.json()
      setAiRecommendations(data.recommendations)

      toast({
        title: "KI-Analyse abgeschlossen",
        description: "Neue SEO-Empfehlungen verfügbar",
      })
    } catch (error) {
      console.error("[v0] Error fetching AI recommendations:", error)
      toast({
        title: "Fehler",
        description: "KI-Analyse fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setLoadingAI(false)
    }
  }

  // Added function to create tickets from recommendations
  const createTicketFromRecommendation = async (
    title: string,
    description: string,
    priority: string,
    category: string,
    type = "Feature-Request",
  ) => {
    const ticketId = `${title}-${Date.now()}`
    try {
      setCreatingTicket(ticketId)

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority: priority || "medium",
          category: category || "SEO",
          type,
          status: "Offen",
          metadata: {
            source: "seo-assistant",
            created_from: "ai-recommendation",
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to create ticket")

      toast({
        title: "Ticket erstellt",
        description: "Ein neues Ticket wurde aus dieser Empfehlung erstellt",
      })
    } catch (error) {
      console.error("[v0] Error creating ticket:", error)
      toast({
        title: "Fehler",
        description: "Ticket konnte nicht erstellt werden",
        variant: "destructive",
      })
    } finally {
      setCreatingTicket(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SEO Analytics</h2>
          <p className="text-muted-foreground">
            Echtzeit-Daten zu organischem Traffic, Rankings und technischen Optimierungen
          </p>
        </div>
        <Button onClick={fetchRealData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Aktualisieren
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.isArray(overviewMetrics) && overviewMetrics.length > 0 ? (
          overviewMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center",
                    metric.color,
                  )}
                >
                  <metric.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  ) : metric.trend === "down" ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500 mr-1" />
                  )}
                  <span>{metric.change}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Keine Metriken verfügbar</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SEO Score Card (Remains mostly static or fetchable if data is available) */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">SEO Score</CardTitle>
              <CardDescription className="text-slate-400">Gesamtbewertung Ihrer Website</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                <TrendingUp className="mr-1 h-3 w-3" />+{seoScoreChange} Punkte
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-4 border-emerald-500/30">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">{seoScore}</div>
                  <div className="text-xs text-slate-400">von 100</div>
                </div>
              </div>
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1 space-y-4">
              {seoScoreBreakdown &&
                Object.entries(seoScoreBreakdown).map(([category, score]) => (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">{category}</span>
                      <span className="text-sm font-medium text-white">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2 bg-slate-700" />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="w-full grid grid-cols-6">
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="pages">Top-Seiten</TabsTrigger>
          <TabsTrigger value="technical">Technisch</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
          <TabsTrigger value="ai-assistant">
            <Sparkles className="h-4 w-4 mr-2" />
            KI-Assistent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traffic-Entwicklung</CardTitle>
              <CardDescription>Organische Besucher und Interaktionen der letzten 30 Tage</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {loading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trafficData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visits" stroke="#10b981" strokeWidth={2} name="Besuche" />
                    <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Klicks" />
                    <Line type="monotone" dataKey="impressions" stroke="#f59e0b" strokeWidth={2} name="Impressionen" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          <SEOKeywordsManager />

          <Card>
            <CardHeader>
              <CardTitle>Top Keywords</CardTitle>
              <CardDescription>Ihre besten organischen Rankings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {topKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{keyword.keyword}</span>
                          {keyword.trend === "up" ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : keyword.trend === "down" ? (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          ) : (
                            <Minus className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {keyword.volume.toLocaleString("de-DE")} Suchvolumen · {keyword.clicks} Klicks
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">Position {keyword.position}</div>
                          <div className="text-xs text-muted-foreground">
                            {keyword.change > 0 ? "+" : ""}
                            {keyword.change}
                          </div>
                        </div>
                        {isSuperAdmin && keyword.id && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleEditKeyword(keyword.id)}
                              title="Keyword bearbeiten"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}
                              title="Keyword löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyword-Recherche</CardTitle>
              <CardDescription>Analysieren Sie neue Keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Keyword eingeben..."
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyzeKeyword()}
                />
                <Button onClick={handleAnalyzeKeyword} disabled={analyzingKeyword}>
                  {analyzingKeyword ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top-Seiten</CardTitle>
              <CardDescription>Seiten mit den meisten organischen Besuchern</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{page.title}</span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{page.page}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-right">
                        <div>
                          <div className="text-sm font-medium">{page.views.toLocaleString("de-DE")}</div>
                          <div className="text-xs text-muted-foreground">Views</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{page.clicks.toLocaleString("de-DE")}</div>
                          <div className="text-xs text-muted-foreground">Klicks</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{page.ctr}%</div>
                          <div className="text-xs text-muted-foreground">CTR</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technische SEO-Probleme</CardTitle>
              <CardDescription>Probleme, die behoben werden sollten</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {technicalIssues.map((issue, index) => (
                    <div key={index} className="flex items-start justify-between border-b pb-3 last:border-0">
                      <div className="flex items-start gap-3">
                        {issue.type === "critical" ? (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        ) : issue.type === "warning" ? (
                          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                        ) : issue.type === "success" ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        )}
                        <div>
                          <div className="font-medium">{issue.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {issue.count > 0 ? `${issue.count} betroffene Seiten` : "Keine Probleme"}
                          </div>
                          {issue.pages.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                              {issue.pages.slice(0, 3).map((p: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                              {issue.pages.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{issue.pages.length - 3} mehr
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          issue.type === "critical"
                            ? "destructive"
                            : issue.type === "warning"
                              ? "default"
                              : issue.type === "success"
                                ? "default"
                                : "secondary"
                        }
                      >
                        {issue.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap" className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5 text-blue-400" />
                Sitemap-Verwaltung
              </CardTitle>
              <CardDescription className="text-slate-400">XML-Sitemap für Suchmaschinen-Indexierung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-full bg-blue-500/20">
                    <Globe className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">SEO-freundliche Sitemap</h3>
                    <p className="text-sm text-slate-300">Aktuelle XML-Sitemap Ihrer Website</p>
                  </div>
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Sitemap URL</span>
                  </div>
                  <p className="text-sm text-white font-mono break-all">{sitemapUrl}</p>
                </div>

                <div className="flex gap-3">
                  <Button onClick={copySitemapUrl} variant="outline" className="flex-1 bg-transparent">
                    <Copy className="mr-2 h-4 w-4" />
                    URL kopieren
                  </Button>
                  <Button onClick={downloadSitemap} variant="outline" className="flex-1 bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Sitemap herunterladen
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  Sitemap bei Suchmaschinen einreichen
                </h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <a
                    href={`https://search.google.com/search-console`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <Search className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">Google Search Console</p>
                        <p className="text-xs text-slate-400">Sitemap bei Google einreichen</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </a>

                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <Search className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">Bing Webmaster Tools</p>
                        <p className="text-xs text-slate-400">Sitemap bei Bing einreichen</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                  </a>
                </div>

                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-white mb-1">Sitemap-Status: Aktiv</p>
                      <p className="text-sm text-slate-300">
                        Ihre Sitemap ist öffentlich zugänglich und kann von Suchmaschinen gefunden werden.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-white mb-2">Tipps zur Sitemap-Optimierung</p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        <li>• Reichen Sie Ihre Sitemap in der Google Search Console ein</li>
                        <li>• Aktualisieren Sie die Sitemap bei größeren Änderungen</li>
                        <li>• Überprüfen Sie regelmäßig auf Crawling-Fehler</li>
                        <li>• Priorisieren Sie wichtige Seiten mit höheren Priority-Werten</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-assistant" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold">KI-SEO-Assistent</h3>
              <p className="text-muted-foreground">Intelligente Empfehlungen zur Optimierung Ihrer SEO-Strategie</p>
            </div>
            <Button onClick={fetchAIRecommendations} disabled={loadingAI}>
              {loadingAI ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {loadingAI ? "Analysiere..." : "KI-Analyse starten"}
            </Button>
          </div>

          {loadingAI ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <Sparkles className="h-16 w-16 animate-pulse text-primary mb-4" />
                  <p className="text-lg font-medium">KI analysiert Ihre SEO-Daten...</p>
                  <p className="text-sm text-muted-foreground mt-2">Dies kann einige Sekunden dauern</p>
                </div>
              </CardContent>
            </Card>
          ) : aiRecommendations ? (
            <>
              {/* Quick Wins */}
              {aiRecommendations.quickWins && aiRecommendations.quickWins.length > 0 && (
                <Card className="border-green-500/50 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Schnelle Erfolge (Quick Wins)
                    </CardTitle>
                    <CardDescription>Einfache Optimierungen mit hohem Potenzial</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiRecommendations.quickWins.map((win: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg bg-background border border-green-500/30">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-green-500/20">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{win.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{win.description}</p>
                              <div className="flex items-center gap-4 text-xs">
                                <Badge variant="outline" className="bg-green-500/10">
                                  Aufwand: {win.effort}
                                </Badge>
                                <Badge variant="outline" className="bg-blue-500/10">
                                  Impact: {win.impact}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                createTicketFromRecommendation(
                                  win.title,
                                  `${win.description}\n\nAufwand: ${win.effort}\nImpact: ${win.impact}`,
                                  win.impact === "Hoch" ? "high" : "medium",
                                  "SEO",
                                  "Feature-Request",
                                )
                              }
                              disabled={creatingTicket === `${win.title}-${index}`}
                            >
                              {creatingTicket === `${win.title}-${index}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Keyword Opportunities */}
              {aiRecommendations.keywordOpportunities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Neue Keyword-Möglichkeiten
                    </CardTitle>
                    <CardDescription>KI-entdeckte Keywords mit hohem Potenzial</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {aiRecommendations.keywordOpportunities.map((keyword: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{keyword.keyword}</h4>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  keyword.difficulty === "easy"
                                    ? "default"
                                    : keyword.difficulty === "medium"
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {keyword.difficulty === "easy"
                                  ? "Einfach"
                                  : keyword.difficulty === "medium"
                                    ? "Mittel"
                                    : "Schwer"}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  createTicketFromRecommendation(
                                    `Keyword optimieren: ${keyword.keyword}`,
                                    `${keyword.reason}\n\nGeschätztes Suchvolumen: ~${keyword.estimatedVolume} Suchanfragen/Monat\nSchwierigkeit: ${keyword.difficulty}`,
                                    keyword.difficulty === "easy"
                                      ? "low"
                                      : keyword.difficulty === "medium"
                                        ? "medium"
                                        : "high",
                                    "SEO",
                                    "Feature-Request",
                                  )
                                }
                                disabled={creatingTicket === `${keyword.keyword}-${index}`}
                              >
                                {creatingTicket === `${keyword.keyword}-${index}` ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Plus className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{keyword.reason}</p>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />~{keyword.estimatedVolume} Suchanfragen/Monat
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content Gaps */}
              {aiRecommendations.contentGaps && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Content-Lücken
                    </CardTitle>
                    <CardDescription>Fehlende Inhalte, die Ihre Konkurrenz bereits abdeckt</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiRecommendations.contentGaps.map((gap: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border border-orange-500/30 bg-orange-500/5">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold">{gap.topic}</h4>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                createTicketFromRecommendation(
                                  `Content erstellen: ${gap.topic}`,
                                  `${gap.description}\n\nPriorität: ${gap.priority}${gap.suggestedFormat ? `\nVorgeschlagenes Format: ${gap.suggestedFormat}` : ""}`,
                                  gap.priority === "Hoch" ? "high" : gap.priority === "Mittel" ? "medium" : "low",
                                  "SEO",
                                  "Feature-Request",
                                )
                              }
                              disabled={creatingTicket === `${gap.topic}-${index}`}
                            >
                              {creatingTicket === `${gap.topic}-${index}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{gap.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Priorität: {gap.priority}</Badge>
                            {gap.suggestedFormat && <Badge variant="secondary">{gap.suggestedFormat}</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technical Recommendations */}
              {aiRecommendations.technicalRecommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Technische Empfehlungen
                    </CardTitle>
                    <CardDescription>Verbesserungen für bessere Crawlbarkeit und Performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {aiRecommendations.technicalRecommendations.map((rec: any, index: number) => (
                        <div key={index} className="p-4 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                rec.priority === "high"
                                  ? "bg-red-500/20"
                                  : rec.priority === "medium"
                                    ? "bg-yellow-500/20"
                                    : "bg-blue-500/20"
                              }`}
                            >
                              <AlertCircle
                                className={`h-4 w-4 ${
                                  rec.priority === "high"
                                    ? "text-red-500"
                                    : rec.priority === "medium"
                                      ? "text-yellow-500"
                                      : "text-blue-500"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                createTicketFromRecommendation(
                                  `Technisch: ${rec.title}`,
                                  rec.description,
                                  rec.priority,
                                  "SEO",
                                  "Bug",
                                )
                              }
                              disabled={creatingTicket === `${rec.title}-${index}`}
                            >
                              {creatingTicket === `${rec.title}-${index}` ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Strategic Advice - improved professional card */}
              {aiRecommendations?.strategicAdvice && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Strategische Empfehlungen
                    </CardTitle>
                    <CardDescription>Langfristige SEO-Strategie für nachhaltigen Erfolg</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiRecommendations.strategicAdvice.split("\n\n").map((section: string, index: number) => {
                        const trimmed = section.trim()
                        if (!trimmed) return null

                        // Handle headers
                        if (trimmed.startsWith("## ")) {
                          return (
                            <h4 key={index} className="font-semibold text-primary mt-4 first:mt-0">
                              {trimmed.slice(3)}
                            </h4>
                          )
                        }

                        // Handle bullet points
                        if (trimmed.includes("- ")) {
                          const bullets = trimmed.split("\n").filter((line: string) => line.startsWith("- "))
                          return (
                            <ul key={index} className="space-y-2">
                              {bullets.map((bullet: string, i: number) => (
                                <li key={i} className="flex items-start gap-3 text-sm">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <span className="leading-relaxed">{bullet.slice(2)}</span>
                                </li>
                              ))}
                            </ul>
                          )
                        }

                        return (
                          <p key={index} className="text-sm leading-relaxed">
                            {trimmed}
                          </p>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Bereit für KI-gestützte SEO-Analyse</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Lassen Sie unsere KI Ihre SEO-Daten analysieren und erhalten Sie maßgeschneiderte Empfehlungen
                  </p>
                  <Button onClick={fetchAIRecommendations} size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Jetzt analysieren
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SEOAnalyticsDashboard
