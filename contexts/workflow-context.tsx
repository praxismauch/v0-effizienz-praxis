"use client"

import { createContext, useContext, useMemo, useCallback, type ReactNode } from "react"
import useSWR from "swr"
import { usePractice } from "./practice-context"
import { useUser } from "./user-context"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"
import { toast } from "sonner"
import type { WorkflowStep, Workflow, WorkflowTemplate, OrgaCategory } from "@/lib/workflow-types"

// Re-export types for consumers
export type { WorkflowStep, Workflow, WorkflowTemplate, OrgaCategory }

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
  getVisibleStepsForUser: (workflow: Workflow, userId: string) => WorkflowStep[]
  refreshWorkflows: () => Promise<void>
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()

  const practiceId = currentPractice?.id || DEFAULT_PRACTICE_ID

  const {
    data: workflowsData,
    isLoading: workflowsLoading,
    error: workflowsError,
    mutate: mutateWorkflows,
  } = useSWR<{ workflows: Workflow[] }>(
    !userLoading && !practiceLoading ? SWR_KEYS.workflows(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  )

  const {
    data: templatesData,
    isLoading: templatesLoading,
    mutate: mutateTemplates,
  } = useSWR<{ templates: any[] }>(!userLoading && !practiceLoading ? SWR_KEYS.workflowTemplates() : null, swrFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useSWR<{ categories: OrgaCategory[] }>(
    !userLoading && !practiceLoading ? SWR_KEYS.orgaCategories(practiceId) : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  )

  const workflows = workflowsData?.workflows || []
  const categories = useMemo(() => {
    const cats = categoriesData?.categories || []
    return [...cats].sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  }, [categoriesData])

  const templates = useMemo(() => {
    return (templatesData?.templates || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      steps: t.steps || [],
      estimatedDuration: 0,
      createdBy: t.created_by || "System",
      createdAt: t.created_at,
      isPublic: false,
      practiceId: t.practice_id?.toString(),
      hideItemsFromOtherUsers: false,
    }))
  }, [templatesData])

  const refreshWorkflows = useCallback(async () => {
    await Promise.all([mutateWorkflows(), mutateTemplates(), mutateCategories()])
  }, [mutateWorkflows, mutateTemplates, mutateCategories])

  const createWorkflow = useCallback(
    async (workflowData: Omit<Workflow, "id" | "practiceId" | "createdAt" | "updatedAt">) => {
      try {
        const newWorkflow = await mutationFetcher<Workflow>(SWR_KEYS.workflows(practiceId), {
          method: "POST",
          body: workflowData,
        })

        await mutateWorkflows(
          (current) => ({
            workflows: [newWorkflow, ...(current?.workflows || [])],
          }),
          { revalidate: false },
        )

        toast.success("Workflow erfolgreich erstellt")
        return newWorkflow
      } catch (error) {
        console.error("WorkflowContext: Exception in createWorkflow:", error)
        toast.error("Fehler beim Erstellen des Workflows")
        throw error
      }
    },
    [practiceId, mutateWorkflows],
  )

  const updateWorkflow = useCallback(
    async (id: string, updates: Partial<Workflow>) => {
      await mutateWorkflows(
        (current) => ({
          workflows: (current?.workflows || []).map((workflow) =>
            workflow.id === id ? { ...workflow, ...updates, updatedAt: new Date().toISOString() } : workflow,
          ),
        }),
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.workflows(practiceId)}/${id}`, {
          method: "PATCH",
          body: updates,
        })
        toast.success("Workflow erfolgreich aktualisiert")
      } catch (error) {
        await mutateWorkflows()
        console.error("Failed to update workflow:", error)
        toast.error("Fehler beim Aktualisieren des Workflows")
        throw error
      }
    },
    [practiceId, mutateWorkflows],
  )

  const deleteWorkflow = useCallback(
    async (id: string) => {
      await mutateWorkflows(
        (current) => ({
          workflows: (current?.workflows || []).filter((workflow) => workflow.id !== id),
        }),
        { revalidate: false },
      )

      try {
        await mutationFetcher(`${SWR_KEYS.workflows(practiceId)}/${id}`, {
          method: "DELETE",
        })
        toast.success("Workflow erfolgreich gelöscht")
      } catch (error) {
        await mutateWorkflows()
        console.error("Failed to delete workflow:", error)
        toast.error("Fehler beim Löschen des Workflows")
        throw error
      }
    },
    [practiceId, mutateWorkflows],
  )

  const updateWorkflowStep = useCallback(
    async (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => {
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
        throw new Error("Keine Praxis ausgewählt")
      }

      await mutateWorkflows(
        (current) => ({
          workflows: (current?.workflows || []).map((workflow) => {
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
        }),
        { revalidate: false },
      )

      toast.success("Workflow-Schritt aktualisiert")
    },
    [currentPractice, mutateWorkflows],
  )

  const createWorkflowFromTemplate = useCallback(
    async (templateId: string, customizations?: Partial<Workflow>): Promise<Workflow | void> => {
      const template = templates.find((t) => t.id === templateId)
      if (!template) {
        toast.error("Vorlage nicht gefunden")
        throw new Error("Vorlage nicht gefunden")
      }
      if (!currentPractice) {
        toast.error("Keine Praxis ausgewählt. Bitte Seite neu laden.")
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
        status: "draft",
        createdBy: customizations?.createdBy || currentUser?.name || "Current User",
        teamIds: customizations?.teamIds || [],
        isTemplate: false,
        templateId: template.id,
        estimatedTotalDuration: template.estimatedDuration,
        hideItemsFromOtherUsers: template.hideItemsFromOtherUsers,
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

  const createTemplateLocal = useCallback(
    (templateData: Omit<WorkflowTemplate, "id" | "createdAt">) => {
      const newTemplate: WorkflowTemplate = {
        ...templateData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      }
      mutateTemplates(
        (current) => ({
          templates: [...(current?.templates || []), newTemplate],
        }),
        { revalidate: false },
      )
    },
    [mutateTemplates],
  )

  const updateTemplateLocal = useCallback(
    (id: string, updates: Omit<WorkflowTemplate, "id" | "createdAt">) => {
      mutateTemplates(
        (current) => ({
          templates: (current?.templates || []).map((template: any) =>
            template.id === id ? { ...template, ...updates } : template,
          ),
        }),
        { revalidate: false },
      )
    },
    [mutateTemplates],
  )

  const deleteTemplateLocal = useCallback(
    (id: string) => {
      mutateTemplates(
        (current) => ({
          templates: (current?.templates || []).filter((template: any) => template.id !== id),
        }),
        { revalidate: false },
      )
    },
    [mutateTemplates],
  )

  const contextValue = useMemo(
    () => ({
      workflows,
      templates,
      categories,
      isLoading: userLoading || practiceLoading || workflowsLoading || templatesLoading || categoriesLoading,
      error: workflowsError?.message || null,
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
      refreshWorkflows,
    }),
    [
      workflows,
      templates,
      categories,
      userLoading,
      practiceLoading,
      workflowsLoading,
      templatesLoading,
      categoriesLoading,
      workflowsError,
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
      refreshWorkflows,
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
