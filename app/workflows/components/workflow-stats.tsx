"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Aktiv</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Entwürfe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Abgeschlossen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
        </CardContent>
      </Card>
    </div>
  )
}
