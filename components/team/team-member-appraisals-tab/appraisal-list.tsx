"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Calendar, Star, MessageSquare, FileText, Edit, Trash2,
  CheckCircle, Clock, AlertCircle, ChevronRight, GraduationCap,
} from "lucide-react"
import type { Appraisal } from "./types"

interface AppraisalListProps {
  appraisals: Appraisal[]
  skills: Array<{ id: string; name: string; category: string | null; description: string | null; current_level: number | null; target_level: number | null }>
  memberName: string
  isAdmin: boolean
  onNew: () => void
  onEdit: (appraisal: Appraisal) => void
  onDelete: (id: string) => void
}

function getStatusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Entwurf</Badge>
    case "scheduled":
      return <Badge variant="outline" className="border-blue-500 text-blue-600"><Calendar className="w-3 h-3 mr-1" />Geplant</Badge>
    case "in_progress":
      return <Badge variant="outline" className="border-amber-500 text-amber-600"><AlertCircle className="w-3 h-3 mr-1" />In Bearbeitung</Badge>
    case "completed":
      return <Badge variant="outline" className="border-emerald-500 text-emerald-600"><CheckCircle className="w-3 h-3 mr-1" />Abgeschlossen</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getRatingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
  ))
}

function getAppraisalTypeLabel(type: string) {
  switch (type) {
    case "annual": return "Jahresgespräch"
    case "semi_annual": return "Halbjahresgespräch"
    case "quarterly": return "Quartalsgespräch"
    case "probation": return "Probezeit-Gespräch"
    case "ad_hoc": return "Zwischengespräch"
    default: return type
  }
}

export function AppraisalList({ appraisals, skills, memberName, isAdmin, onNew, onEdit, onDelete }: AppraisalListProps) {
  return (
    <>
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mitarbeitergespräche
              </CardTitle>
              <CardDescription>
                {appraisals.length} Gespräch{appraisals.length !== 1 ? "e" : ""} erfasst
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={onNew}>
                <Plus className="w-4 h-4 mr-2" />
                Neues Gespräch
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><FileText className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{appraisals.length}</p>
                <p className="text-xs text-muted-foreground">Gespräche gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100"><Star className="w-5 h-5 text-amber-600" /></div>
              <div>
                <p className="text-2xl font-bold">
                  {appraisals.find((a) => a.status === "completed")?.overall_rating?.toFixed(1) || "-"}
                </p>
                <p className="text-xs text-muted-foreground">Letzte Bewertung</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><GraduationCap className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{skills.length}</p>
                <p className="text-xs text-muted-foreground">Skills erfasst</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100"><CheckCircle className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <p className="text-2xl font-bold">{appraisals.filter((a) => a.status === "completed").length}</p>
                <p className="text-xs text-muted-foreground">Abgeschlossen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {appraisals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">Noch keine Mitarbeitergespräche</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Erstellen Sie das erste Mitarbeitergespräch für {memberName}
            </p>
            {isAdmin && (
              <Button onClick={onNew}><Plus className="w-4 h-4 mr-2" />Gespräch erstellen</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appraisals.map((appraisal) => (
            <Card key={appraisal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEdit(appraisal)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{getAppraisalTypeLabel(appraisal.appraisal_type)}</span>
                        {getStatusBadge(appraisal.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appraisal.appraisal_date).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {appraisal.overall_rating && (
                      <div className="flex items-center gap-1">
                        {getRatingStars(Math.round(appraisal.overall_rating))}
                        <span className="ml-2 font-medium">{appraisal.overall_rating.toFixed(1)}</span>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(appraisal) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(appraisal.id) }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
