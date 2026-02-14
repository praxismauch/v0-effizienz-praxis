"use client"

import { AlertTriangle, Shield, TrendingUp, Clock, MessageSquare, EyeOff, Sparkles } from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
}

export function IncidentCard({ incident, onClick }: IncidentCardProps) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
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
          <div className="text-right text-sm text-muted-foreground">
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
