"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePractice } from "./practice-context"

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

const HARDCODED_PRACTICE_ID = "1"

export function AnalyticsDataProvider({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [practiceGrowthData, setPracticeGrowthData] = useState<PracticeGrowthData[]>([])
  const [taskCategoryData, setTaskCategoryData] = useState<TaskCategoryData[]>([])
  const [teamSatisfactionData, setTeamSatisfactionData] = useState<TeamSatisfactionData[]>([])
  const [kpiData, setKpiData] = useState<KPIData[]>([])
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyData[]>([])
  const [qualityMetricsData, setQualityMetricsData] = useState<QualityMetricsData[]>([])
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const practiceId = currentPractice?.id || HARDCODED_PRACTICE_ID

  useEffect(() => {
    if (practiceLoading) {
      return
    }

    if (hasError) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let isMounted = true

    const fetchAnalyticsData = async () => {
      setIsLoading(true)
      try {
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        const response = await fetch(`/api/analytics/data?practiceId=${practiceId}`, {
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!isMounted) return

        if (!response.ok) {
          setIsLoading(false)
          return
        }

        const data = await response.json()

        if (!isMounted) return

        setPracticeGrowthData(data.practiceGrowthData || [])
        setTaskCategoryData(data.taskCategoryData || [])
        setTeamSatisfactionData(data.teamSatisfactionData || [])
        setKpiData(data.kpiData || [])
        setEfficiencyData(data.efficiencyData || [])
        setQualityMetricsData(data.qualityMetricsData || [])
      } catch (error: any) {
        if (error?.name === "AbortError" || !isMounted) return
        setHasError(true)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAnalyticsData()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [practiceId, hasError, practiceLoading])

  // CRUD functions for Practice Growth Data
  const addPracticeGrowthData = (data: Omit<PracticeGrowthData, "id" | "createdAt" | "updatedAt">) => {
    const newData: PracticeGrowthData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setPracticeGrowthData((prev) => [...prev, newData])
  }

  const updatePracticeGrowthData = (id: string, data: Partial<PracticeGrowthData>) => {
    setPracticeGrowthData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)),
    )
  }

  const deletePracticeGrowthData = (id: string) => {
    setPracticeGrowthData((prev) => prev.filter((item) => item.id !== id))
  }

  // CRUD functions for Task Category Data
  const addTaskCategoryData = (data: Omit<TaskCategoryData, "id" | "createdAt" | "updatedAt">) => {
    const newData: TaskCategoryData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTaskCategoryData((prev) => [...prev, newData])
  }

  const updateTaskCategoryData = (id: string, data: Partial<TaskCategoryData>) => {
    setTaskCategoryData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)),
    )
  }

  const deleteTaskCategoryData = (id: string) => {
    setTaskCategoryData((prev) => prev.filter((item) => item.id !== id))
  }

  // CRUD functions for Team Satisfaction Data
  const addTeamSatisfactionData = (data: Omit<TeamSatisfactionData, "id" | "createdAt" | "updatedAt">) => {
    const newData: TeamSatisfactionData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setTeamSatisfactionData((prev) => [...prev, newData])
  }

  const updateTeamSatisfactionData = (id: string, data: Partial<TeamSatisfactionData>) => {
    setTeamSatisfactionData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)),
    )
  }

  const deleteTeamSatisfactionData = (id: string) => {
    setTeamSatisfactionData((prev) => prev.filter((item) => item.id !== id))
  }

  // CRUD functions for KPI Data
  const addKPIData = (data: Omit<KPIData, "id" | "createdAt" | "updatedAt">) => {
    const newData: KPIData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setKpiData((prev) => [...prev, newData])
  }

  const updateKPIData = (id: string, data: Partial<KPIData>) => {
    setKpiData((prev) => prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)))
  }

  const deleteKPIData = (id: string) => {
    setKpiData((prev) => prev.filter((item) => item.id !== id))
  }

  // CRUD functions for Efficiency Data
  const addEfficiencyData = (data: Omit<EfficiencyData, "id" | "createdAt" | "updatedAt">) => {
    const newData: EfficiencyData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setEfficiencyData((prev) => [...prev, newData])
  }

  const updateEfficiencyData = (id: string, data: Partial<EfficiencyData>) => {
    setEfficiencyData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)),
    )
  }

  const deleteEfficiencyData = (id: string) => {
    setEfficiencyData((prev) => prev.filter((item) => item.id !== id))
  }

  // CRUD functions for Quality Metrics Data
  const addQualityMetricsData = (data: Omit<QualityMetricsData, "id" | "createdAt" | "updatedAt">) => {
    const newData: QualityMetricsData = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setQualityMetricsData((prev) => [...prev, newData])
  }

  const updateQualityMetricsData = (id: string, data: Partial<QualityMetricsData>) => {
    setQualityMetricsData((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data, updatedAt: new Date() } : item)),
    )
  }

  const deleteQualityMetricsData = (id: string) => {
    setQualityMetricsData((prev) => prev.filter((item) => item.id !== id))
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
