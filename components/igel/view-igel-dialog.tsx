"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, AlertCircle, Euro, Target, Edit, Trash2, Loader2, Sparkles } from "lucide-react"
import { Progress } from "@/components/ui/progress"
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
import { useToast } from "@/hooks/use-toast"
import { deleteIgelAnalysis } from "@/hooks/use-igel"

interface ViewIgelDialogProps {
  analysis: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onEdit?: (analysis: any) => void
}

function ViewIgelDialog({ analysis, open, onOpenChange, onSuccess, onEdit }: ViewIgelDialogProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-5 w-5" />
    if (score >= 40) return <AlertCircle className="h-5 w-5" />
    return <TrendingDown className="h-5 w-5" />
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteIgelAnalysis(analysis.practice_id, analysis.id)

      toast({
        title: "Gelöscht",
        description: "Die Analyse wurde gelöscht",
      })

      onSuccess()
      onOpenChange(false)
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{analysis.service_name}</DialogTitle>
            <DialogDescription>Analyse Ergebnisse für Selbstzahlerleistung</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Rentabilitätsscore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={getScoreColor(analysis.profitability_score || 0)}>
                      {getScoreIcon(analysis.profitability_score || 0)}
                    </div>
                    <span className="text-3xl font-bold">{analysis.profitability_score || 0}/100</span>
                  </div>
                  <Badge
                    variant={
                      analysis.recommendation?.includes("Sehr")
                        ? "default"
                        : analysis.recommendation?.includes("Bedingt")
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {analysis.recommendation}
                  </Badge>
                </div>
                <Progress value={analysis.profitability_score || 0} />
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Break-Even
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{analysis.break_even_point} Leistungen</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Fixkosten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{(analysis.total_one_time_cost || 0).toFixed(2)} €</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Variable Kosten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{(analysis.total_variable_cost || 0).toFixed(2)} €</p>
                  <p className="text-xs text-muted-foreground">pro Leistung</p>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Scenarios */}
            {analysis.pricing_scenarios?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preisszenarien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.pricing_scenarios.map((scenario: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <Badge variant="outline">{scenario.price} €</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Nachfrage/Monat</p>
                          <p className="font-medium">{scenario.expected_monthly_demand}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Monatsgewinn</p>
                          <p className="font-medium">{scenario.monthlyProfit?.toFixed(2)} €</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Jahresgewinn</p>
                          <p className="font-medium">{scenario.yearlyProfit?.toFixed(2)} €</p>
                        </div>
                      </div>
                      {scenario.roi && (
                        <p className="text-sm">
                          ROI: <span className="font-medium">{scenario.roi.toFixed(1)}%</span>
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* AI Analysis */}
            {analysis.ai_analysis && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4 text-primary" />
                    KI-Empfehlungen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {typeof analysis.ai_analysis === "string" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{analysis.ai_analysis}</p>
                    ) : (
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                        {JSON.stringify(analysis.ai_analysis, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onEdit(analysis)
                  onOpenChange(false)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Bearbeiten
              </Button>
            )}
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </>
  )
}

export { ViewIgelDialog }
export default ViewIgelDialog
