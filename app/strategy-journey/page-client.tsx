"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Compass, BookOpen, LayoutGrid, List, Filter } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { StrategyStepCard, type StrategyStep } from "./components/strategy-step-card"
import { StrategyStepDetailDialog } from "./components/strategy-step-detail-dialog"
import { StrategyProgressOverview } from "./components/strategy-progress-overview"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PageClientProps {
  practiceId?: string
}

interface StrategySummary {
  total: number
  completed: number
  inProgress: number
  notStarted: number
  overallProgress: number
}

export default function PageClient({ practiceId }: PageClientProps) {
  const [loading, setLoading] = useState(true)
  const [steps, setSteps] = useState<StrategyStep[]>([])
  const [summary, setSummary] = useState<StrategySummary>({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    overallProgress: 0,
  })
  const [selectedStep, setSelectedStep] = useState<StrategyStep | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "in_progress" | "completed">("all")
  const { currentUser, currentPractice } = useAuth()

  const fetchSteps = async () => {
    try {
      const id = practiceId || currentPractice?.id
      if (!id) {
        setLoading(false)
        return
      }

      console.log("[v0] Fetching strategy journey steps for practice:", id)
      const response = await fetch(`/api/strategy-journey?practiceId=${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Strategy journey data:", data)
        setSteps(data.steps || [])
        setSummary(data.summary || {})
      } else {
        console.error("[v0] Failed to fetch strategy journey:", response.statusText)
        toast.error("Fehler beim Laden der Strategie-Reise")
      }
    } catch (error) {
      console.error("[v0] Error fetching strategy journey:", error)
      toast.error("Fehler beim Laden der Strategie-Reise")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSteps()
  }, [practiceId, currentPractice?.id])

  const handleViewDetails = (step: StrategyStep) => {
    setSelectedStep(step)
    setDialogOpen(true)
  }

  const handleStartStep = async (stepKey: string) => {
    try {
      const id = practiceId || currentPractice?.id
      if (!id) return

      console.log("[v0] Starting step:", stepKey)
      const response = await fetch("/api/strategy-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: id,
          stepKey,
          status: "in_progress",
        }),
      })

      if (response.ok) {
        console.log("[v0] Step started successfully")
        toast.success("Schritt gestartet")
        await fetchSteps()
        setDialogOpen(false)
      } else {
        const error = await response.json()
        console.error("[v0] Failed to start step:", error)
        toast.error("Fehler beim Starten des Schritts")
      }
    } catch (error) {
      console.error("[v0] Error starting step:", error)
      toast.error("Fehler beim Starten des Schritts")
    }
  }

  const handleMarkComplete = async (stepKey: string) => {
    try {
      const id = practiceId || currentPractice?.id
      if (!id) return

      console.log("[v0] Marking step as complete:", stepKey)
      const response = await fetch("/api/strategy-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: id,
          stepKey,
          status: "completed",
        }),
      })

      if (response.ok) {
        console.log("[v0] Step marked as complete")
        toast.success("Schritt als erledigt markiert!")
        await fetchSteps()
        setDialogOpen(false)
      } else {
        const error = await response.json()
        console.error("[v0] Failed to mark complete:", error)
        toast.error("Fehler beim Markieren als erledigt")
      }
    } catch (error) {
      console.error("[v0] Error marking complete:", error)
      toast.error("Fehler beim Markieren als erledigt")
    }
  }

  const handleSaveNotes = async (notes: string) => {
    if (!selectedStep) return

    try {
      const id = practiceId || currentPractice?.id
      if (!id) return

      console.log("[v0] Saving notes for step:", selectedStep.key)
      const response = await fetch("/api/strategy-journey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: id,
          stepKey: selectedStep.key,
          notes,
          status: selectedStep.status || "in_progress",
        }),
      })

      if (response.ok) {
        toast.success("Notizen gespeichert")
        await fetchSteps()
      } else {
        toast.error("Fehler beim Speichern der Notizen")
      }
    } catch (error) {
      console.error("[v0] Error saving notes:", error)
      toast.error("Fehler beim Speichern der Notizen")
    }
  }

  const filteredSteps = steps.filter((step) => {
    if (filterStatus === "all") return true
    return step.status === filterStatus
  })

  const phasedSteps = {
    foundation: filteredSteps.slice(0, 4), // Vision, Target Patient, Services, Business Model
    operations: filteredSteps.slice(4, 9), // Processes, HR, Communication, Quality, Digitalization
    execution: filteredSteps.slice(9), // KPIs, Annual Goals, Innovation
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

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Compass className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Strategie-Reise</h1>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Entwickeln Sie systematisch eine zukunftsfähige Strategie für Ihre Praxis. Von der Vision bis zur
            Umsetzung – Schritt für Schritt zum Erfolg.
          </p>
        </div>

        {/* Progress Overview */}
        <StrategyProgressOverview summary={summary} />

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Schritte</SelectItem>
                <SelectItem value="not_started">Noch nicht begonnen</SelectItem>
                <SelectItem value="in_progress">In Arbeit</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Strategy Steps by Phase */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Alle Phasen</TabsTrigger>
            <TabsTrigger value="foundation">Fundament</TabsTrigger>
            <TabsTrigger value="operations">Organisation</TabsTrigger>
            <TabsTrigger value="execution">Umsetzung</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 mt-6">
            <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {filteredSteps.map((step) => (
                <StrategyStepCard
                  key={step.key}
                  step={step}
                  onViewDetails={() => handleViewDetails(step)}
                  onStartStep={() => handleStartStep(step.key)}
                  onMarkComplete={() => handleMarkComplete(step.key)}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="foundation" className="space-y-6 mt-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Phase 1: Fundament
                </CardTitle>
                <CardDescription>
                  Legen Sie die strategischen Grundlagen: Vision, Zielgruppe, Leistungen und Wirtschaftlichkeit
                </CardDescription>
              </CardHeader>
            </Card>
            <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {phasedSteps.foundation.map((step) => (
                <StrategyStepCard
                  key={step.key}
                  step={step}
                  onViewDetails={() => handleViewDetails(step)}
                  onStartStep={() => handleStartStep(step.key)}
                  onMarkComplete={() => handleMarkComplete(step.key)}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="operations" className="space-y-6 mt-6">
            <Card className="bg-emerald-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                  Phase 2: Organisation
                </CardTitle>
                <CardDescription>
                  Optimieren Sie Prozesse, Personal, Kommunikation, Qualität und Digitalisierung
                </CardDescription>
              </CardHeader>
            </Card>
            <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {phasedSteps.operations.map((step) => (
                <StrategyStepCard
                  key={step.key}
                  step={step}
                  onViewDetails={() => handleViewDetails(step)}
                  onStartStep={() => handleStartStep(step.key)}
                  onMarkComplete={() => handleMarkComplete(step.key)}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="execution" className="space-y-6 mt-6">
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Phase 3: Umsetzung
                </CardTitle>
                <CardDescription>
                  Steuern Sie mit Kennzahlen, setzen Sie Jahresziele und bleiben Sie innovativ
                </CardDescription>
              </CardHeader>
            </Card>
            <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
              {phasedSteps.execution.map((step) => (
                <StrategyStepCard
                  key={step.key}
                  step={step}
                  onViewDetails={() => handleViewDetails(step)}
                  onStartStep={() => handleStartStep(step.key)}
                  onMarkComplete={() => handleMarkComplete(step.key)}
                  compact={viewMode === "list"}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <StrategyStepDetailDialog
          step={selectedStep}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onStartStep={() => selectedStep && handleStartStep(selectedStep.key)}
          onMarkComplete={() => selectedStep && handleMarkComplete(selectedStep.key)}
          onSaveNotes={handleSaveNotes}
        />
      </div>
    </AppLayout>
  )
}
