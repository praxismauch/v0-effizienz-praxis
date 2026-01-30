"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle, Euro, Target, ArrowLeft, Edit, Trash2, Loader2, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteIgelAnalysis } from "@/hooks/use-igel"

interface IgelAnalysisFullViewProps {
  analysisId: string
}

export function IgelAnalysisFullView({ analysisId }: IgelAnalysisFullViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!currentPractice?.id) return

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/igel/${analysisId}`)
        if (!response.ok) throw new Error("Failed to fetch analysis")
        const data = await response.json()
        setAnalysis(data.analysis)
      } catch (error) {
        console.error("Error fetching analysis:", error)
        toast({
          title: "Fehler",
          description: "Analyse konnte nicht geladen werden",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [currentPractice?.id, analysisId, toast])

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-6 w-6" />
    if (score >= 40) return <AlertCircle className="h-6 w-6" />
    return <TrendingDown className="h-6 w-6" />
  }

  const handleDelete = async () => {
    if (!currentPractice?.id) return

    setDeleting(true)
    try {
      await deleteIgelAnalysis(currentPractice.id, analysisId)

      toast({
        title: "Gelöscht",
        description: "Die Analyse wurde gelöscht",
      })

      router.push("/igel-analysis")
    } catch (error: any) {
      console.error("Error deleting analysis:", error)
      toast({
        title: "Fehler",
        description: error.message || "Löschen fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!analysis) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Analyse nicht gefunden</h3>
          <Button onClick={() => router.push("/igel-analysis")}>Zurück zur Übersicht</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 rounded-lg border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <Button variant="ghost" size="sm" onClick={() => router.push("/igel-analysis")} className="mb-4 -ml-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
              <h1 className="text-4xl font-bold tracking-tight">{analysis.service_name}</h1>
              <p className="text-lg text-muted-foreground mt-2">Detaillierte Analyse der Selbstzahlerleistung</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push(`/igel-analysis/${analysisId}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </Button>
            </div>
          </div>
        </div>

        {/* Score Card - Hero Section */}
        <Card className="border-2 shadow-lg">
          <div className="bg-gradient-to-br from-background to-muted/30 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Rentabilitätsscore
                </p>
                <div className="flex items-center gap-4">
                  <div className={`${getScoreColor(analysis.profitability_score || 0)} scale-125`}>
                    {getScoreIcon(analysis.profitability_score || 0)}
                  </div>
                  <span className="text-6xl font-bold tracking-tight">
                    {analysis.profitability_score || 0}
                    <span className="text-3xl text-muted-foreground">/100</span>
                  </span>
                </div>
              </div>
              <Badge
                className={`text-xl px-8 py-3 font-semibold ${
                  analysis.recommendation?.includes("Sehr")
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : analysis.recommendation?.includes("Bedingt")
                      ? "bg-amber-500 hover:bg-amber-600 text-white"
                      : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {analysis.recommendation}
              </Badge>
            </div>
            <Progress value={analysis.profitability_score || 0} className="h-5 bg-muted" />
          </div>
        </Card>

        {/* Key Metrics - 3 Column Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <Target className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-base font-medium text-muted-foreground">Break-Even</p>
              </div>
              <p className="text-5xl font-bold">{analysis.break_even_point || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">Leistungen bis zur Kostendeckung</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <Euro className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-base font-medium text-muted-foreground">Fixkosten</p>
              </div>
              <p className="text-5xl font-bold">
                {(analysis.total_one_time_cost || 0).toFixed(2)} <span className="text-2xl">€</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">Einmalige Investition</p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Euro className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-base font-medium text-muted-foreground">Variable Kosten</p>
              </div>
              <p className="text-5xl font-bold">
                {(analysis.total_variable_cost || 0).toFixed(2)} <span className="text-2xl">€</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">Pro durchgeführter Leistung</p>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Scenarios */}
        {analysis.pricing_scenarios?.length > 0 && (
          <Card className="border-2">
            <CardHeader className="pb-4 border-b bg-muted/30">
              <CardTitle className="text-2xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Preisszenarien im Vergleich
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid gap-6 md:grid-cols-3">
                {analysis.pricing_scenarios.map((scenario: any, idx: number) => {
                  const isMiddle = idx === 1
                  return (
                    <Card
                      key={idx}
                      className={`border-2 transition-all ${
                        isMiddle ? "border-primary shadow-lg scale-[1.02] bg-primary/5" : "hover:border-muted-foreground/30"
                      }`}
                    >
                      <CardContent className="p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="font-semibold text-xl">{scenario.name}</h4>
                          {isMiddle && <Badge className="bg-primary text-primary-foreground">Empfohlen</Badge>}
                        </div>
                        <div className="text-center py-6 mb-6 bg-muted/50 rounded-lg">
                          <p className="text-5xl font-bold">
                            {scenario.price} <span className="text-2xl">€</span>
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">pro Leistung</p>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-muted-foreground">Nachfrage/Monat</span>
                            <span className="font-semibold text-lg">{scenario.expected_monthly_demand}x</span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-muted-foreground">Monatsgewinn</span>
                            <span
                              className={`font-semibold text-lg ${(scenario.monthlyProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {scenario.monthlyProfit?.toFixed(2) || "0.00"} €
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-muted-foreground">Jahresgewinn</span>
                            <span
                              className={`font-semibold text-lg ${(scenario.yearlyProfit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {scenario.yearlyProfit?.toFixed(2) || "0.00"} €
                            </span>
                          </div>
                          {scenario.roi !== undefined && (
                            <div className="flex justify-between items-center py-3">
                              <span className="text-muted-foreground">ROI</span>
                              <Badge variant="outline" className="font-semibold text-base px-3 py-1">
                                {scenario.roi.toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis */}
        {analysis.ai_analysis && (
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                KI-Analyse & Empfehlungen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose prose-base dark:prose-invert max-w-none">
                {typeof analysis.ai_analysis === "string" ? (
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{analysis.ai_analysis}</p>
                ) : (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(analysis.ai_analysis, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyse löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Analyse für "{analysis.service_name}" wirklich löschen? Diese Aktion kann nicht rückgängig
              gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lösche...
                </>
              ) : (
                "Löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
