"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Shield, Plus, FileText, CheckCircle2, Clock, Search, Filter } from "lucide-react"
import { format } from "date-fns"
import {
  type HygienePlan,
  type HygienePlanExecution,
  type HygieneFormData,
  EMPTY_FORM_DATA,
  AREAS,
  STATUS_OPTIONS,
} from "./hygiene-constants"
import { CreateHygienePlanDialog } from "./create-hygiene-plan-dialog"
import { ExecuteHygieneDialog } from "./execute-hygiene-dialog"
import { HygienePlansTable } from "./hygiene-plans-table"
import { HygienePlanDetailDialog } from "./hygiene-plan-detail-dialog"

export function HygienePage() {
  const { currentPractice } = useUser()
  const { toast } = useToast()
  const practiceId = currentPractice?.id || "1"

  const [plans, setPlans] = useState<HygienePlan[]>([])
  const [executions, setExecutions] = useState<HygienePlanExecution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isExecuteDialogOpen, setIsExecuteDialogOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<HygienePlan | null>(null)
  const [detailPlan, setDetailPlan] = useState<HygienePlan | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterArea, setFilterArea] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [formData, setFormData] = useState<HygieneFormData>(EMPTY_FORM_DATA)
  const [executionNotes, setExecutionNotes] = useState("")

  useEffect(() => {
    setIsLoading(true)
    Promise.all([loadPlans(), loadExecutions()]).finally(() => setIsLoading(false))
  }, [practiceId])

  const loadPlans = async () => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/hygiene`)
      if (res.ok) { const data = await res.json(); setPlans(data.plans || []) }
    } catch (error) { console.error("Error loading hygiene plans:", error) }
  }

  const loadExecutions = async () => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/hygiene/executions`)
      if (res.ok) { const data = await res.json(); setExecutions(data.executions || []) }
    } catch (error) { console.error("Error loading executions:", error) }
  }

  const handleCreatePlan = async () => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/hygiene`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          products_used: formData.products_used.split(",").map((p) => p.trim()).filter(Boolean),
          status: "active",
        }),
      })
      if (res.ok) {
        toast({ title: "Hygieneplan erstellt", description: "Der Hygieneplan wurde erfolgreich erstellt." })
        setIsCreateDialogOpen(false)
        setFormData(EMPTY_FORM_DATA)
        loadPlans()
      } else { throw new Error("Failed to create plan") }
    } catch {
      toast({ title: "Fehler", description: "Hygieneplan konnte nicht erstellt werden.", variant: "destructive" })
    }
  }

  const handleGenerateWithAI = async () => {
    setIsGenerating(true)
    try {
      console.log("[v0] Starting AI hygiene plan generation for:", formData.plan_type, formData.area)
      const res = await fetch(`/api/practices/${practiceId}/hygiene/generate-rki`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_type: formData.plan_type, area: formData.area }),
      })
      console.log("[v0] AI generation response status:", res.status)
      if (res.ok) {
        const data = await res.json()
        console.log("[v0] AI generation response data keys:", Object.keys(data))
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          procedure: data.procedure || prev.procedure,
          products_used: Array.isArray(data.products_used) ? data.products_used.join(", ") : (data.products_used || prev.products_used),
          rki_reference: data.rki_reference || prev.rki_reference,
        }))
        toast({ title: "RKI-Richtlinien geladen", description: "Der Plan wurde mit RKI-Empfehlungen ausgefuellt." })
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unbekannter Fehler" }))
        console.error("[v0] AI generation error:", errorData)
        toast({ title: "Fehler", description: errorData.details || errorData.error || "AI-Generierung fehlgeschlagen.", variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] AI generation exception:", error)
      toast({ title: "Fehler", description: "AI-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.", variant: "destructive" })
    } finally { setIsGenerating(false) }
  }

  const handleExecutePlan = async () => {
    if (!selectedPlan) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/hygiene/${selectedPlan.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: executionNotes }),
      })
      if (res.ok) {
        toast({ title: "Ausführung dokumentiert", description: "Die Durchführung wurde erfolgreich dokumentiert." })
        setIsExecuteDialogOpen(false)
        setExecutionNotes("")
        setSelectedPlan(null)
        loadExecutions()
      }
    } catch {
      toast({ title: "Fehler", description: "Dokumentation konnte nicht gespeichert werden.", variant: "destructive" })
    }
  }

  const handleAddToKnowledge = async (plan: HygienePlan) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/hygiene/${plan.id}/add-to-knowledge`, { method: "POST" })
      if (res.ok) {
        toast({ title: "Zur Wissensdatenbank hinzugefügt", description: "Der Hygieneplan wurde in die Wissensdatenbank übertragen." })
      }
    } catch {
      toast({ title: "Fehler", description: "Übertragung fehlgeschlagen.", variant: "destructive" })
    }
  }

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) || plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesArea = filterArea === "all" || plan.area === filterArea
    const matchesStatus = filterStatus === "all" || plan.status === filterStatus
    return matchesSearch && matchesArea && matchesStatus
  })

  const activePlans = plans.filter((p) => p.status === "active").length
  const todayExecutions = executions.filter((e) => format(new Date(e.executed_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length
  const hasFilters = !!searchQuery || filterArea !== "all" || filterStatus !== "all"

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Lade Hygienepläne...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Hygienemanagement
            </h1>
            <p className="text-muted-foreground mt-1">Hygienepläne nach RKI-Richtlinien erstellen und verwalten</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Hygieneplan
          </Button>
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
                <Input placeholder="Pläne durchsuchen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterArea} onValueChange={setFilterArea}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Bereich" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Bereiche</SelectItem>
                  {AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>
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
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Plans Table */}
        <HygienePlansTable
          plans={filteredPlans}
          hasFilters={hasFilters}
          onCreateNew={() => setIsCreateDialogOpen(true)}
          onExecute={(plan) => { setSelectedPlan(plan); setIsExecuteDialogOpen(true) }}
          onAddToKnowledge={handleAddToKnowledge}
          onViewDetail={(plan) => setDetailPlan(plan)}
        />
      </div>

      {/* Dialogs */}
      <CreateHygienePlanDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        formData={formData}
        onFormChange={setFormData}
        onSubmit={handleCreatePlan}
        onGenerateAI={handleGenerateWithAI}
        isGenerating={isGenerating}
      />

      <ExecuteHygieneDialog
        open={isExecuteDialogOpen}
        onOpenChange={setIsExecuteDialogOpen}
        plan={selectedPlan}
        notes={executionNotes}
        onNotesChange={setExecutionNotes}
        onSubmit={handleExecutePlan}
      />

      <HygienePlanDetailDialog
        plan={detailPlan}
        open={!!detailPlan}
        onOpenChange={(open) => !open && setDetailPlan(null)}
        onExecute={(plan) => {
          setSelectedPlan(plan)
          setIsExecuteDialogOpen(true)
        }}
        onAddToKnowledge={handleAddToKnowledge}
      />
    </AppLayout>
  )
}
