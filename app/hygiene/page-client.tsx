"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  Shield,
  Plus,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
  Download,
  Search,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface HygienePlan {
  id: string
  practice_id: string
  title: string
  description?: string
  plan_type: string
  area: string
  frequency: string
  procedure: string
  responsible_role?: string
  products_used?: string[]
  documentation_required: boolean
  rki_reference?: string
  status: string
  created_at: string
  updated_at: string
  version: number
}

interface HygienePlanExecution {
  id: string
  plan_id: string
  executed_by: string
  executed_at: string
  notes?: string
  verification_status: string
}

const PLAN_TYPES = [
  { value: "desinfektion", label: "Desinfektion" },
  { value: "reinigung", label: "Reinigung" },
  { value: "sterilisation", label: "Sterilisation" },
  { value: "haendehygiene", label: "Händehygiene" },
  { value: "flaechendesinfektion", label: "Flächendesinfektion" },
  { value: "instrumentenaufbereitung", label: "Instrumentenaufbereitung" },
  { value: "andere", label: "Andere" },
]

const AREAS = [
  { value: "behandlungsraum", label: "Behandlungsraum" },
  { value: "wartezimmer", label: "Wartezimmer" },
  { value: "toiletten", label: "Toiletten" },
  { value: "labor", label: "Labor" },
  { value: "sterilisation", label: "Sterilisationsbereich" },
  { value: "empfang", label: "Empfang" },
  { value: "kueche", label: "Küche/Pausenraum" },
  { value: "allgemein", label: "Allgemein" },
]

const FREQUENCIES = [
  { value: "taeglich", label: "Täglich" },
  { value: "nach_patient", label: "Nach jedem Patienten" },
  { value: "woechentlich", label: "Wöchentlich" },
  { value: "monatlich", label: "Monatlich" },
  { value: "quartalsweise", label: "Quartalsweise" },
  { value: "jaehrlich", label: "Jährlich" },
  { value: "bei_bedarf", label: "Bei Bedarf" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Aktiv", color: "bg-green-500" },
  { value: "draft", label: "Entwurf", color: "bg-gray-500" },
  { value: "archived", label: "Archiviert", color: "bg-orange-500" },
]

export function HygienePage() {
  const { currentPractice } = useUser()
  const { toast } = useToast()
  const [plans, setPlans] = useState<HygienePlan[]>([])
  const [executions, setExecutions] = useState<HygienePlanExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<HygienePlan | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    plan_type: "",
    area: "",
    frequency: "",
    procedure: "",
    responsible_role: "",
    products_used: "",
    documentation_required: true,
    rki_reference: "",
  })

  // Execution form
  const [executionNotes, setExecutionNotes] = useState("")

  useEffect(() => {
    if (currentPractice?.id) {
      loadPlans()
      loadExecutions()
    }
  }, [currentPractice?.id])

  const loadPlans = async () => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/hygiene`)
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error("Error loading hygiene plans:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExecutions = async () => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/hygiene/executions`)
      if (res.ok) {
        const data = await res.json()
        setExecutions(data.executions || [])
      }
    } catch (error) {
      console.error("Error loading executions:", error)
    }
  }

  const handleCreatePlan = async () => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/hygiene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          products_used: formData.products_used.split(",").map((p) => p.trim()).filter(Boolean),
          status: "active",
        }),
      })

      if (res.ok) {
        toast({
          title: "Hygieneplan erstellt",
          description: "Der Hygieneplan wurde erfolgreich erstellt.",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadPlans()
      } else {
        throw new Error("Failed to create plan")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Hygieneplan konnte nicht erstellt werden.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateWithAI = async () => {
    if (!currentPractice?.id) return

    setIsGenerating(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/hygiene/generate-rki`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_type: formData.plan_type,
          area: formData.area,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          procedure: data.procedure || prev.procedure,
          products_used: data.products_used?.join(", ") || prev.products_used,
          rki_reference: data.rki_reference || prev.rki_reference,
        }))
        toast({
          title: "RKI-Richtlinien geladen",
          description: "Der Plan wurde mit RKI-Empfehlungen ausgefüllt.",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "AI-Generierung fehlgeschlagen.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExecutePlan = async () => {
    if (!currentPractice?.id || !selectedPlan) return

    try {
      const res = await fetch(
        `/api/practices/${currentPractice.id}/hygiene/${selectedPlan.id}/execute`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notes: executionNotes,
          }),
        },
      )

      if (res.ok) {
        toast({
          title: "Ausführung dokumentiert",
          description: "Die Durchführung wurde erfolgreich dokumentiert.",
        })
        setIsExecuteDialogOpen(false)
        setExecutionNotes("")
        setSelectedPlan(null)
        loadExecutions()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Dokumentation konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const handleAddToKnowledge = async (plan: HygienePlan) => {
    if (!currentPractice?.id) return

    try {
      const res = await fetch(
        `/api/practices/${currentPractice.id}/hygiene/${plan.id}/add-to-knowledge`,
        {
          method: "POST",
        },
      )

      if (res.ok) {
        toast({
          title: "Zur Wissensdatenbank hinzugefügt",
          description: "Der Hygieneplan wurde in die Wissensdatenbank übertragen.",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Übertragung fehlgeschlagen.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      plan_type: "",
      area: "",
      frequency: "",
      procedure: "",
      responsible_role: "",
      products_used: "",
      documentation_required: true,
      rki_reference: "",
    })
  }

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArea = filterArea === "all" || plan.area === filterArea
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus
    return matchesSearch && matchesArea && matchesStatus
  })

  const activePlans = plans.filter((p) => p.status === "active").length
  const todayExecutions = executions.filter(
    (e) => format(new Date(e.executed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
  ).length

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Lade Hygienepläne...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Hygienemanagement
          </h1>
          <p className="text-muted-foreground mt-1">
            Hygienepläne nach RKI-Richtlinien erstellen und verwalten
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Hygieneplan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neuen Hygieneplan erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Hygieneplan basierend auf RKI-Empfehlungen
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan_type">Plan-Typ</Label>
                  <Select
                    value={formData.plan_type}
                    onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="area">Bereich</Label>
                  <Select
                    value={formData.area}
                    onValueChange={(value) => setFormData({ ...formData, area: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Wählen Sie einen Bereich" />
                    </SelectTrigger>
                    <SelectContent>
                      {AREAS.map((area) => (
                        <SelectItem key={area.value} value={area.value}>
                          {area.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.plan_type && formData.area && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generiere RKI-Empfehlungen..." : "Mit AI und RKI-Richtlinien generieren"}
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Händedesinfektion vor Behandlung"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionale Beschreibung des Hygieneplans"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Häufigkeit</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie die Häufigkeit" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((freq) => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure">Durchführung</Label>
                <Textarea
                  id="procedure"
                  value={formData.procedure}
                  onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                  placeholder="Beschreiben Sie die Durchführung Schritt für Schritt"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible_role">Verantwortliche Rolle</Label>
                  <Input
                    id="responsible_role"
                    value={formData.responsible_role}
                    onChange={(e) => setFormData({ ...formData, responsible_role: e.target.value })}
                    placeholder="z.B. Behandler, MFA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="products_used">Verwendete Produkte</Label>
                  <Input
                    id="products_used"
                    value={formData.products_used}
                    onChange={(e) => setFormData({ ...formData, products_used: e.target.value })}
                    placeholder="Komma-getrennt"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rki_reference">RKI-Referenz</Label>
                <Input
                  id="rki_reference"
                  value={formData.rki_reference}
                  onChange={(e) => setFormData({ ...formData, rki_reference: e.target.value })}
                  placeholder="Link oder Referenznummer zur RKI-Empfehlung"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreatePlan} disabled={!formData.title || !formData.procedure}>
                Hygieneplan erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktive Pläne</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePlans}</div>
            <p className="text-xs text-muted-foreground">Hygienepläne in Verwendung</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Heute durchgeführt</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayExecutions}</div>
            <p className="text-xs text-muted-foreground">Hygienemaßnahmen dokumentiert</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gesamtpläne</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plans.length}</div>
            <p className="text-xs text-muted-foreground">Alle erstellten Pläne</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pläne durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterArea} onValueChange={setFilterArea}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Bereich" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Bereiche</SelectItem>
                {AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
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
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Hygienepläne</CardTitle>
          <CardDescription>Übersicht aller Hygienepläne mit RKI-Richtlinien</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Hygienepläne gefunden</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterArea !== "all" || filterStatus !== "all"
                  ? "Keine Pläne entsprechen Ihren Filterkriterien."
                  : "Erstellen Sie Ihren ersten Hygieneplan basierend auf RKI-Empfehlungen."}
              </p>
              {!searchQuery && filterArea === "all" && filterStatus === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Plan erstellen
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Bereich</TableHead>
                  <TableHead>Häufigkeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{plan.title}</div>
                        {plan.rki_reference && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <BookOpen className="h-3 w-3" />
                            RKI-Referenz
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {PLAN_TYPES.find((t) => t.value === plan.plan_type)?.label || plan.plan_type}
                    </TableCell>
                    <TableCell>
                      {AREAS.find((a) => a.value === plan.area)?.label || plan.area}
                    </TableCell>
                    <TableCell>
                      {FREQUENCIES.find((f) => f.value === plan.frequency)?.label || plan.frequency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={plan.status === "active" ? "default" : "secondary"}
                        className={
                          STATUS_OPTIONS.find((s) => s.value === plan.status)?.color
                        }
                      >
                        {STATUS_OPTIONS.find((s) => s.value === plan.status)?.label || plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPlan(plan)
                            setIsExecuteDialogOpen(true)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Durchführen
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddToKnowledge(plan)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Execute Dialog */}
      <Dialog open={isExecuteDialogOpen} onOpenChange={setIsExecuteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hygienemaßnahme dokumentieren</DialogTitle>
            <DialogDescription>
              Dokumentieren Sie die Durchführung: {selectedPlan?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Durchführung:</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedPlan.procedure}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="execution_notes">Anmerkungen (optional)</Label>
                <Textarea
                  id="execution_notes"
                  value={executionNotes}
                  onChange={(e) => setExecutionNotes(e.target.value)}
                  placeholder="Besondere Vorkommnisse oder Anmerkungen..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExecuteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleExecutePlan}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Dokumentieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
