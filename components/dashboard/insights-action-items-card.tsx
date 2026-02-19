"use client"

import useSWR from "swr"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Target, Sparkles, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface ActionItem {
  id: string
  title: string
  description: string | null
  priority: "low" | "medium" | "high" | "urgent"
  category: string | null
  due_date: string | null
  status: string
  ai_generated: boolean
}

interface Props {
  practiceId: string
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function JournalActionItemsCard({ practiceId }: Props) {
  const { data, isLoading: loading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/insights?type=action-items` : null,
    fetcher
  )

  const actionItems = data?.actionItems || []
  const journalTitle = data?.journalTitle || ""

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-500 bg-red-500/10 border-red-200"
      case "high":
        return "text-orange-500 bg-orange-500/10 border-orange-200"
      case "medium":
        return "text-yellow-600 bg-yellow-500/10 border-yellow-200"
      case "low":
        return "text-green-500 bg-green-500/10 border-green-200"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  if (loading) {
    return (
      <Card className="p-5 flex-1 overflow-auto">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </Card>
    )
  }

  if (actionItems.length === 0) {
    return (
      <Link href="/practice-insights" className="flex flex-col flex-1 min-h-0">
      <Card className="p-5 flex-1 overflow-auto hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Journal Handlungsempfehlungen</p>
              <p className="text-3xl font-bold tracking-tight mt-1">0</p>
              <p className="text-xs text-muted-foreground mt-1">Noch keine Handlungsempfehlungen vorhanden.</p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Card>
      </Link>
    )
  }

  return (
    <Card className="p-5 flex-1 overflow-auto">
      <Link href="/practice-insights" className="flex items-center justify-between mb-3 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground leading-tight">Journal Handlungsempfehlungen</p>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold tracking-tight">{actionItems.length}</p>
              {journalTitle && <p className="text-[10px] text-muted-foreground">{journalTitle}</p>}
            </div>
          </div>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </Link>
      <div className="space-y-1.5">
        {actionItems.map((item) => (
          <div key={item.id} className={`px-3 py-2 rounded-md border flex items-center justify-between gap-2 ${getPriorityColor(item.priority)}`}>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.ai_generated && <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
              <span className="font-medium text-sm truncate">{item.title}</span>
            </div>
            <Badge variant="outline" className="text-xs px-2 py-0.5 flex-shrink-0">
              {item.priority === "urgent"
                ? "Dringend"
                : item.priority === "high"
                  ? "Hoch"
                  : item.priority === "medium"
                    ? "Mittel"
                    : "Niedrig"}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default JournalActionItemsCard
