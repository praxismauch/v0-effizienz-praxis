"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Shield,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  ArrowLeft,
  PlayCircle,
  Package,
  Target,
  Sparkles,
  Droplets,
  Trash,
  HardHat,
  ExternalLink,
  Loader2,
  Edit,
  User,
  Calendar,
} from "lucide-react"
import { formatDateDE } from "@/lib/utils"

interface HygienePlan {
  id: string
  practice_id: number
  title: string
  description: string | null
  category: string
  area?: string
  frequency: string | null
  responsible_role: string | null
  content: {
    objective?: string
    materials?: string[]
    steps?: Array<{ step: number; description: string; critical: boolean }>
    documentation?: string
    quality_indicators?: string[]
    references?: string[]
  }
  is_rki_template: boolean
  rki_reference_url: string | null
  status: string
  tags: string[]
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Shield; color: string; bgColor: string }> = {
  infection_control: { label: "Infektionskontrolle", icon: Shield, color: "#0ea5e9", bgColor: "#e0f2fe" },
  sterilization: { label: "Sterilisation", icon: Droplets, color: "#8b5cf6", bgColor: "#f3e8ff" },
  cleaning: { label: "Reinigung", icon: Sparkles, color: "#10b981", bgColor: "#d1fae5" },
  waste_management: { label: "Abfallmanagement", icon: Trash, color: "#f59e0b", bgColor: "#fef3c7" },
  occupational_safety: { label: "Arbeitsschutz", icon: HardHat, color: "#ef4444", bgColor: "#fee2e2" },
  quality_management: { label: "Qualitaetsmanagement", icon: Target, color: "#6366f1", bgColor: "#e0e7ff" },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Aktiv", color: "#10b981" },
  draft: { label: "Entwurf", color: "#6b7280" },
  archived: { label: "Archiviert", color: "#9ca3af" },
  needs_review: { label: "Überprüfung nötig", color: "#f59e0b" },
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  quarterly: "Vierteljährlich",
  yearly: "Jährlich",
  as_needed: "Bei Bedarf",
}

export default function HygienePlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentPractice } = useUser()
  const [plan, setPlan] = useState<HygienePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("")
  const [editFrequency, setEditFrequency] = useState("")
  const [editStatus, setEditStatus] = useState("")

  const planId = params.planId as string

  useEffect(() => {
    if (currentPractice?.id && planId) {
      loadPlan()
    }
  }, [currentPractice?.id, planId])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/practices/${currentPractice?.id}/hygiene-plans/${planId}`)
      if (!response.ok) {
        setError("Hygieneplan nicht gefunden")
        return
      }
      const data = await response.json()
      const hp = data.hygienePlan
      setPlan({ ...hp, category: hp.category || hp.area || "" })
    } catch (err) {
      setError("Fehler beim Laden des Hygieneplans")
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = () => {
    if (!plan) return
    setEditTitle(plan.title)
    setEditDescription(plan.description || "")
    setEditCategory(plan.category)
    setEditFrequency(plan.frequency || "")
    setEditStatus(plan.status)
    setEditOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!plan || !currentPractice?.id) return
    try {
      setSaving(true)
      const response = await fetch(`/api/practices/${currentPractice.id}/hygiene-plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          category: editCategory,
          frequency: editFrequency,
          status: editStatus,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setPlan((prev) =>
          prev
            ? {
                ...prev,
                title: editTitle,
                description: editDescription,
                category: editCategory,
                frequency: editFrequency,
                status: editStatus,
                updated_at: new Date().toISOString(),
                ...data.hygienePlan,
              }
            : prev
        )
        setEditOpen(false)
      }
    } catch {
      // silently handle
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !plan) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">{error || "Hygieneplan nicht gefunden"}</p>
          <Button variant="outline" onClick={() => router.push("/hygieneplan")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Übersicht
          </Button>
        </div>
      </AppLayout>
    )
  }

  const categoryConfig = CATEGORY_CONFIG[plan.category]
  const statusConfig = STATUS_CONFIG[plan.status]
  const CategoryIcon = categoryConfig?.icon || FileText
  const criticalSteps = plan.content?.steps?.filter((s) => s.critical) || []
  const totalSteps = plan.content?.steps?.length || 0

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button + Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/hygieneplan")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              PDF-Export
            </Button>
            <Button variant="outline" size="sm" onClick={openEditDialog}>
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <Card
          className="overflow-hidden"
          style={{ borderTopWidth: "4px", borderTopColor: categoryConfig?.color || "#6b7280" }}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div
                className="p-4 rounded-xl shrink-0"
                style={{ backgroundColor: categoryConfig?.bgColor || "#f3f4f6" }}
              >
                <CategoryIcon className="h-8 w-8" style={{ color: categoryConfig?.color || "#6b7280" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-balance">{plan.title}</h1>
                    {plan.description && (
                      <p className="text-muted-foreground mt-2 text-balance leading-relaxed">{plan.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {statusConfig && (
                    <Badge style={{ backgroundColor: statusConfig.color, color: "#fff" }}>
                      {statusConfig.label}
                    </Badge>
                  )}
                  {categoryConfig && <Badge variant="secondary">{categoryConfig.label}</Badge>}
                  {plan.is_rki_template && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      RKI-konform
                    </Badge>
                  )}
                  {plan.frequency && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {FREQUENCY_LABELS[plan.frequency] || plan.frequency}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta info row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <PlayCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalSteps}</p>
                <p className="text-xs text-muted-foreground">Schritte</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalSteps.length}</p>
                <p className="text-xs text-muted-foreground">Kritische Schritte</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{plan.content?.materials?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Materialien</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{formatDateDE(plan.updated_at)}</p>
                <p className="text-xs text-muted-foreground">Zuletzt aktualisiert</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objective */}
        {plan.content?.objective && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                Zielsetzung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{plan.content.objective}</p>
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        {plan.content?.materials && plan.content.materials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-primary" />
                Benoetigte Materialien
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.content.materials.map((material, index) => (
                  <div key={index} className="flex items-center gap-2 rounded-lg border p-3">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm">{material}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        {plan.content?.steps && plan.content.steps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PlayCircle className="h-5 w-5 text-primary" />
                Durchfuehrungsschritte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.content.steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                    step.critical ? "border-l-4 border-l-destructive bg-destructive/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-full shrink-0 font-bold text-sm ${
                      step.critical
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{step.description}</p>
                    {step.critical && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-xs font-semibold text-destructive">Kritischer Schritt - besondere Sorgfalt erforderlich</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Documentation */}
          {plan.content?.documentation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary" />
                  Dokumentationspflichten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{plan.content.documentation}</p>
              </CardContent>
            </Card>
          )}

          {/* Quality Indicators */}
          {plan.content?.quality_indicators && plan.content.quality_indicators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Qualitaetsindikatoren
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.content.quality_indicators.map((indicator, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* References */}
        {(plan.rki_reference_url || (plan.content?.references && plan.content.references.length > 0)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ExternalLink className="h-5 w-5 text-primary" />
                Referenzen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {plan.rki_reference_url && (
                <a
                  href={plan.rki_reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Shield className="h-4 w-4" />
                  RKI-Referenz: {plan.rki_reference_url}
                </a>
              )}
              {plan.content?.references?.map((ref, index) => (
                <div key={index} className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground">{ref}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Footer meta */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              {plan.responsible_role && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Verantwortlich: <span className="font-medium text-foreground">{plan.responsible_role}</span></span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Erstellt: {formatDateDE(plan.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Aktualisiert: {formatDateDE(plan.updated_at)}</span>
              </div>
              {plan.tags && plan.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {plan.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Hygieneplan bearbeiten
            </DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Details dieses Hygieneplans.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Titel *</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">Beschreibung</Label>
              <Textarea id="edit-desc" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategorie</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Häufigkeit</Label>
                <Select value={editFrequency} onValueChange={setEditFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Häufigkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Quartalsweise</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                    <SelectItem value="as_needed">Bei Bedarf</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editTitle.trim()}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gespeichert...
                </>
              ) : (
                "Speichern"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
