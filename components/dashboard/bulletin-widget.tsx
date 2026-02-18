"use client"

import { memo, useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pin, Flame, AlertTriangle, ArrowRight, Bell } from "lucide-react"

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

function PostItem({ post }: { post: BulletinPost }) {
  return (
    <Link
      href="/schwarzes-brett"
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!post.is_read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
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

function SkeletonCard() {
  return (
    <Card className="p-6 border-muted">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-pulse bg-muted rounded" />
        <div className="h-4 w-32 animate-pulse bg-muted rounded" />
      </div>
    </Card>
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

  useEffect(() => {
    async function fetchPosts() {
      try {
        const params = new URLSearchParams({ archived: "false" })
        if (userId) params.set("userId", userId)
        const res = await fetch(`/api/practices/${practiceId}/bulletin?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setPosts(data.posts || [])
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

  if (isLoading) {
    return (
      <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pinned Posts Card */}
      <Card className="p-5 border-muted">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Pin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Angeheftet</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{pinnedPosts.length}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/schwarzes-brett">
                Alle <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          {pinnedPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Keine angehefteten Beiträge.</p>
          ) : (
            <div className="-mx-2">
              {pinnedPosts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* New / Unread Posts Card */}
      <Card className="p-5 border-muted">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Neue Beiträge</p>
                <p className="text-3xl font-bold tracking-tight mt-1">{newPosts.length}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href="/schwarzes-brett">
                Alle <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>

          {newPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Alles gelesen -- keine neuen Beiträge.</p>
          ) : (
            <div className="-mx-2">
              {newPosts.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
})
