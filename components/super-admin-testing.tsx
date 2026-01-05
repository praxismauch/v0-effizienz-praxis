"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  FileCode,
  TestTube,
  Zap,
  ListChecks,
  FolderKanban,
  ImageIcon,
  Download,
  RefreshCw,
  Sparkles,
} from "lucide-react"
import TestingCategoriesManager from "@/components/testing-categories-manager"
import TestChecklistManager from "@/components/test-checklist-manager"

interface TestResult {
  id: string
  name: string
  status: "passed" | "failed" | "running" | "pending"
  duration?: number
  error?: string
  category: string
}

interface TestSuite {
  name: string
  description: string
  tests: TestResult[]
}

const headerImageTemplates = [
  {
    id: "dashboard-overview",
    title: "Dashboard Übersicht",
    category: "analytics",
    description: "Zeigt das Konzept eines umfassenden Praxis-Dashboards",
    prompt:
      "Professional medical practice dashboard interface, clean modern design, blue and white color scheme, data visualization charts, German healthcare software, minimalist UI, high quality render, 16:9 aspect ratio",
    metrics: ["Umsatz: 125.450 €", "Patienten: 1.247", "Effizienz: 94,5%"],
  },
  {
    id: "efficiency-metrics",
    title: "Effizienz-Metriken",
    category: "analytics",
    description: "Visualisiert Praxis-Effizienz und Optimierungspotenziale",
    prompt:
      "Medical practice efficiency analytics dashboard, performance metrics visualization, green growth indicators, German healthcare optimization software, professional business intelligence UI, clean modern design, 16:9 aspect ratio",
    metrics: ["Zeitersparnis: 12,5 Std/Woche", "Optimierung: +23%", "ROI: 340%"],
  },
  {
    id: "team-collaboration",
    title: "Team-Zusammenarbeit",
    category: "team",
    description: "Illustriert die Teamfunktionen und Kollaboration",
    prompt:
      "Medical team collaboration software interface, healthcare staff management dashboard, modern German practice management, team scheduling and communication tools, professional UI design, blue accent colors, 16:9 aspect ratio",
    metrics: ["Team-Mitglieder: 12", "Aufgaben erledigt: 89%", "Kommunikation: +45%"],
  },
  {
    id: "patient-satisfaction",
    title: "Patientenzufriedenheit",
    category: "patients",
    description: "Zeigt Patientenfeedback und Zufriedenheitsmetriken",
    prompt:
      "Patient satisfaction analytics dashboard, healthcare feedback visualization, star ratings and reviews, German medical practice software, warm friendly colors, professional healthcare UI, 16:9 aspect ratio",
    metrics: ["Zufriedenheit: 4,8/5", "Weiterempfehlung: 96%", "Wartezeit: -35%"],
  },
  {
    id: "analytics-insights",
    title: "Analyse & Einblicke",
    category: "analytics",
    description: "Demonstriert KI-gestützte Analysen und Einblicke",
    prompt:
      "AI-powered healthcare analytics dashboard, intelligent insights visualization, machine learning predictions, German medical practice intelligence software, futuristic professional design, purple and blue accents, 16:9 aspect ratio",
    metrics: ["KI-Empfehlungen: 24", "Prognose-Genauigkeit: 92%", "Einsparpotenzial: 18.500 €"],
  },
  {
    id: "financial-overview",
    title: "Finanzübersicht",
    category: "finance",
    description: "Präsentiert Finanzanalysen und Abrechnungsübersicht",
    prompt:
      "Medical practice financial dashboard, healthcare billing analytics, revenue visualization charts, German medical accounting software, professional finance UI, green and blue color scheme, 16:9 aspect ratio",
    metrics: ["Umsatz: 892.340 €", "Offene Rechnungen: 12.450 €", "Wachstum: +18,5%"],
  },
]

function SuperAdminTesting() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestSuite[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [activeTab, setActiveTab] = useState<string>("unit-tests")
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({})
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({})
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>("all")

  const generateHeaderImage = async (template: (typeof headerImageTemplates)[0]) => {
    setGeneratingImages((prev) => ({ ...prev, [template.id]: true }))

    try {
      const response = await fetch("/api/generate-header-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: template.prompt,
          title: template.title,
          metrics: template.metrics,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler bei der Bildgenerierung")
      }

      const data = await response.json()
      setGeneratedImages((prev) => ({ ...prev, [template.id]: data.imageUrl }))

      toast({
        title: "Bild generiert",
        description: `Header-Bild "${template.title}" wurde erfolgreich erstellt.`,
      })
    } catch (error) {
      console.error("[v0] Error generating image:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bildgenerierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [template.id]: false }))
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download gestartet",
        description: `${filename}.png wird heruntergeladen...`,
      })
    } catch (error) {
      toast({
        title: "Download fehlgeschlagen",
        description: "Bild konnte nicht heruntergeladen werden",
        variant: "destructive",
      })
    }
  }

  const filteredTemplates =
    selectedImageCategory === "all"
      ? headerImageTemplates
      : headerImageTemplates.filter((t) => t.category === selectedImageCategory)

  const testCategories = [
    {
      id: "api",
      name: "API Tests",
      description: "Teste alle API Endpunkte",
      icon: Zap,
    },
    {
      id: "database",
      name: "Datenbank Tests",
      description: "Teste Datenbankverbindungen und Queries",
      icon: FileCode,
    },
    {
      id: "auth",
      name: "Authentifizierung Tests",
      description: "Teste Authentifizierungs- und Autorisierungslogik",
      icon: TestTube,
    },
  ]

  const runUnitTests = async (category?: string) => {
    setIsRunning(true)
    setTestResults([])

    try {
      const response = await fetch("/api/super-admin/testing/unit-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category || "all" }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.details || errorData.error || "Fehler beim Ausführen der Tests"
        throw new Error(errorMessage)
      }

      const data = await response.json()

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Ungültiges Response-Format von der Test-API")
      }

      setTestResults(data.results)

      const totalTests = data.results.reduce((acc: number, suite: TestSuite) => acc + suite.tests.length, 0)
      const passedTests = data.results.reduce(
        (acc: number, suite: TestSuite) => acc + suite.tests.filter((t: TestResult) => t.status === "passed").length,
        0,
      )
      const failedTests = data.results.reduce(
        (acc: number, suite: TestSuite) => acc + suite.tests.filter((t: TestResult) => t.status === "failed").length,
        0,
      )

      toast({
        title: "Tests abgeschlossen",
        description: `${passedTests}/${totalTests} Tests bestanden${failedTests > 0 ? `, ${failedTests} fehlgeschlagen` : ""}`,
        variant: failedTests > 0 ? "destructive" : "default",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Tests konnten nicht ausgeführt werden",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      passed: "default",
      failed: "destructive",
      running: "secondary",
      pending: "outline",
    }
    return (
      <Badge variant={variants[status]} className="capitalize">
        {status === "passed" ? "Bestanden" : status === "failed" ? "Fehlgeschlagen" : "Läuft"}
      </Badge>
    )
  }

  const totalTests = testResults.reduce((acc, suite) => acc + suite.tests.length, 0)
  const passedTests = testResults.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === "passed").length,
    0,
  )
  const failedTests = testResults.reduce(
    (acc, suite) => acc + suite.tests.filter((t) => t.status === "failed").length,
    0,
  )
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Testing</h2>
        <p className="text-muted-foreground">Führen Sie automatische Tests aus und verwalten Sie Test-Checklisten</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unit-tests" className="gap-2">
            <TestTube className="h-4 w-4" />
            Unit Tests
          </TabsTrigger>
          <TabsTrigger value="test-categories" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Testing Kategorien
          </TabsTrigger>
          <TabsTrigger value="test-checklists" className="gap-2">
            <ListChecks className="h-4 w-4" />
            Test Checkliste
          </TabsTrigger>
          <TabsTrigger value="header-images" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Header-Bilder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unit-tests" className="space-y-6">
          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gesamt Tests</CardTitle>
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bestanden</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{passedTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Fehlgeschlagen</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{failedTests}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Erfolgsquote</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                  <Progress value={successRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Unit Tests ausführen</CardTitle>
              <CardDescription>Führen Sie Unit Tests für das System aus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {testCategories.map((category) => {
                  const Icon = category.icon
                  return (
                    <Card key={category.id} className="hover:border-primary transition-colors">
                      <CardHeader className="space-y-1 pb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-sm">{category.name}</CardTitle>
                        </div>
                        <CardDescription className="text-xs">{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => runUnitTests(category.id)}
                          disabled={isRunning}
                        >
                          {isRunning ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Läuft...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="mr-2 h-4 w-4" />
                              Ausführen
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={() => runUnitTests()} disabled={isRunning} className="min-w-[200px]">
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Tests laufen...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="mr-2 h-5 w-5" />
                      Alle Tests ausführen
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Ergebnisse</CardTitle>
                <CardDescription>Detaillierte Ergebnisse aller ausgeführten Tests</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {testResults.map((suite, idx) => (
                      <Card key={idx} className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{suite.name}</CardTitle>
                          <CardDescription className="text-sm">{suite.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {suite.tests.map((test) => (
                              <div
                                key={test.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {getStatusIcon(test.status)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{test.name}</p>
                                    {test.error && <p className="text-xs text-red-500 mt-1">{test.error}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {test.duration && (
                                    <span className="text-xs text-muted-foreground">{test.duration}ms</span>
                                  )}
                                  {getStatusBadge(test.status)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="test-categories" className="space-y-6">
          <TestingCategoriesManager />
        </TabsContent>

        <TabsContent value="test-checklists" className="space-y-6">
          <TestChecklistManager />
        </TabsContent>

        <TabsContent value="header-images" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Header-Bild Generator
                  </CardTitle>
                  <CardDescription>
                    Generieren Sie hochwertige Header-Bilder für das Praxismanagement-System mit KI
                  </CardDescription>
                </div>
                <Badge variant="secondary">fal.ai FLUX Pro</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={selectedImageCategory === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedImageCategory("all")}
                >
                  Alle
                </Button>
                <Button
                  variant={selectedImageCategory === "analytics" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedImageCategory("analytics")}
                >
                  Analytics
                </Button>
                <Button
                  variant={selectedImageCategory === "team" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedImageCategory("team")}
                >
                  Team
                </Button>
                <Button
                  variant={selectedImageCategory === "patients" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedImageCategory("patients")}
                >
                  Patienten
                </Button>
                <Button
                  variant={selectedImageCategory === "finance" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedImageCategory("finance")}
                >
                  Finanzen
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
                      {generatedImages[template.id] ? (
                        <img
                          src={generatedImages[template.id] || "/placeholder.svg"}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center p-4">
                            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                            <p className="text-xs text-muted-foreground">Klicken Sie auf Generieren</p>
                          </div>
                        </div>
                      )}
                      {generatingImages[template.id] && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-center text-white">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Generiere...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {template.metrics.map((metric, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-normal">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => generateHeaderImage(template)}
                          disabled={generatingImages[template.id]}
                        >
                          {generatingImages[template.id] ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generiere...
                            </>
                          ) : generatedImages[template.id] ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Neu generieren
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Generieren
                            </>
                          )}
                        </Button>
                        {generatedImages[template.id] && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadImage(generatedImages[template.id], template.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SuperAdminTesting
