"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Calendar, CheckSquare, Users, Briefcase, ClipboardList } from "lucide-react"
import { formatRelativeTimeDE } from "@/lib/utils"
import { useDashboardData } from "@/contexts/dashboard-data-context"

const activityIcons = {
  todo: CheckSquare,
  event: Calendar,
  article: FileText,
  application: Briefcase,
  team: Users,
  submission: ClipboardList,
}

const statusColors = {
  completed: "bg-success text-success-foreground",
  new: "bg-primary text-primary-foreground",
  published: "bg-success text-success-foreground",
  draft: "bg-muted text-muted-foreground",
  applied: "bg-primary text-primary-foreground",
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  approved: "bg-success text-success-foreground",
  rejected: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
  high: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400",
  low: "bg-muted text-muted-foreground",
}

function RecentActivity() {
  const { data, loading } = useDashboardData()
  const activities = data?.activities || []

  if (loading) {
    return null // Parent handles loading state now
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
          <CardDescription>Aktuelle Updates aus Ihrer Praxis</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Noch keine Aktivitäten vorhanden</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
        <CardDescription>Aktuelle Updates aus Ihrer Praxis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons] || FileText
            const timeAgo = formatRelativeTimeDE(new Date(activity.timestamp))

            return (
              <div key={`${activity.type}-${index}`} className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    {activity.status && (
                      <Badge
                        variant="secondary"
                        className={`text-xs ${statusColors[activity.status as keyof typeof statusColors] || "bg-muted text-muted-foreground"}`}
                      >
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {timeAgo}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentActivity
