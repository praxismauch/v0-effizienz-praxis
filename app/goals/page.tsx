"use client"
import { useState, useMemo } from "react"
import useSWR from "swr"
import { AppLayout } from "@/components/app-layout"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import GoalCard from "@/components/goal-card"
import { Plus, Target, TrendingUp, CheckCircle2, Circle, Sparkles, List, Grid } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import CreateGoalDialog from "@/components/create-goal-dialog"
import AIGoalGeneratorDialog from "@/components/ai-goal-generator-dialog"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"
import { toast } from "sonner"

interface Goal {
  id: string
  practiceId: string
  createdBy: string
  assignedTo?: string
  parentGoalId?: string
  title: string
  description?: string
  goalType: "practice" | "personal" | "team"
  targetValue?: number
  currentValue?: number
  unit?: string
  progressPercentage: number
  status: "not-started" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  startDate?: string
  endDate: string
  completedAt?: string
  isPrivate: boolean
  metadata: any
  createdAt: string
  updatedAt: string
  displayOrder?: number
}

export const dynamic = "force-dynamic"

export default function GoalsPage() {
  const { currentUser, isAdmin } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false)
  const [aiGeneratedGoalData, setAiGeneratedGoalData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [completionFilter, setCompletionFilter] = useState<"all" | "active" | "completed">("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  const practiceId = currentPractice?.id?.toString()

  const {
    data: goalsData,
    error,
    isLoading: loading,
    mutate,
  } = useSWR(practiceId ? SWR_KEYS.goals(practiceId) : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  // Process goals data
  const goals = useMemo(() => {
    if (!goalsData?.goals) return []
    const parentGoals = goalsData.goals.filter((g: Goal) => !g.parentGoalId)
    return parentGoals.sort((a: Goal, b: Goal) => {
      const orderA = a.displayOrder ?? 999999
      const orderB = b.displayOrder ?? 999999
      return orderA - orderB
    })
  }, [goalsData])

  // ... existing code for URL params handling ...
  useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (tabParam && ["all", "practice", "personal", "team", "draft"].includes(tabParam)) {
        setActiveTab(tabParam)
        window.history.replaceState({}, "", "/goals")
      }
    }
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleGoalCreated = () => {
    setCreateDialogOpen(false)
    mutate() // Revalidate goals after creation
  }

  const handleGoalUpdated = () => {
    mutate() // Revalidate goals after update
  }

  const handleGoalDeleted = () => {
    mutate() // Revalidate goals after deletion
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = visibleGoals.findIndex((goal) => goal.id === active.id)
    const newIndex = visibleGoals.findIndex((goal) => goal.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newGoals = arrayMove(visibleGoals, oldIndex, newIndex)

    // Optimistically update the cache
    mutate({ goals: newGoals }, { revalidate: false })

    // Update display order on server
    try {
      const updatedOrders = newGoals.map((goal, index) => ({
        id: goal.id,
        displayOrder: index,
      }))

      const response = await fetch(`/api/practices/${practiceId}/goals/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orders: updatedOrders }),
      })

      if (!response.ok) {
        // Revert on error by revalidating
        toast.error("Fehler beim Aktualisieren der Reihenfolge")
        mutate()
      }
    } catch (error) {
      console.error("Error updating goal order:", error)
      mutate() // Revalidate on error
    }
  }

  const handleAIGoalGenerated = (goalData: any) => {
    setAiGeneratedGoalData(goalData)
    setCreateDialogOpen(true)
  }

  const handleCreateDialogChange = (open: boolean) => {
    setCreateDialogOpen(open)
    if (!open) {
      setAiGeneratedGoalData(null)
    }
  }

  const handleGoalsGenerated = () => {
    mutate() // Revalidate after AI generation
  }

  const filteredGoals = useMemo(() => {
    let filtered = goals

    // Filter by tab
    if (activeTab === "draft") {
      filtered = filtered.filter((g: Goal) => g.status === "draft")
    } else if (activeTab !== "all") {
      filtered = filtered.filter((g: Goal) => g.goalType === activeTab && g.status !== "draft")
    } else {
      filtered = filtered.filter((g: Goal) => g.status !== "draft")
    }

    // Filter by completion status
    if (completionFilter === "active") {
      filtered = filtered.filter((g: Goal) => g.status === "active")
    } else if (completionFilter === "completed") {
      filtered = filtered.filter((g: Goal) => g.status === "completed")
    }

    return filtered
  }, [goals, activeTab, completionFilter])

  const goalCounts = useMemo(
    () => ({
      all: goals.filter((g: Goal) => g.status !== "draft").length,
      draft: goals.filter((g: Goal) => g.status === "draft").length,
      practice: goals.filter((g: Goal) => g.goalType === "practice" && g.status !== "draft").length,
      personal: goals.filter((g: Goal) => g.goalType === "personal" && g.status !== "draft").length,
      team: goals.filter((g: Goal) => g.goalType === "team" && g.status !== "draft").length,
    }),
    [goals],
  )

  const visibleGoals = filteredGoals.filter((goal: Goal) => {
    if (!isAdmin && goal.createdBy !== currentUser?.id && goal.assignedTo !== currentUser?.id && goal.isPrivate) {
      return false
    }
    return true
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Ziele</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Praxisziele und verfolgen Sie deren Fortschritt</p>
          </div>
          {currentPractice && (
            <div className="flex gap-2 shrink-0">
              <Button
                className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg transition-all border-0"
                onClick={() => setAiGeneratorOpen(true)}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                KI-Ziel generieren
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Neues Ziel
              </Button>
            </div>
          )}
        </div>

        {!currentPractice ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Praxis ausgewählt</h3>
              <p className="text-muted-foreground">Bitte wählen Sie eine Praxis aus, um Ziele anzuzeigen</p>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <StatCard label="Gesamtziele" value={goalCounts.all} icon={Target} {...statCardColors.primary} />
              <StatCard label="Entwürfe" value={goalCounts.draft} icon={Circle} {...statCardColors.info} />
              <StatCard label="Praxis" value={goalCounts.practice} icon={TrendingUp} {...statCardColors.orange} />
              <StatCard label="Privat" value={goalCounts.personal} icon={CheckCircle2} {...statCardColors.success} />
              <StatCard label="Team" value={goalCounts.team} icon={Sparkles} {...statCardColors.secondary} />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger
                    value="all"
                    className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    Alle Ziele
                    <Badge variant="secondary" className="ml-1">
                      {goalCounts.all}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="draft"
                    className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    Entwürfe
                    <Badge variant="secondary" className="ml-1">
                      {goalCounts.draft}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="practice"
                    className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    Praxis
                    <Badge variant="secondary" className="ml-1">
                      {goalCounts.practice}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="personal"
                    className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    Privat
                    <Badge variant="secondary" className="ml-1">
                      {goalCounts.personal}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className="gap-2 hover:ring-2 hover:ring-primary/20 hover:shadow-sm transition-all duration-200"
                  >
                    Team
                    <Badge variant="secondary" className="ml-1">
                      {goalCounts.team}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Ansicht:</span>
                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
                      <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                        <span className="font-medium text-xs sm:text-sm">Liste</span>
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setViewMode("grid")}
                      >
                        <Grid className="h-4 w-4" />
                        <span className="font-medium text-xs sm:text-sm">Gitter</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg">
                      <Button
                        variant={completionFilter === "all" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5 text-xs sm:text-sm"
                        onClick={() => setCompletionFilter("all")}
                      >
                        Alle
                      </Button>
                      <Button
                        variant={completionFilter === "active" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5 text-xs sm:text-sm"
                        onClick={() => setCompletionFilter("active")}
                      >
                        Aktive
                      </Button>
                      <Button
                        variant={completionFilter === "completed" ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5 text-xs sm:text-sm"
                        onClick={() => setCompletionFilter("completed")}
                      >
                        Abgeschlossen
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-muted-foreground">Lädt...</div>
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={visibleGoals.map((g: Goal) => g.id)} strategy={verticalListSortingStrategy}>
                      {viewMode === "list" ? (
                        <div className="space-y-4">
                          {visibleGoals.map((goal: Goal) => (
                            <GoalCard
                              key={goal.id}
                              goal={goal}
                              onUpdate={handleGoalUpdated}
                              onDelete={handleGoalDeleted}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {visibleGoals.map((goal: Goal) => (
                            <GoalCard
                              key={goal.id}
                              goal={goal}
                              onUpdate={handleGoalUpdated}
                              onDelete={handleGoalDeleted}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>
            </Tabs>

            <CreateGoalDialog
              open={createDialogOpen}
              onOpenChange={handleCreateDialogChange}
              onGoalCreated={handleGoalCreated}
              initialData={aiGeneratedGoalData}
            />

            <AIGoalGeneratorDialog
              open={aiGeneratorOpen}
              onOpenChange={setAiGeneratorOpen}
              onGoalGenerated={handleAIGoalGenerated}
            />
          </>
        )}
      </div>
    </AppLayout>
  )
}
