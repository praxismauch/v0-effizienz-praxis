"use client"
import { useState, useMemo } from "react"
import type { Todo } from "@/contexts/todo-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Calendar, AlertCircle, CheckCircle2, TrendingUp, Clock, ArrowUpDown, Filter } from "lucide-react"

interface TaskDistributionTabProps {
  practiceId: string
  tasks: Todo[]
  onRefresh: () => void
}

export function TaskDistributionTab({ practiceId, tasks, onRefresh }: TaskDistributionTabProps) {
  const [sortBy, setSortBy] = useState<"name" | "tasks" | "completion">("tasks")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [showCompleted, setShowCompleted] = useState(true)

  // Filter tasks based on priority and completion
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (!showCompleted && task.completed) return false
      if (filterPriority !== "all" && task.priority !== filterPriority) return false
      return true
    })
  }, [tasks, filterPriority, showCompleted])

  // Group tasks by assigned user
  const tasksByUser = useMemo(() => {
    return filteredTasks.reduce(
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
  }, [filteredTasks])

  // Sort users
  const sortedUsers = useMemo(() => {
    const entries = Object.entries(tasksByUser)
    return entries.sort(([userA, tasksA], [userB, tasksB]) => {
      if (sortBy === "name") {
        return userA.localeCompare(userB)
      } else if (sortBy === "tasks") {
        return tasksB.length - tasksA.length
      } else {
        const completionA = tasksA.filter((t) => t.completed).length / tasksA.length
        const completionB = tasksB.filter((t) => t.completed).length / tasksB.length
        return completionB - completionA
      }
    })
  }, [tasksByUser, sortBy])

  // Calculate statistics
  const totalTasks = filteredTasks.length
  const completedTasks = filteredTasks.filter((t) => t.completed).length
  const pendingTasks = totalTasks - completedTasks
  const highPriorityTasks = filteredTasks.filter((t) => t.priority === "high").length
  const overdueTasks = filteredTasks.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt Aufgaben</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Object.keys(tasksByUser).length} Benutzer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abgeschlossen</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">{completionRate}%</span> Fortschritt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offen</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              In Bearbeitung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hohe Priorität</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPriorityTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Dringend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Überfällig</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Fälligkeitsdatum überschritten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aufgabenverteilung nach Benutzer</CardTitle>
              <CardDescription>Übersicht über die Aufgabenverteilung im Team</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {showCompleted ? "Alle" : "Nur Offene"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter nach Priorität" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="high">Hohe Priorität</SelectItem>
                  <SelectItem value="medium">Mittlere Priorität</SelectItem>
                  <SelectItem value="low">Niedrige Priorität</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sortieren nach" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tasks">Anzahl Aufgaben</SelectItem>
                  <SelectItem value="completion">Fortschritt</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {sortedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Keine Aufgaben gefunden</p>
              </div>
            ) : (
              sortedUsers.map(([user, userTasks]) => {
                const completed = userTasks.filter((t) => t.completed).length
                const total = userTasks.length
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
                const overdue = userTasks.filter(
                  (t) => !t.completed && t.due_date && new Date(t.due_date) < new Date(),
                ).length

                return (
                  <div key={user} className="space-y-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <span className="font-semibold">{user}</span>
                          <p className="text-xs text-muted-foreground">
                            {total} {total === 1 ? "Aufgabe" : "Aufgaben"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {overdue > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {overdue}
                          </Badge>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {completed} / {total}
                          </div>
                          <Badge
                            variant={percentage === 100 ? "default" : percentage >= 75 ? "secondary" : "outline"}
                            className="mt-1"
                          >
                            {percentage}%
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            Hoch: {userTasks.filter((t) => t.priority === "high").length}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-yellow-500" />
                            Mittel: {userTasks.filter((t) => t.priority === "medium").length}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            Niedrig: {userTasks.filter((t) => t.priority === "low").length}
                          </span>
                        </div>
                        {percentage > 0 && percentage < 100 && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {total - completed} übrig
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
