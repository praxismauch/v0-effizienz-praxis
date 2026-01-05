"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react"
import { usePractice } from "./practice-context"
import { useUser } from "./user-context"
import { fetchWithRetry, safeJsonParse } from "@/lib/fetch-with-retry"
import { toast } from "sonner"

export interface WorkflowStep {
  id: string
  title: string
  description?: string
  assignedTo?: string // Legacy: name-based assignment
  assignedUserId?: string // New: user ID-based assignment
  estimatedDuration?: number // in minutes
  dependencies: string[] // step IDs that must be completed first
  status: "pending" | "in-progress" | "completed" | "blocked"
  completedAt?: string
  completedBy?: string
  notes?: string
  dueDate?: string
  parentStepId?: string // For sub-items
  isSubitem?: boolean
  subitems?: WorkflowStep[] // Nested sub-items
}

export interface Workflow {
  id: string
  title: string
  description?: string
  category: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "draft" | "active" | "paused" | "completed" | "archived"
  createdBy: string
  createdAt: string
  updatedAt: string
  practiceId: string
  teamIds: string[]
  steps: WorkflowStep[]
  isTemplate: boolean
  templateId?: string
  estimatedTotalDuration?: number
  actualDuration?: number
  startedAt?: string
  completedAt?: string
  hideItemsFromOtherUsers?: boolean // Added visibility control
}

export interface WorkflowTemplate {
  id: string
  title: string
  description?: string
  category: string
  steps: Omit<WorkflowStep, "id" | "status" | "completedAt" | "completedBy" | "notes">[]
  estimatedDuration: number
  createdBy: string
  createdAt: string
  isPublic: boolean
  practiceId?: string
  hideItemsFromOtherUsers?: boolean // Visibility control option
}

export interface OrgaCategory {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  is_active: boolean
  display_order: number
  practice_id: string | null
  created_at: string
  updated_at: string
}

interface WorkflowContextType {
  workflows: Workflow[]
  templates: WorkflowTemplate[]
  categories: OrgaCategory[]
  isLoading: boolean
  error: string | null
  createWorkflow: (
    workflow: Omit<Workflow, "id" | "practiceId" | "createdAt" | "updatedAt">,
  ) => Promise<Workflow | void>
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<void>
  deleteWorkflow: (id: string) => Promise<void>
  updateWorkflowStep: (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => Promise<void>
  createTemplate: (template: Omit<WorkflowTemplate, "id" | "createdAt">) => void
  updateTemplate: (id: string, updates: Omit<WorkflowTemplate, "id" | "createdAt">) => void
  deleteTemplate: (id: string) => void
  createWorkflowFromTemplate: (templateId: string, customizations?: Partial<Workflow>) => Promise<Workflow | void>
  getWorkflowsByTeam: (teamId: string) => Workflow[]
  getWorkflowsByAssignee: (assignee: string) => Workflow[]
  getVisibleStepsForUser: (workflow: Workflow, userId: string) => WorkflowStep[] // New method
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [categories, setCategories] = useState<OrgaCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const practiceIdRef = useRef<string>()

  const fetchCategories = useCallback(
    async (practiceId: string) => {
      if (!practiceId || practiceId === "" || practiceId === null || practiceId === undefined) {
        toast.error("Keine Praxis-ID gefunden. Bitte Seite neu laden.")
        return
      }

      try {
        const url = `/api/practices/${practiceId}/orga-categories`
        const response = await fetchWithRetry(url)
        if (response.ok) {
          const data = await safeJsonParse(response, { categories: [] })
          setCategories(data.categories || [])
        } else {
          toast.error("Fehler beim Laden der Kategorien")
        }
      } catch (error) {
        console.error("Categories fetch error", error)
        toast.error("Fehler beim Laden der Kategorien")
        setCategories([])
      }
    },
    [currentPractice],
  )

  useEffect(() => {
    if (userLoading || practiceLoading) {
      setIsLoading(true)
      return
    }

    const practiceId = currentPractice?.id

    if (!practiceId || practiceId === "" || practiceId === null || practiceId === undefined) {
      setIsLoading(false)
      setError(null)
      return
    }

    if (practiceIdRef.current === practiceId) {
      return
    }

    practiceIdRef.current = practiceId

    let isMounted = true

    setIsLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const categoriesRes = await fetchWithRetry(`/api/practices/${practiceId}/orga-categories`).catch((err) => {
          console.error("Categories fetch failed:", err)
          return null
        })

        if (!isMounted) return

        await new Promise((resolve) => setTimeout(resolve, 100))

        const workflowsRes = await fetchWithRetry(`/api/practices/${practiceId}/workflows`).catch((err) => {
          console.error("Workflows fetch failed:", err)
          return null
        })

        if (!isMounted) return

        await new Promise((resolve) => setTimeout(resolve, 100))

        const templatesRes = await fetchWithRetry("/api/workflow-templates").catch((err) => {
          console.error("Templates fetch failed:", err)
          return null
        })

        if (!isMounted) return

        if (categoriesRes && categoriesRes.ok) {
          try {
            const data = await safeJsonParse(categoriesRes, { categories: [] })
            const categoriesArray = Array.isArray(data.categories) ? data.categories : Array.isArray(data) ? data : []
            const sortedCategories = categoriesArray.sort(
              (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0),
            )
            if (isMounted) setCategories(sortedCategories)
          } catch (jsonError) {
            console.error("Failed to parse categories JSON:", jsonError)
            if (isMounted) setCategories([])
          }
        } else {
          if (isMounted) setCategories([])
        }

        if (!isMounted) return

        if (workflowsRes?.ok) {
          const data = await safeJsonParse(workflowsRes, { workflows: [] })
          if (isMounted) setWorkflows(data.workflows || [])
        } else {
          if (isMounted) setWorkflows([])
        }

        if (!isMounted) return

        if (templatesRes?.ok) {
          const data = await safeJsonParse(templatesRes, { templates: [] })
          const mappedTemplates = (data.templates || []).map((t: any) => ({
            id: t.id,
            title: t.name || t.title,
            description: t.description,
            category: t.category,
            steps: t.steps || [],
            estimatedDuration: t.estimated_duration || 0,
            createdBy: t.created_by || "System",
            createdAt: t.created_at,
            isPublic: t.is_public || false,
            practiceId: t.practice_id,
            hideItemsFromOtherUsers: t.hide_items_from_other_users || false,
          }))
          if (isMounted) setTemplates(mappedTemplates)
        } else {
          if (isMounted) setTemplates([])
        }

        if (isMounted) {
          setIsLoading(false)
          setError(null)
        }
      } catch (error) {
        if (!isMounted) return
        console.error("Error in fetchData", error)
        toast.error("Fehler beim Laden der Workflow-Daten")
        setError(error instanceof Error ? error.message : "Fehler beim Laden der Workflow-Daten")
        setCategories([])
        setWorkflows([])
        setTemplates([])
        setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, [currentPractice, userLoading, practiceLoading])

  const createWorkflow = useCallback(
    async (workflowData: Omit<Workflow, "id" | "practiceId" | "createdAt" | "updatedAt">) => {
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        console.error("Cannot create workflow - no practice selected")
        throw new Error("Keine Praxis ausgewählt. Bitte wählen Sie eine Praxis aus.")
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/workflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(workflowData),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("WorkflowContext: Create failed", {
            status: response.status,
            errorText,
          })

          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            toast.error(`Fehler beim Erstellen des Workflows: ${errorText}`)
            throw new Error(`Failed to create workflow: ${errorText}`)
          }

          toast.error(errorData.error || "Fehler beim Erstellen des Workflows")
          throw new Error(errorData.error || "Failed to create workflow")
        }

        const newWorkflow = await response.json()
        setWorkflows((prev) => [newWorkflow, ...prev])
        toast.success("Workflow erfolgreich erstellt")

        return newWorkflow
      } catch (error) {
        console.error("WorkflowContext: Exception in createWorkflow:", error)
        throw error
      }
    },
    [currentPractice],
  )

  const updateWorkflow = useCallback(
    async (id: string, updates: Partial<Workflow>) => {
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        console.error("Cannot update workflow - no practice selected")
        throw new Error("Keine Praxis ausgewählt")
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/workflows/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const error = await response.json()
          console.error("Workflow update failed:", response.status, error)
          toast.error(error.error || "Fehler beim Aktualisieren des Workflows")
          throw new Error(error.error || "Failed to update workflow")
        }

        const updatedWorkflow = await response.json()

        setWorkflows((prev) =>
          prev.map((workflow) =>
            workflow.id === id ? { ...workflow, ...updates, updatedAt: new Date().toISOString() } : workflow,
          ),
        )
        toast.success("Workflow erfolgreich aktualisiert")
      } catch (error) {
        console.error("Failed to update workflow:", error)
        throw error
      }
    },
    [currentPractice],
  )

  const deleteWorkflow = useCallback(
    async (id: string) => {
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        console.error("Cannot delete workflow - no practice selected")
        throw new Error("Keine Praxis ausgewählt")
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/workflows/${id}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.error || "Fehler beim Löschen des Workflows")
          throw new Error(error.error || "Failed to delete workflow")
        }

        setWorkflows((prev) => prev.filter((workflow) => workflow.id !== id))
        toast.success("Workflow erfolgreich gelöscht")
      } catch (error) {
        console.error("Failed to delete workflow:", error)
        throw error
      }
    },
    [currentPractice],
  )

  const updateWorkflowStep = useCallback(
    async (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => {
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        console.error("Cannot update workflow step - no practice selected")
        throw new Error("Keine Praxis ausgewählt")
      }

      setWorkflows((prev) =>
        prev.map((workflow) => {
          if (workflow.id !== workflowId) return workflow

          const updatedSteps = workflow.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step))
          const allCompleted = updatedSteps.every((step) => step.status === "completed")
          const anyInProgress = updatedSteps.some((step) => step.status === "in-progress")

          let workflowStatus = workflow.status
          if (allCompleted && workflow.status === "active") {
            workflowStatus = "completed"
          } else if (anyInProgress && workflow.status === "draft") {
            workflowStatus = "active"
          }

          return {
            ...workflow,
            steps: updatedSteps,
            status: workflowStatus,
            updatedAt: new Date().toISOString(),
            completedAt: allCompleted ? new Date().toISOString() : workflow.completedAt,
          }
        }),
      )
      toast.success("Workflow-Schritt aktualisiert")
    },
    [currentPractice],
  )

  const createWorkflowFromTemplate = useCallback(
    async (templateId: string, customizations?: Partial<Workflow>): Promise<Workflow | void> => {
      const template = templates.find((t) => t.id === templateId)
      if (!template) {
        toast.error("Vorlage nicht gefunden")
        console.error("Template not found", templateId)
        throw new Error("Vorlage nicht gefunden")
      }
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        console.error("Cannot create workflow from template - no practice selected")
        throw new Error("Keine Praxis ausgewählt")
      }

      const flattenSteps = (
        steps: WorkflowTemplate["steps"],
        parentId?: string,
      ): Omit<WorkflowStep, "status" | "completedAt" | "completedBy" | "notes">[] => {
        const result: Omit<WorkflowStep, "status" | "completedAt" | "completedBy" | "notes">[] = []
        steps.forEach((step, index) => {
          const stepId = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
          result.push({
            ...step,
            id: stepId,
            parentStepId: parentId,
            isSubitem: !!parentId,
          })
          if (step.subitems && step.subitems.length > 0) {
            result.push(...flattenSteps(step.subitems as any, stepId))
          }
        })
        return result
      }

      const workflowData: Omit<Workflow, "id" | "practiceId" | "createdAt" | "updatedAt"> = {
        title: customizations?.title || template.title,
        description: customizations?.description || template.description,
        category: template.category,
        priority: customizations?.priority || "medium",
        status: "draft", // Start as draft until activated
        createdBy: customizations?.createdBy || currentUser?.name || "Current User",
        teamIds: customizations?.teamIds || [],
        isTemplate: false,
        templateId: template.id,
        estimatedTotalDuration: template.estimatedDuration,
        hideItemsFromOtherUsers: template.hideItemsFromOtherUsers, // Inherit from template
        steps: flattenSteps(template.steps).map((step) => ({
          ...step,
          id: step.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          status: "pending" as const,
          dependencies: step.dependencies || [],
        })),
        ...customizations,
      }

      return createWorkflow(workflowData)
    },
    [templates, currentPractice, createWorkflow, currentUser],
  )

  const getWorkflowsByTeam = useCallback(
    (teamId: string) => {
      return workflows.filter((workflow) => workflow.teamIds.includes(teamId))
    },
    [workflows],
  )

  const getWorkflowsByAssignee = useCallback(
    (assignee: string) => {
      return workflows.filter((workflow) => workflow.steps.some((step) => step.assignedTo === assignee))
    },
    [workflows],
  )

  const getVisibleStepsForUser = useCallback(
    (workflow: Workflow, userId: string): WorkflowStep[] => {
      if (!workflow.hideItemsFromOtherUsers) {
        return workflow.steps
      }

      if (workflow.createdBy === userId || workflow.createdBy === currentUser?.name) {
        return workflow.steps
      }

      return workflow.steps.filter((step) => {
        if (step.assignedUserId === userId) return true
        if (step.assignedTo === currentUser?.name) return true
        if (step.subitems?.some((sub) => sub.assignedUserId === userId || sub.assignedTo === currentUser?.name)) {
          return true
        }
        return false
      })
    },
    [currentUser],
  )

  const createTemplateLocal = useCallback((templateData: Omit<WorkflowTemplate, "id" | "createdAt">) => {
    const newTemplate: WorkflowTemplate = {
      ...templateData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setTemplates((prev) => [...prev, newTemplate])
  }, [])

  const updateTemplateLocal = useCallback((id: string, updates: Omit<WorkflowTemplate, "id" | "createdAt">) => {
    setTemplates((prev) => prev.map((template) => (template.id === id ? { ...template, ...updates } : template)))
  }, [])

  const deleteTemplateLocal = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
  }, [])

  const contextValue = useMemo(
    () => ({
      workflows,
      templates,
      categories,
      isLoading,
      error,
      createWorkflow,
      updateWorkflow,
      deleteWorkflow,
      updateWorkflowStep,
      createTemplate: createTemplateLocal,
      updateTemplate: updateTemplateLocal,
      deleteTemplate: deleteTemplateLocal,
      createWorkflowFromTemplate,
      getWorkflowsByTeam,
      getWorkflowsByAssignee,
      getVisibleStepsForUser,
    }),
    [
      workflows,
      templates,
      categories,
      isLoading,
      error,
      createWorkflow,
      updateWorkflow,
      deleteWorkflow,
      updateWorkflowStep,
      createTemplateLocal,
      updateTemplateLocal,
      deleteTemplateLocal,
      createWorkflowFromTemplate,
      getWorkflowsByTeam,
      getWorkflowsByAssignee,
      getVisibleStepsForUser,
    ],
  )

  return <WorkflowContext.Provider value={contextValue}>{children}</WorkflowContext.Provider>
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider")
  }
  return context
}

export default WorkflowProvider
