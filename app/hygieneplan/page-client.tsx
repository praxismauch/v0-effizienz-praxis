"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Shield,
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Loader2,
  PlayCircle,
  Droplets,
  Package,
  Trash,
  HardHat,
  Target,
} from "lucide-react"
import { toast } from "sonner"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface HygienePlan {
  id: string
  practice_id: number
  title: string
  description: string | null
  category: string
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

const CATEGORY_CONFIG = {
  infection_control: {
    label: "Infektionskontrolle",
    icon: Shield,
    color: "#0ea5e9",
    bgColor: "#e0f2fe",
    statColor: statCardColors.info,
  },
  sterilization: {
    label: "Sterilisation",
    icon: Droplets,
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
    statColor: statCardColors.purple,
  },
  cleaning: {
    label: "Reinigung",
    icon: Sparkles,
    color: "#10b981",
    bgColor: "#d1fae5",
    statColor: statCardColors.success,
  },
  waste_management: {
    label: "Abfallmanagement",
    icon: Trash,
    color: "#f59e0b",
    bgColor: "#fef3c7",
    statColor: statCardColors.warning,
  },
  occupational_safety: {
    label: "Arbeitsschutz",
    icon: HardHat,
    color: "#ef4444",
    bgColor: "#fee2e2",
    statColor: statCardColors.danger,
  },
  quality_management: {
    label: "Qualitätsmanagement",
    icon: Target,
    color: "#6366f1",
    bgColor: "#e0e7ff",
    statColor: statCardColors.purple,
  },
}

const HEADER_STAT_KEYS: (keyof typeof CATEGORY_CONFIG)[] = [
  "infection_control",
  "sterilization",
  "cleaning",
  "quality_management",
]

const STATUS_CONFIG = {
  active: { label: "Aktiv", variant: "default" as const, color: "#10b981" },
  draft: { label: "Entwurf", variant: "secondary" as const, color: "#6b7280" },
  archived: { label: "Archiviert", variant: "outline" as const, color: "#9ca3af" },
  needs_review: { label: "Überprüfung", variant: "destructive" as const, color: "#f59e0b" },
}

export default function HygienePlanClient() {
  const { currentUser, currentPractice } = useUser()
  const router = useRouter()
  const [hygienePlans, setHygienePlans] = useState<HygienePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<HygienePlan | null>(null)
  const [editingPlan, setEditingPlan] = useState<HygienePlan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<HygienePlan | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      loadHygienePlans()
    }
  }, [currentPractice?.id])

  const deletePlan = async (planId: string) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/hygiene-plans/${planId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setHygienePlans((prev) => prev.filter((p) => p.id !== planId))
        toast.success("Hygieneplan erfolgreich gelöscht")
      } else {
        toast.error("Fehler beim Löschen des Hygieneplans")
      }
    } catch (error) {
      console.error("Error deleting hygiene plan:", error)
      toast.error("Fehler beim Löschen des Hygieneplans")
    }
  }

  const updatePlan = async (planId: string, updates: Partial<HygienePlan>) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/hygiene-plans/${planId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          area: updates.category || updates.area,
          frequency: updates.frequency,
          status: updates.status,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        setHygienePlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, ...data.hygienePlan, category: data.hygienePlan?.area || p.category } : p))
        )
        toast.success("Hygieneplan erfolgreich aktualisiert")
        setEditingPlan(null)
      } else {
        toast.error("Fehler beim Aktualisieren des Hygieneplans")
      }
    } catch (error) {
      console.error("Error updating hygiene plan:", error)
      toast.error("Fehler beim Aktualisieren des Hygieneplans")
    }
  }

  const loadHygienePlans = async () => {
    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/hygiene-plans`)
      if (response.ok) {
        const data = await response.json()
        // Map DB 'area' column to 'category' used in the UI
        const plans = (data.hygienePlans || []).map((p: HygienePlan & { area?: string }) => ({
          ...p,
          category: p.category || p.area || "",
        }))
        setHygienePlans(plans)
      } else {
        toast.error("Fehler beim Laden der Hygienepläne")
      }
    } catch (error) {
      console.error("Error loading hygiene plans:", error)
      toast.error("Fehler beim Laden der Hygienepläne")
    } finally {
      setLoading(false)
    }
  }

  const generateAIPlan = async (category: string, customRequirements: string) => {
    setGenerating(true)
    try {
      console.log("[v0] Generating AI hygiene plan for:", category, "practice:", currentPractice?.id)
      const response = await fetch(`/api/practices/${currentPractice?.id}/hygiene-plans/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          practiceType: currentPractice?.practice_type || "Allgemeinmedizin",
          customRequirements,
          userId: currentUser?.id,
        }),
      })
      console.log("[v0] AI hygiene plan response status:", response.status, response.statusText)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] AI hygiene plan created:", data.hygienePlan?.id, "title:", data.hygienePlan?.title)
        toast.success("KI-Hygieneplan erfolgreich erstellt")
        // Map DB 'area' to 'category' for UI
        const newPlan = { ...data.hygienePlan, category: data.hygienePlan?.category || data.hygienePlan?.area || category }
        setHygienePlans([newPlan, ...hygienePlans])
        setIsGenerateDialogOpen(false)
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unbekannt" }))
        console.error("[v0] AI hygiene plan error:", errorData)
        toast.error(errorData.details || errorData.error || "Fehler beim Generieren des Hygieneplans")
      }
    } catch (error) {
      console.error("[v0] Error generating hygiene plan:", error)
      toast.error("Fehler beim Generieren des Hygieneplans")
    } finally {
      setGenerating(false)
    }
  }

  const filteredPlans = hygienePlans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === "all" || plan.category === filterCategory
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getCategoryStats = () => {
    const stats: Record<string, number> = {}
    hygienePlans.forEach((plan) => {
      stats[plan.category] = (stats[plan.category] || 0) + 1
    })
    return stats
  }

  const categoryStats = getCategoryStats()

  return (
    <AppLayout loading={loading} loadingMessage="Hygienepläne werden geladen...">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Hygieneplan</h1>
            <p className="text-muted-foreground">RKI-konforme Hygienepläne für Ihre Praxis</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Plan
            </Button>
            <Button onClick={() => setIsGenerateDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Sparkles className="h-4 w-4 mr-2" />
              KI-Plan generieren
            </Button>
          </div>
        </div>

        {/* Stats Grid - 4 most important categories */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {HEADER_STAT_KEYS.map((key) => {
            const config = CATEGORY_CONFIG[key]
            return (
              <StatCard
                key={key}
                label={config.label}
                value={categoryStats[key] || 0}
                icon={config.icon}
                {...config.statColor}
                description={`${categoryStats[key] || 0} Pläne`}
              />
            )
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hygieneplan suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Plans List */}
        {filteredPlans.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Shield className="h-16 w-16 mx-auto text-muted-foreground/20" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Keine Hygienepläne gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterCategory !== "all" || filterStatus !== "all"
                      ? "Passen Sie Ihre Filter an oder erstellen Sie einen neuen Plan."
                      : "Erstellen Sie Ihren ersten Hygieneplan oder generieren Sie einen mit KI."}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Plan erstellen
                    </Button>
                    <Button onClick={() => setIsGenerateDialogOpen(true)} className="bg-gradient-to-r from-violet-600 to-indigo-600">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Mit KI generieren
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPlans.map((plan) => {
              const categoryConfig = CATEGORY_CONFIG[plan.category as keyof typeof CATEGORY_CONFIG]
              const statusConfig = STATUS_CONFIG[plan.status as keyof typeof STATUS_CONFIG]
              const Icon = categoryConfig?.icon || FileText

              return (
                <Card
                  key={plan.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer"
                  style={{ borderLeftWidth: "6px", borderLeftColor: categoryConfig?.color || "#6b7280" }}
                  onClick={() => router.push(`/hygieneplan/${plan.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className="p-3 rounded-xl shrink-0"
                          style={{ backgroundColor: categoryConfig?.bgColor || "#f3f4f6" }}
                        >
                          <Icon className="h-6 w-6" style={{ color: categoryConfig?.color || "#6b7280" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{plan.title}</h3>
                            {plan.is_rki_template && (
                              <Badge variant="secondary" className="shrink-0">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                RKI
                              </Badge>
                            )}
                            <Badge variant={statusConfig.variant} className="shrink-0">
                              {statusConfig.label}
                            </Badge>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plan.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {plan.frequency && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="capitalize">{plan.frequency}</span>
                              </div>
                            )}
                            {plan.responsible_role && (
                              <div className="flex items-center gap-1">
                                <Target className="h-4 w-4" />
                                <span>{plan.responsible_role}</span>
                              </div>
                            )}
                            {plan.content?.steps && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                <span>{plan.content.steps.length} Schritte</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 border shadow-sm hover:bg-muted transition-colors"
                                onClick={(e) => { e.stopPropagation(); setEditingPlan(plan) }}
                              >
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Bearbeiten</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-background/90 border shadow-sm hover:bg-destructive/10 transition-colors"
                                onClick={(e) => { e.stopPropagation(); setDeletingPlan(plan) }}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom"><p>Loeschen</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Plan Dialog */}
        <CreateHygienePlanDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onCreated={(plan) => {
            setHygienePlans([plan, ...hygienePlans])
            setIsCreateDialogOpen(false)
          }}
          practiceId={currentPractice?.id?.toString() || ""}
          userId={currentUser?.id || ""}
        />

        {/* Generate AI Plan Dialog */}
        <GenerateAIPlanDialog
          open={isGenerateDialogOpen}
          onOpenChange={setIsGenerateDialogOpen}
          onGenerate={generateAIPlan}
          generating={generating}
        />

        {/* Plan Detail Dialog */}
        {selectedPlan && (
          <PlanDetailDialog
            plan={selectedPlan}
            open={!!selectedPlan}
            onOpenChange={(open) => !open && setSelectedPlan(null)}
          />
        )}

        {/* Edit Plan Dialog */}
        {editingPlan && (
          <EditPlanDialog
            plan={editingPlan}
            open={!!editingPlan}
            onOpenChange={(open) => !open && setEditingPlan(null)}
            onSave={(updates) => updatePlan(editingPlan.id, updates)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingPlan} onOpenChange={(open) => { if (!open) setDeletingPlan(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hygieneplan loeschen</AlertDialogTitle>
              <AlertDialogDescription>
                Moechten Sie den Hygieneplan &quot;{deletingPlan?.title}&quot; wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deletingPlan) {
                    deletePlan(deletingPlan.id)
                    setDeletingPlan(null)
                  }
                }}
              >
                Loeschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  )
}

// Progress steps for AI generation
const GENERATION_STEPS = [
  { at: 0, label: "Vorbereitung..." },
  { at: 10, label: "RKI-Richtlinien werden analysiert..." },
  { at: 25, label: "Praxisdaten werden ausgewertet..." },
  { at: 40, label: "Massnahmen werden erstellt..." },
  { at: 60, label: "Schritte werden formuliert..." },
  { at: 75, label: "Qualitaetsindikatoren werden definiert..." },
  { at: 88, label: "Dokumentation wird finalisiert..." },
  { at: 95, label: "Fast fertig..." },
]

// Generate AI Plan Dialog Component
function GenerateAIPlanDialog({
  open,
  onOpenChange,
  onGenerate,
  generating,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (category: string, customRequirements: string) => void
  generating: boolean
}) {
  const [selectedCategory, setSelectedCategory] = useState("")
  const [customRequirements, setCustomRequirements] = useState("")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Simulated progress that advances through realistic stages
  useEffect(() => {
    if (generating) {
      setProgress(0)
      setProgressLabel(GENERATION_STEPS[0].label)
      let current = 0

      intervalRef.current = setInterval(() => {
        current += Math.random() * 3 + 1 // Random increment between 1-4
        if (current > 95) current = 95 // Cap at 95 until done

        setProgress(Math.round(current))

        // Find the matching step label
        const step = [...GENERATION_STEPS].reverse().find((s) => current >= s.at)
        if (step) setProgressLabel(step.label)
      }, 400)
    } else {
      // When done generating, quickly animate to 100%
      if (progress > 0 && progress < 100) {
        setProgress(100)
        setProgressLabel("Fertig!")
        setTimeout(() => {
          setProgress(0)
          setProgressLabel("")
        }, 800)
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [generating])

  const handleGenerate = () => {
    if (!selectedCategory) {
      toast.error("Bitte waehlen Sie eine Kategorie")
      return
    }
    onGenerate(selectedCategory, customRequirements)
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            KI-gestuetzten Hygieneplan generieren
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie automatisch einen RKI-konformen Hygieneplan basierend auf aktuellen Richtlinien
          </DialogDescription>
        </DialogHeader>

        {generating ? (
          <div className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                <span className="text-lg font-semibold">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-violet-600 [&>div]:to-indigo-600 [&>div]:transition-all [&>div]:duration-300" />
              <p className="text-sm text-muted-foreground pt-2 animate-pulse">{progressLabel}</p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
              {["Analyse", "Erstellung", "Optimierung", "Finalisierung"].map((phase, i) => {
                const phaseStart = i * 25
                const isActive = progress >= phaseStart && progress < phaseStart + 25
                const isDone = progress >= phaseStart + 25
                return (
                  <div key={phase} className="space-y-1.5">
                    <div
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                        isDone
                          ? "bg-green-100 text-green-700"
                          : isActive
                            ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <p className={isDone ? "text-green-700 font-medium" : isActive ? "text-violet-700 font-medium" : ""}>{phase}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Kategorie auswaehlen</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  return (
                    <Card
                      key={key}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCategory === key ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedCategory(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: config.bgColor }}>
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Besondere Anforderungen (optional)</Label>
              <Textarea
                id="requirements"
                placeholder="Z.B. spezielle Geraete, besondere Patientengruppen, zusaetzliche Anforderungen..."
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Abbrechen
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !selectedCategory} className="bg-gradient-to-r from-violet-600 to-indigo-600">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird generiert... {progress}%
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Plan generieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Plan Detail Dialog Component
function PlanDetailDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: HygienePlan
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const categoryConfig = CATEGORY_CONFIG[plan.category as keyof typeof CATEGORY_CONFIG]
  const Icon = categoryConfig?.icon || FileText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className="p-3 rounded-xl shrink-0"
              style={{ backgroundColor: categoryConfig?.bgColor || "#f3f4f6" }}
            >
              <Icon className="h-6 w-6" style={{ color: categoryConfig?.color || "#6b7280" }} />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{plan.title}</DialogTitle>
              <DialogDescription className="mt-2">{plan.description}</DialogDescription>
              <div className="flex gap-2 mt-3">
                {plan.is_rki_template && (
                  <Badge variant="secondary">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    RKI-konform
                  </Badge>
                )}
                <Badge>{categoryConfig?.label}</Badge>
                {plan.frequency && <Badge variant="outline">{plan.frequency}</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="content" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Inhalt</TabsTrigger>
            <TabsTrigger value="documentation">Dokumentation</TabsTrigger>
            <TabsTrigger value="references">Referenzen</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-6 mt-6">
            {plan.content?.objective && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Zielsetzung
                </h3>
                <p className="text-muted-foreground">{plan.content.objective}</p>
              </div>
            )}

            {plan.content?.materials && plan.content.materials.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Benötigte Materialien
                </h3>
                <ul className="space-y-2">
                  {plan.content.materials.map((material, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.content?.steps && plan.content.steps.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" />
                  Durchführungsschritte
                </h3>
                <div className="space-y-3">
                  {plan.content.steps.map((step, index) => (
                    <Card key={index} className={step.critical ? "border-l-4 border-l-red-500" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{step.description}</p>
                            {step.critical && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                                <AlertCircle className="h-3 w-3" />
                                <span className="font-medium">Kritischer Schritt</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6 mt-6">
            {plan.content?.documentation && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Dokumentationspflichten
                </h3>
                <p className="text-muted-foreground">{plan.content.documentation}</p>
              </div>
            )}

            {plan.content?.quality_indicators && plan.content.quality_indicators.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Qualitätsindikatoren
                </h3>
                <ul className="space-y-2">
                  {plan.content.quality_indicators.map((indicator, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="references" className="space-y-6 mt-6">
            {plan.rki_reference_url && (
              <div>
                <h3 className="font-semibold mb-2">RKI-Referenz</h3>
                <a
                  href={plan.rki_reference_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-2"
                >
                  {plan.rki_reference_url}
                  <Download className="h-4 w-4" />
                </a>
              </div>
            )}

            {plan.content?.references && plan.content.references.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Weitere Referenzen</h3>
                <ul className="space-y-2">
                  {plan.content.references.map((reference, index) => (
                    <li key={index} className="text-muted-foreground">
                      {reference}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.responsible_role && (
              <div>
                <h3 className="font-semibold mb-2">Verantwortlich</h3>
                <p className="text-muted-foreground">{plan.responsible_role}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Als PDF exportieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create Hygiene Plan Dialog Component
function CreateHygienePlanDialog({
  open,
  onOpenChange,
  onCreated,
  practiceId,
  userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (plan: HygienePlan) => void
  practiceId: string
  userId: string
}) {
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [frequency, setFrequency] = useState("")
  const [responsibleRole, setResponsibleRole] = useState("")
  const [objective, setObjective] = useState("")
  const [materials, setMaterials] = useState("")
  const [steps, setSteps] = useState("")
  const [documentation, setDocumentation] = useState("")

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setCategory("")
    setFrequency("")
    setResponsibleRole("")
    setObjective("")
    setMaterials("")
    setSteps("")
    setDocumentation("")
  }

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Bitte geben Sie einen Titel ein")
      return
    }
    if (!category) {
      toast.error("Bitte wählen Sie eine Kategorie")
      return
    }

    setSaving(true)
    try {
      const content: Record<string, unknown> = {}
      if (objective.trim()) content.objective = objective.trim()
      if (materials.trim()) content.materials = materials.split("\n").map((m) => m.trim()).filter(Boolean)
      if (steps.trim()) {
        content.steps = steps.split("\n").map((s, i) => ({
          step: i + 1,
          description: s.trim(),
          critical: false,
        })).filter((s) => s.description)
      }
      if (documentation.trim()) content.documentation = documentation.trim()

      const response = await fetch(`/api/practices/${practiceId}/hygiene-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          category,
          frequency: frequency || null,
          responsible_role: responsibleRole.trim() || null,
          content,
          status: "active",
          tags: [],
          created_by: userId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("Hygieneplan erfolgreich erstellt")
        onCreated(data.hygienePlan)
        resetForm()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || "Fehler beim Erstellen des Hygieneplans")
      }
    } catch (error) {
      console.error("Error creating hygiene plan:", error)
      toast.error("Fehler beim Erstellen des Hygieneplans")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Neuen Hygieneplan erstellen
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie manuell einen neuen Hygieneplan für Ihre Praxis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="plan-title">Titel *</Label>
            <Input
              id="plan-title"
              placeholder="z.B. Flächendesinfektion Behandlungsraum"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="plan-desc">Beschreibung</Label>
            <Textarea
              id="plan-desc"
              placeholder="Kurze Beschreibung des Hygieneplans..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Category & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategorie *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
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
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Häufigkeit wählen" />
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

          {/* Responsible Role */}
          <div className="space-y-2">
            <Label htmlFor="plan-role">Verantwortliche Rolle</Label>
            <Input
              id="plan-role"
              placeholder="z.B. MFA, Hygienefachkraft, alle Mitarbeiter"
              value={responsibleRole}
              onChange={(e) => setResponsibleRole(e.target.value)}
            />
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label htmlFor="plan-objective">Zielsetzung</Label>
            <Textarea
              id="plan-objective"
              placeholder="Was soll mit diesem Hygieneplan erreicht werden?"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
            />
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label htmlFor="plan-materials">Benötigte Materialien (eine pro Zeile)</Label>
            <Textarea
              id="plan-materials"
              placeholder={"Flächendesinfektionsmittel\nEinmalhandschuhe\nWischtücher"}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              rows={3}
            />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <Label htmlFor="plan-steps">Durchführungsschritte (einer pro Zeile)</Label>
            <Textarea
              id="plan-steps"
              placeholder={"Hände desinfizieren\nFläche mit Desinfektionsmittel einsprühen\nEinwirkzeit beachten (mind. 1 Min.)\nMit Tuch abwischen"}
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              rows={4}
            />
          </div>

          {/* Documentation */}
          <div className="space-y-2">
            <Label htmlFor="plan-doc">Dokumentationspflichten</Label>
            <Textarea
              id="plan-doc"
              placeholder="Welche Dokumentation ist erforderlich?"
              value={documentation}
              onChange={(e) => setDocumentation(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim() || !category}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird erstellt...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Plan erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Edit Plan Dialog Component
function EditPlanDialog({
  plan,
  open,
  onOpenChange,
  onSave,
}: {
  plan: HygienePlan
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Partial<HygienePlan>) => void
}) {
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState(plan.title)
  const [description, setDescription] = useState(plan.description || "")
  const [category, setCategory] = useState(plan.category || plan.area || "")
  const [frequency, setFrequency] = useState(plan.frequency || "")
  const [status, setStatus] = useState(plan.status || "active")

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Bitte geben Sie einen Titel ein")
      return
    }
    setSaving(true)
    try {
      await onSave({ title: title.trim(), description: description.trim(), category, frequency, status })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Beschreibung</Label>
            <Textarea id="edit-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={category} onValueChange={setCategory}>
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
              <Select value={frequency} onValueChange={setFrequency}>
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
            <Select value={status} onValueChange={setStatus}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
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
  )
}
