"use client"

import { memo, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clipboard, Pin, Flame, AlertTriangle, ArrowRight, Eye } from "lucide-react"

interface BulletinPost {
  id: string
  title: string
  priority: string
  category: string
  is_pinned: boolean
  is_read: boolean
  author_name: string
  created_at: string
}

export const BulletinWidget = memo(function BulletinWidget({
  practiceId,
  userId,
}: {
  practiceId: string
  userId?: string
}) {
  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const params = new URLSearchParams({ archived: "false" })
        if (userId) params.set("userId", userId)
        const res = await fetch(`/api/practices/${practiceId}/bulletin?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setPosts((data.posts || []).slice(0, 5))
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
  }, [practiceId, userId])

  const unreadCount = posts.filter((p) => !p.is_read).length

  if (isLoading) {
    return (
      <Card className="p-6 border-muted col-span-full">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-pulse bg-muted rounded" />
          <div className="h-4 w-32 animate-pulse bg-muted rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 border-muted col-span-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clipboard className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Neues vom Schwarzen Brett</h2>
            {unreadCount > 0 && (
              <Badge>{unreadCount} ungelesen</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/schwarzes-brett">
              Alle anzeigen
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine aktuellen Beiträge.</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href="/schwarzes-brett"
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {!post.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <p className={`text-sm font-medium truncate ${!post.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                      {post.title}
                    </p>
                    {post.is_pinned && <Pin className="h-3 w-3 text-muted-foreground shrink-0" />}
                    {post.priority === "urgent" && <Flame className="h-3 w-3 text-red-500 shrink-0" />}
                    {post.priority === "important" && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.author_name} &middot; {new Date(post.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
})
