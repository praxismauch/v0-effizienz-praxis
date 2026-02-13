"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  Calendar,
  Eye,
  MessageSquare,
  PauseCircle,
  PlayCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, parseISO, isBefore, isAfter, differenceInDays } from "date-fns"
import type { Survey } from "../types"

interface SurveyCardProps {
  survey: Survey
  onEdit: (survey: Survey) => void
  onDelete: (surveyId: string) => void
  onDuplicate: (survey: Survey) => void
  onCopyLink: (survey: Survey) => void
  onToggleStatus: (survey: Survey) => void
  onShowResults: (survey: Survey) => void
}

function getSurveyTimeStatus(survey: Survey) {
  if (!survey.start_date && !survey.end_date) return null
  const now = new Date()
  if (survey.start_date && isBefore(now, parseISO(survey.start_date))) {
    return { label: `Startet in ${differenceInDays(parseISO(survey.start_date), now)} Tagen`, color: "text-blue-600" }
  }
  if (survey.end_date && isAfter(now, parseISO(survey.end_date))) {
    return { label: "Abgelaufen", color: "text-red-600" }
  }
  if (survey.end_date) {
    const daysLeft = differenceInDays(parseISO(survey.end_date), now)
    return { label: `Noch ${daysLeft} Tage`, color: daysLeft <= 3 ? "text-amber-600" : "text-emerald-600" }
  }
  return null
}

export function SurveyCard({
  survey,
  onEdit,
  onDelete,
  onDuplicate,
  onCopyLink,
  onToggleStatus,
  onShowResults,
}: SurveyCardProps) {
  const timeStatus = getSurveyTimeStatus(survey)

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base leading-snug truncate">{survey.title}</CardTitle>
            {survey.description && (
              <CardDescription className="line-clamp-2 text-xs mt-1">{survey.description}</CardDescription>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(survey)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(survey)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplizieren
              </DropdownMenuItem>
              {survey.public_token && (
                <DropdownMenuItem onClick={() => onCopyLink(survey)}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Link kopieren
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(survey.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={survey.status === "active" ? "default" : survey.status === "draft" ? "secondary" : "outline"}
            className={cn(survey.status === "active" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100")}
          >
            {survey.status === "active"
              ? "Aktiv"
              : survey.status === "draft"
                ? "Entwurf"
                : survey.status === "closed"
                  ? "Beendet"
                  : "Archiviert"}
          </Badge>
          {survey.survey_type && (
            <Badge variant="outline" className="text-xs">
              {survey.survey_type === "internal" ? "Intern" : survey.survey_type === "external" ? "Extern" : "Anonym"}
            </Badge>
          )}
          {survey.is_anonymous && (
            <Badge variant="outline" className="text-xs gap-1">
              <Eye className="h-3 w-3" />
              Anonym
            </Badge>
          )}
          {timeStatus && (
            <Badge variant="outline" className={cn("text-xs", timeStatus.color)}>
              {timeStatus.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3 pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{survey.response_count || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">
                {survey.created_at ? format(parseISO(survey.created_at), "dd.MM.yyyy") : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <div className="px-6 pb-4 flex gap-2">
        {survey.status === "active" || survey.status === "closed" ? (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onShowResults(survey)}>
            <BarChart3 className="h-4 w-4 mr-1" />
            Ergebnisse
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(survey)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Bearbeiten
          </Button>
        )}
        <Button
          variant={survey.status === "active" ? "destructive" : "default"}
          size="sm"
          className={cn("flex-1", survey.status === "active" && "bg-amber-600 hover:bg-amber-700")}
          onClick={() => onToggleStatus(survey)}
        >
          {survey.status === "active" ? (
            <>
              <PauseCircle className="h-4 w-4 mr-1" />
              Beenden
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-1" />
              Aktivieren
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
