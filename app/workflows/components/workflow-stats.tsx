"use client"

import { FileText, CheckCircle, Clock, BarChart3 } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import type { Workflow } from "../workflow-types"

interface WorkflowStatsProps {
  workflows: Workflow[]
}

export function WorkflowStats({ workflows }: WorkflowStatsProps) {
  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    draft: workflows.filter((w) => w.status === "draft").length,
    completed: workflows.filter((w) => w.status === "completed").length,
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <StatCard
        label="Gesamt"
        value={stats.total}
        icon={FileText}
        {...statCardColors.primary}
      />
      <StatCard
        label="Aktiv"
        value={stats.active}
        icon={CheckCircle}
        {...statCardColors.green}
      />
      <StatCard
        label="Entwürfe"
        value={stats.draft}
        icon={Clock}
        {...statCardColors.amber}
      />
      <StatCard
        label="Abgeschlossen"
        value={stats.completed}
        icon={BarChart3}
        {...statCardColors.blue}
      />
    </div>
  )
}
