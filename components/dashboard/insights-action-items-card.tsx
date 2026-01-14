"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Target, Sparkles } from "lucide-react"

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

export function JournalActionItemsCard({ practiceId }: Props) {
  const [loading, setLoading] = useState(true)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [journalTitle, setJournalTitle] = useState("")

  useEffect(() => {
    loadActionItems()
  }, [practiceId])

  async function loadActionItems() {
    try {
      const supabase = createClient()

      // Get the latest journal
      const { data: journal } = await supabase
        .from("practice_journals")
        .select("id, title")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!journal) {
        setLoading(false)
        return
      }

      setJournalTitle(journal.title)

      // Get action items for this journal
      const { data: items } = await supabase
        .from("journal_action_items")
        .select("*")
        .eq("journal_id", journal.id)
        .is("deleted_at", null)
        .in("status", ["pending", "in_progress"])
        .order("priority", { ascending: false })
        .limit(5)

      setActionItems(items || [])
      setLoading(false)
    } catch (error) {
      console.error("Error loading action items:", error)
      setLoading(false)
    }
  }

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
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (actionItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-primary" />
            Journal Handlungsempfehlungen
          </CardTitle>
          <CardDescription>Handlungsempfehlungen aus Ihrem letzten Journal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">Noch keine Handlungsempfehlungen vorhanden.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              Journal Handlungsempfehlungen
            </CardTitle>
            <CardDescription>{journalTitle}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {actionItems.map((item) => (
          <div key={item.id} className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {item.ai_generated && <Sparkles className="h-3 w-3 text-primary flex-shrink-0" />}
                  <span className="font-medium text-sm truncate">{item.title}</span>
                </div>
                {item.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Fällig: {new Date(item.due_date).toLocaleDateString("de-DE")}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {item.priority === "urgent"
                  ? "Dringend"
                  : item.priority === "high"
                    ? "Hoch"
                    : item.priority === "medium"
                      ? "Mittel"
                      : "Niedrig"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default JournalActionItemsCard
