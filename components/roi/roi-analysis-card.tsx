"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { TrendingUp, Calendar, Euro, Pencil } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ViewRoiAnalysisDialog } from "./view-roi-analysis-dialog"
import { DeleteIconButton } from "@/components/delete-icon-button"

interface RoiAnalysisCardProps {
  analysis: any
  onDeleted: (id: string) => void
  onUpdated: () => void
}

export function RoiAnalysisCard({ analysis, onDeleted, onUpdated }: RoiAnalysisCardProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/roi-analysis/${analysis.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        onDeleted(analysis.id)
      }
    } catch (error) {
      console.error("Error deleting analysis:", error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "highly_recommended":
        return <Badge className="bg-green-500">Sehr empfehlenswert</Badge>
      case "recommended":
        return <Badge className="bg-blue-500">Empfehlenswert</Badge>
      case "neutral":
        return <Badge variant="secondary">Neutral</Badge>
      case "not_recommended":
        return <Badge variant="destructive">Nicht empfohlen</Badge>
      default:
        return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600"
    if (score >= 50) return "text-blue-600"
    if (score >= 25) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/roi-analysis/${analysis.id}`)}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{analysis.service_name}</CardTitle>
              {analysis.description && (
                <CardDescription className="line-clamp-2 mt-1">{analysis.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <DeleteIconButton
                onDelete={handleDelete}
                tooltip="Löschen"
                confirmTitle="Analyse löschen?"
                confirmDescription={`Möchten Sie die Analyse "${analysis.service_name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
                disabled={deleting}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ROI Score */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">ROI-Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(analysis.roi_score || 0)}`}>
              {analysis.roi_score || 0}/100
            </span>
          </div>

          {/* Recommendation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Empfehlung</span>
            {getRecommendationBadge(analysis.recommendation)}
          </div>

          {/* Break-even */}
          {analysis.break_even_months && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amortisation</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {analysis.break_even_months.toFixed(1)} Monate
              </span>
            </div>
          )}

          {/* Realistic Price */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Preis (realistisch)</span>
            <span className="text-sm font-medium flex items-center gap-1">
              <Euro className="h-3 w-3" />
              {analysis.scenario_realistic?.toFixed(2)}
            </span>
          </div>

          {/* Monthly Profit Estimate */}
          {analysis.scenario_realistic && analysis.demand_realistic && analysis.total_variable_costs && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gewinn/Monat (realistisch)</span>
                <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {((analysis.scenario_realistic - analysis.total_variable_costs) * analysis.demand_realistic).toFixed(
                    2,
                  )}{" "}
                  €
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ViewRoiAnalysisDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        analysisId={analysis.id}
        onUpdated={onUpdated}
        initialEditMode
      />
    </>
  )
}
