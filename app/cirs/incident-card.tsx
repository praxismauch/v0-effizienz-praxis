"use client"

import { AlertTriangle, Shield, TrendingUp, Clock, MessageSquare, EyeOff, Sparkles, Pencil, Trash2 } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDateDE } from "@/lib/utils"
import type { CIRSIncident } from "./cirs-constants"
import { getSeverityColor, getSeverityLabel, getTypeLabel, getCategoryLabel } from "./cirs-constants"

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

interface IncidentCardProps {
  incident: CIRSIncident
  onClick: () => void
  onEdit?: (incident: CIRSIncident) => void
  onDelete?: (incident: CIRSIncident) => void
}

export function IncidentCard({ incident, onClick, onEdit, onDelete }: IncidentCardProps) {
  return (
    <Card
      className="group relative hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Hover action buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={200}>
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 border shadow-sm hover:bg-muted transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(incident)
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Bearbeiten</p></TooltipContent>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 border shadow-sm hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(incident)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p>Löschen</p></TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="gap-1">
                {getTypeIcon(incident.incident_type)}
                {getTypeLabel(incident.incident_type)}
              </Badge>
              <Badge className={getSeverityColor(incident.severity)}>{getSeverityLabel(incident.severity)}</Badge>
              <Badge variant="secondary">{getCategoryLabel(incident.category)}</Badge>
              {incident.is_anonymous && (
                <Badge variant="outline" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Anonym
                </Badge>
              )}
              {incident.ai_suggestions && (
                <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3" />
                  KI-Analyse
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg mb-1">{incident.title}</CardTitle>
            <CardDescription className="line-clamp-2">{incident.description}</CardDescription>
          </div>
          <div className="text-right text-sm text-muted-foreground mr-0 group-hover:mr-16 transition-all">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateDE(incident.created_at)}
            </div>
            {!incident.is_anonymous && incident.reporter_name && (
              <div className="mt-1">{incident.reporter_name}</div>
            )}
            {incident.comment_count && incident.comment_count > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <MessageSquare className="h-3 w-3" />
                {incident.comment_count}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
