"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
)

const ChartSkeleton = () => <div className="h-[300px] animate-pulse bg-muted rounded-lg" />

export const LazyHolidayPlanner = dynamic(
  () => import("@/components/holiday-planner").then((mod) => ({ default: mod.HolidayPlanner })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
)

export const LazySickLeavesManager = dynamic(
  () => import("@/components/sick-leaves-manager").then((mod) => ({ default: mod.SickLeavesManager })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
)

export const LazyCalendarAssistant = dynamic(() => import("@/components/ai-calendar-assistant-dialog"), {
  loading: () => null,
  ssr: false,
})

export const LazyDocumentAnalyzer = dynamic(() => import("@/components/ai-document-analyzer-dialog"), {
  loading: () => null,
  ssr: false,
})

export const LazyGoalGenerator = dynamic(() => import("@/components/ai-goal-generator-dialog"), {
  loading: () => null,
  ssr: false,
})

export const LazyAnalyticsDashboard = dynamic(() => import("@/components/analytics-dashboard"), {
  loading: LoadingSpinner,
  ssr: false,
})

export const LazyDashboardOverview = dynamic(() => import("@/components/dashboard-overview"), {
  loading: LoadingSpinner,
  ssr: false,
})

export const LazySuperAdminDashboard = dynamic(() => import("@/components/super-admin-dashboard"), {
  loading: LoadingSpinner,
  ssr: false,
})

export const LazyHiringPipeline = dynamic(
  () => import("@/components/hiring/hiring-pipeline").then((mod) => ({ default: mod.HiringPipeline })),
  {
    loading: LoadingSpinner,
    ssr: false,
  },
)

export const LazyKPIChart = dynamic(() => import("@/components/kpi-trends-chart"), {
  loading: ChartSkeleton,
  ssr: false,
})

export const LazyPerformanceMetrics = dynamic(() => import("@/components/performance-metrics"), {
  loading: ChartSkeleton,
  ssr: false,
})

export const LazyReferralDialog = dynamic(() => import("@/components/referral-dialog"), {
  loading: () => null,
  ssr: false,
})

export const LazyTicketManagement = dynamic(() => import("@/components/ticket-management"), {
  loading: LoadingSpinner,
  ssr: false,
})
