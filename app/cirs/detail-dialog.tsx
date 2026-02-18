"use client"

import { EyeOff, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatDateDE } from "@/lib/utils"
import type { CIRSIncident } from "./cirs-constants"
import { getSeverityColor, getSeverityLabel, getTypeLabel, getCategoryLabel } from "./cirs-constants"
import { AlertTriangle, Shield, TrendingUp } from "lucide-react"

function getTypeIcon(type: string) {
  switch (type) {
    case "error":
      return <AlertTriangle className="h-4 w-4" />
    case "near_error":
      return <Shield className="h-4 w-4" />
    case "adverse_event":
      return <TrendingUp className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

interface DetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: CIRSIncident | null
}

export function DetailDialog({ open, onOpenChange, incident }: DetailDialogProps) {
  if (!incident) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              {getTypeIcon(incident.incident_type)}
              {getTypeLabel(incident.incident_type)}
            </Badge>
            <Badge className={getSeverityColor(incident.severity)}>
              {getSeverityLabel(incident.severity)}
            </Badge>
            <Badge variant="secondary">{getCategoryLabel(incident.category)}</Badge>
            {incident.is_anonymous && (
              <Badge variant="outline" className="gap-1">
                <EyeOff className="h-3 w-3" />
                Anonym
              </Badge>
            )}
          </div>
          <DialogTitle>{incident.title}</DialogTitle>
          <DialogDescription>
            Gemeldet am {formatDateDE(incident.created_at)}
            {!incident.is_anonymous && incident.reporter_name && ` von ${incident.reporter_name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="font-semibold">Beschreibung</Label>
            <p className="text-sm mt-2 whitespace-pre-wrap">{incident.description}</p>
          </div>

          {incident.contributing_factors && (
            <div>
              <Label className="font-semibold">Beitragende Faktoren</Label>
              <p className="text-sm mt-2 whitespace-pre-wrap">{incident.contributing_factors}</p>
            </div>
          )}

          {incident.immediate_actions && (
            <div>
              <Label className="font-semibold">{"Sofortmaßnahmen"}</Label>
              <p className="text-sm mt-2 whitespace-pre-wrap">{incident.immediate_actions}</p>
            </div>
          )}

          {incident.ai_suggestions && (
            <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <Label className="font-semibold text-purple-900">KI-Analyse und Empfehlungen</Label>
              </div>
              <p className="text-sm text-purple-900 whitespace-pre-wrap">{incident.ai_suggestions}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {"Schließen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
