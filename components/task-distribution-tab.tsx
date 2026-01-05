"use client"
import type { Todo } from "@/contexts/todo-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"

interface TaskDistributionTabProps {
  practiceId: string
  tasks: Todo[]
  onRefresh: () => void
}

export function TaskDistributionTab({ practiceId, tasks, onRefresh }: TaskDistributionTabProps) {
  // Group tasks by assigned user
  const tasksByUser = tasks.reduce(
    (acc, task) => {
      const assignedTo = task.assigned_to || "Nicht zugewiesen"
      if (!acc[assignedTo]) {
        acc[assignedTo] = []
      }
      acc[assignedTo].push(task)
      return acc
    },
    {} as Record<string, Todo[]>,
  )

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const highPriorityTasks = tasks.filter((t) => t.priority === "high").length

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Aufgaben</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offen</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hohe Priorität</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Distribution by User */}
      <Card>
        <CardHeader>
          <CardTitle>Aufgabenverteilung nach Benutzer</CardTitle>
          <CardDescription>Übersicht über die Aufgabenverteilung im Team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(tasksByUser).map(([user, userTasks]) => {
              const completed = userTasks.filter((t) => t.completed).length
              const total = userTasks.length
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <div key={user} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {completed} / {total}
                      </span>
                      <Badge variant={percentage === 100 ? "default" : "secondary"}>{percentage}%</Badge>
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Hoch: {userTasks.filter((t) => t.priority === "high").length}</span>
                    <span>Mittel: {userTasks.filter((t) => t.priority === "medium").length}</span>
                    <span>Niedrig: {userTasks.filter((t) => t.priority === "low").length}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
