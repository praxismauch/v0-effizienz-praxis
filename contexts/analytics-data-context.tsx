"use client"

import type React from "react"
import { createContext, useContext } from "react"
import useSWR, { useSWRConfig } from "swr"
import { usePractice } from "./practice-context"
import { SWR_KEYS } from "@/lib/swr-keys"
import { swrFetcher } from "@/lib/swr-fetcher"

// Data type interfaces
export interface PracticeGrowthData {
  id: string
  month: string
  tasks: number
  revenue: number
  createdAt: Date
  updatedAt: Date
}

export interface TaskCategoryData {
  id: string
  name: string
  value: number
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamSatisfactionData {
  id: string
  week: string
  satisfaction: number
  responses: number
  createdAt: Date
  updatedAt: Date
}

export interface KPIData {
  id: string
  title: string
  value: string
  target: string
  progress: number
  trend: "up" | "down"
  change: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

export interface EfficiencyData {
  id: string
  week: string
  tasksPerDay: number
  avgProcessTime: number
  teamThroughput: number
  createdAt: Date
  updatedAt: Date
}

export interface QualityMetricsData {
  id: string
  month: string
  satisfaction: number
  completionRate: number
  efficiency: number
  createdAt: Date
  updatedAt: Date
}

interface AnalyticsDataContextType {
  // Practice Growth Data
  practiceGrowthData: PracticeGrowthData[]
  addPracticeGrowthData: (data: Omit<PracticeGrowthData, "id" | "createdAt" | "updatedAt">) => void
  updatePracticeGrowthData: (id: string, data: Partial<PracticeGrowthData>) => void
  deletePracticeGrowthData: (id: string) => void

  // Task Category Data
  taskCategoryData: TaskCategoryData[]
  addTaskCategoryData: (data: Omit<TaskCategoryData, "id" | "createdAt" | "updatedAt">) => void
  updateTaskCategoryData: (id: string, data: Partial<TaskCategoryData>) => void
  deleteTaskCategoryData: (id: string) => void

  // Team Satisfaction Data
  teamSatisfactionData: TeamSatisfactionData[]
  addTeamSatisfactionData: (data: Omit<TeamSatisfactionData, "id" | "createdAt" | "updatedAt">) => void
  updateTeamSatisfactionData: (id: string, data: Partial<TeamSatisfactionData>) => void
  deleteTeamSatisfactionData: (id: string) => void

  // KPI Data
  kpiData: KPIData[]
  addKPIData: (data: Omit<KPIData, "id" | "createdAt" | "updatedAt">) => void
  updateKPIData: (id: string, data: Partial<KPIData>) => void
  deleteKPIData: (id: string) => void

  // Efficiency Data
  efficiencyData: EfficiencyData[]
  addEfficiencyData: (data: Omit<EfficiencyData, "id" | "createdAt" | "updatedAt">) => void
  updateEfficiencyData: (id: string, data: Partial<EfficiencyData>) => void
  deleteEfficiencyData: (id: string) => void

  // Quality Metrics Data
  qualityMetricsData: QualityMetricsData[]
  addQualityMetricsData: (data: Omit<QualityMetricsData, "id" | "createdAt" | "updatedAt">) => void
  updateQualityMetricsData: (id: string, data: Partial<QualityMetricsData>) => void
  deleteQualityMetricsData: (id: string) => void
}

const AnalyticsDataContext = createContext<AnalyticsDataContextType | undefined>(undefined)

const DEFAULT_PRACTICE_ID = "1"

export function AnalyticsDataProvider({ children }: { children: React.ReactNode }) {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { mutate: globalMutate } = useSWRConfig()

  const practiceId = currentPractice?.id || DEFAULT_PRACTICE_ID

  const { data: analyticsData } = useSWR(!practiceLoading ? SWR_KEYS.analyticsData(practiceId) : null, swrFetcher, {
    revalidateOnFocus: false,
  })

  const practiceGrowthData = analyticsData?.practiceGrowthData || []
  const taskCategoryData = analyticsData?.taskCategoryData || []
  const teamSatisfactionData = analyticsData?.teamSatisfactionData || []
  const kpiData = analyticsData?.kpiData || []
  const efficiencyData = analyticsData?.efficiencyData || []
  const qualityMetricsData = analyticsData?.qualityMetricsData || []

  const addPracticeGrowthData = async (data: Omit<PracticeGrowthData, "id" | "createdAt" | "updatedAt">) => {
    const newData: PracticeGrowthData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, practiceGrowthData: [...practiceGrowthData, newData] },
      { revalidate: false },
    )
  }

  const updatePracticeGrowthData = async (id: string, data: Partial<PracticeGrowthData>) => {
    const updated = practiceGrowthData.map((item: PracticeGrowthData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, practiceGrowthData: updated },
      { revalidate: false },
    )
  }

  const deletePracticeGrowthData = async (id: string) => {
    const filtered = practiceGrowthData.filter((item: PracticeGrowthData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, practiceGrowthData: filtered },
      { revalidate: false },
    )
  }

  const addTaskCategoryData = async (data: Omit<TaskCategoryData, "id" | "createdAt" | "updatedAt">) => {
    const newData: TaskCategoryData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, taskCategoryData: [...taskCategoryData, newData] },
      { revalidate: false },
    )
  }

  const updateTaskCategoryData = async (id: string, data: Partial<TaskCategoryData>) => {
    const updated = taskCategoryData.map((item: TaskCategoryData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, taskCategoryData: updated },
      { revalidate: false },
    )
  }

  const deleteTaskCategoryData = async (id: string) => {
    const filtered = taskCategoryData.filter((item: TaskCategoryData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, taskCategoryData: filtered },
      { revalidate: false },
    )
  }

  const addTeamSatisfactionData = async (data: Omit<TeamSatisfactionData, "id" | "createdAt" | "updatedAt">) => {
    const newData: TeamSatisfactionData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, teamSatisfactionData: [...teamSatisfactionData, newData] },
      { revalidate: false },
    )
  }

  const updateTeamSatisfactionData = async (id: string, data: Partial<TeamSatisfactionData>) => {
    const updated = teamSatisfactionData.map((item: TeamSatisfactionData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, teamSatisfactionData: updated },
      { revalidate: false },
    )
  }

  const deleteTeamSatisfactionData = async (id: string) => {
    const filtered = teamSatisfactionData.filter((item: TeamSatisfactionData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, teamSatisfactionData: filtered },
      { revalidate: false },
    )
  }

  const addKPIData = async (data: Omit<KPIData, "id" | "createdAt" | "updatedAt">) => {
    const newData: KPIData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, kpiData: [...kpiData, newData] },
      { revalidate: false },
    )
  }

  const updateKPIData = async (id: string, data: Partial<KPIData>) => {
    const updated = kpiData.map((item: KPIData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, kpiData: updated },
      { revalidate: false },
    )
  }

  const deleteKPIData = async (id: string) => {
    const filtered = kpiData.filter((item: KPIData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, kpiData: filtered },
      { revalidate: false },
    )
  }

  const addEfficiencyData = async (data: Omit<EfficiencyData, "id" | "createdAt" | "updatedAt">) => {
    const newData: EfficiencyData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, efficiencyData: [...efficiencyData, newData] },
      { revalidate: false },
    )
  }

  const updateEfficiencyData = async (id: string, data: Partial<EfficiencyData>) => {
    const updated = efficiencyData.map((item: EfficiencyData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, efficiencyData: updated },
      { revalidate: false },
    )
  }

  const deleteEfficiencyData = async (id: string) => {
    const filtered = efficiencyData.filter((item: EfficiencyData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, efficiencyData: filtered },
      { revalidate: false },
    )
  }

  const addQualityMetricsData = async (data: Omit<QualityMetricsData, "id" | "createdAt" | "updatedAt">) => {
    const newData: QualityMetricsData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, qualityMetricsData: [...qualityMetricsData, newData] },
      { revalidate: false },
    )
  }

  const updateQualityMetricsData = async (id: string, data: Partial<QualityMetricsData>) => {
    const updated = qualityMetricsData.map((item: QualityMetricsData) =>
      item.id === id ? { ...item, ...data, updatedAt: new Date() } : item,
    )
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, qualityMetricsData: updated },
      { revalidate: false },
    )
  }

  const deleteQualityMetricsData = async (id: string) => {
    const filtered = qualityMetricsData.filter((item: QualityMetricsData) => item.id !== id)
    await globalMutate(
      SWR_KEYS.analyticsData(practiceId),
      { ...analyticsData, qualityMetricsData: filtered },
      { revalidate: false },
    )
  }

  const value = {
    practiceGrowthData,
    addPracticeGrowthData,
    updatePracticeGrowthData,
    deletePracticeGrowthData,
    taskCategoryData,
    addTaskCategoryData,
    updateTaskCategoryData,
    deleteTaskCategoryData,
    teamSatisfactionData,
    addTeamSatisfactionData,
    updateTeamSatisfactionData,
    deleteTeamSatisfactionData,
    kpiData,
    addKPIData,
    updateKPIData,
    deleteKPIData,
    efficiencyData,
    addEfficiencyData,
    updateEfficiencyData,
    deleteEfficiencyData,
    qualityMetricsData,
    addQualityMetricsData,
    updateQualityMetricsData,
    deleteQualityMetricsData,
  }

  return <AnalyticsDataContext.Provider value={value}>{children}</AnalyticsDataContext.Provider>
}

export function useAnalyticsData() {
  const context = useContext(AnalyticsDataContext)
  if (context === undefined) {
    throw new Error("useAnalyticsData must be used within an AnalyticsDataProvider")
  }
  return context
}

export default AnalyticsDataProvider
