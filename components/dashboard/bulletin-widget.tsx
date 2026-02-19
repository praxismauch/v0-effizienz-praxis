"use client"

import { memo, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pin, Flame, AlertTriangle, ArrowRight, Bell, Newspaper } from "lucide-react"

interface BulletinPost {
  id: string
  title: string
  priority: string
  category: string
  is_pinned: boolean
  is_read: boolean
  author_name: string
  created_at: string
  content?: string
}

type TabKey = "pinned" | "new"

function PostItem({ post }: { post: BulletinPost }) {
  return (
    <Link
      href="/schwarzes-brett"
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!post.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
          )}
          {post.is_pinned && (
            <Pin className="h-3 w-3 text-emerald-500 shrink-0" />
          )}
          <p className={`text-sm font-medium truncate ${!post.is_read ? "text-foreground" : "text-muted-foreground"}`}>
            {post.title}
          </p>
          {post.priority === "urgent" && <Flame className="h-3 w-3 text-red-500 shrink-0" />}
          {post.priority === "important" && <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {post.author_name} &middot; {new Date(post.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
        </p>
      </div>
    </Link>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  accentClass,
}: {
  active: boolean
  onClick: () => void
  icon: React.ElementType
  label: string
  count: number
  accentClass: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <Icon className={`h-4 w-4 ${active ? accentClass : ""}`} />
      {label}
      {count > 0 && (
        <span className={`inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full text-xs font-semibold ${
          active ? `${accentClass} bg-muted` : "text-muted-foreground bg-muted/60"
        }`}>
          {count}
        </span>
      )}
    </button>
  )
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
  const [activeTab, setActiveTab] = useState<TabKey>("pinned")

  useEffect(() => {
    async function fetchPosts() {
      try {
        const params = new URLSearchParams({ archived: "false" })
        if (userId) params.set("userId", userId)
        const res = await fetch(`/api/practices/${practiceId}/bulletin?${params}`)
        if (!res.ok) return
        const data = await res.json()
        const fetched: BulletinPost[] = data.posts || []
        setPosts(fetched)

        // Auto-select the tab with content
        const hasPinned = fetched.some((p) => p.is_pinned)
        const hasNew = fetched.some((p) => !p.is_read)
        if (!hasPinned && hasNew) setActiveTab("new")
      } catch {
        // silent
      } finally {
        setIsLoading(false)
      }
    }
    fetchPosts()
  }, [practiceId, userId])

  const pinnedPosts = posts.filter((p) => p.is_pinned).slice(0, 5)
  const newPosts = posts.filter((p) => !p.is_read).slice(0, 5)
  const displayPosts = activeTab === "pinned" ? pinnedPosts : newPosts

  if (isLoading) {
    return (
      <Card className="p-5 border-muted flex-1 overflow-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse bg-muted rounded" />
            <div className="h-3 w-20 animate-pulse bg-muted rounded" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5 border-muted flex-1 overflow-auto">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Schwarzes Brett</p>
              <p className="text-xs text-muted-foreground">{posts.length} Beitr&auml;ge</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" asChild>
            <Link href="/schwarzes-brett">
              Alle <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-lg w-fit">
          <TabButton
            active={activeTab === "pinned"}
            onClick={() => setActiveTab("pinned")}
            icon={Pin}
            label="Angeheftet"
            count={pinnedPosts.length}
            accentClass="text-emerald-600"
          />
          <TabButton
            active={activeTab === "new"}
            onClick={() => setActiveTab("new")}
            icon={Bell}
            label="Neu"
            count={newPosts.length}
            accentClass="text-blue-600"
          />
        </div>

        {/* Post list */}
        {displayPosts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {activeTab === "pinned"
              ? "Keine angehefteten Beiträge."
              : "Alles gelesen – keine neuen Beiträge."}
          </p>
        ) : (
          <div className="-mx-2">
            {displayPosts.map((post) => (
              <PostItem key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Card>
  )
})
