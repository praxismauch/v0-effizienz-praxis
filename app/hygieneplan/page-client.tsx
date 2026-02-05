"use client"

import { useState, useEffect } from "react"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  },
  sterilization: {
    label: "Sterilisation",
    icon: Droplets,
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
  },
  cleaning: {
    label: "Reinigung",
    icon: Sparkles,
    color: "#10b981",
    bgColor: "#d1fae5",
  },
  waste_management: {
    label: "Abfallmanagement",
    icon: Trash,
    color: "#f59e0b",
    bgColor: "#fef3c7",
  },
  occupational_safety: {
    label: "Arbeitsschutz",
    icon: HardHat,
    color: "#ef4444",
    bgColor: "#fee2e2",
  },
  quality_management: {
    label: "Qualitätsmanagement",
    icon: Target,
    color: "#6366f1",
    bgColor: "#e0e7ff",
  },
}

const STATUS_CONFIG = {
  active: { label: "Aktiv", variant: "default" as const, color: "#10b981" },
  draft: { label: "Entwurf", variant: "secondary" as const, color: "#6b7280" },
  archived: { label: "Archiviert", variant: "outline" as const, color: "#9ca3af" },
  needs_review: { label: "Überprüfung", variant: "destructive" as const, color: "#f59e0b" },
}

export default function HygienePlanClient() {
  const { currentUser, currentPractice } = useUser()
  const [hygienePlans, setHygienePlans] = useState<HygienePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<HygienePlan | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (currentPractice?.id) {
      loadHygienePlans()
    }
  }, [currentPractice?.id])

  const loadHygienePlans = async () => {
    try {
      console.log("[v0] Loading hygiene plans for practice:", currentPractice?.id)
      const response = await fetch(`/api/practices/${currentPractice?.id}/hygiene-plans`)
      console.log("[v0] Hygiene plans response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Hygiene plans loaded:", data.hygienePlans?.length || 0, "plans")
        setHygienePlans(data.hygienePlans || [])
      } else {
        const errorText = await response.text()
        console.error("[v0] Error response:", errorText)
        toast.error("Fehler beim Laden der Hygienepläne")
      }
    } catch (error) {
      console.error("[v0] Error loading hygiene plans:", error)
      toast.error("Fehler beim Laden der Hygienepläne")
    } finally {
      setLoading(false)
    }
  }

  const generateAIPlan = async (category: string, customRequirements: string) => {
    setGenerating(true)
    try {
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

      if (response.ok) {
        const data = await response.json()
        toast.success("KI-Hygieneplan erfolgreich erstellt")
        setHygienePlans([data.hygienePlan, ...hygienePlans])
        setIsGenerateDialogOpen(false)
      } else {
        toast.error("Fehler beim Generieren des Hygieneplans")
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
      <div className="space-y-8 max-w-7xl mx-auto">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
          const Icon = config.icon
          const count = categoryStats[key] || 0
          return (
            <Card key={key} className="hover:shadow-md transition-all cursor-pointer" style={{ borderLeftWidth: "4px", borderLeftColor: config.color }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: config.bgColor }}>
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{config.label}</p>
              </CardContent>
            </Card>
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
                onClick={() => setSelectedPlan(plan)}
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
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation(); setSelectedPlan(plan)}}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
      </div>
    </AppLayout>
  )
}

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

  const handleGenerate = () => {
    if (!selectedCategory) {
      toast.error("Bitte wählen Sie eine Kategorie")
      return
    }
    onGenerate(selectedCategory, customRequirements)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            KI-gestützten Hygieneplan generieren
          </DialogTitle>
          <DialogDescription>
            Erstellen Sie automatisch einen RKI-konformen Hygieneplan basierend auf aktuellen Richtlinien
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Kategorie auswählen</Label>
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
              placeholder="Z.B. spezielle Geräte, besondere Patientengruppen, zusätzliche Anforderungen..."
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Abbrechen
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !selectedCategory} className="bg-gradient-to-r from-violet-600 to-indigo-600">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Wird generiert...
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
