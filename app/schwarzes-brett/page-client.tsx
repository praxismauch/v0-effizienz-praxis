"use client"

import { useState, useEffect, useCallback } from "react"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clipboard, Plus, Pin, AlertTriangle, Edit, Trash2, Search, User, Calendar } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

interface BulletinPost {
  id: string
  practice_id: string
  author_id: string | null
  author_name: string
  title: string
  content: string
  is_pinned: boolean
  is_important: boolean
  created_at: string
  updated_at: string
}

export default function SchwarzesBrettClient() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BulletinPost | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BulletinPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    is_pinned: false,
    is_important: false,
  })

  const fetchPosts = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/bulletin`)
      if (!res.ok) throw new Error("Fetch failed")
      const data = await res.json()
      setPosts(data.posts || [])
    } catch {
      console.error("Failed to fetch bulletin posts")
    } finally {
      setIsLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    if (practiceId) {
      setIsLoading(true)
      fetchPosts()
    }
  }, [fetchPosts, practiceId])

  const openCreateDialog = () => {
    setEditingPost(null)
    setFormData({ title: "", content: "", is_pinned: false, is_important: false })
    setIsDialogOpen(true)
  }

  const openEditDialog = (post: BulletinPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      is_pinned: post.is_pinned,
      is_important: post.is_important,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Bitte Titel und Inhalt eingeben")
      return
    }
    if (!practiceId) return

    setIsSaving(true)
    try {
      if (editingPost) {
        const res = await fetch(`/api/practices/${practiceId}/bulletin/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error("Update failed")
        const data = await res.json()
        setPosts((prev) => prev.map((p) => (p.id === editingPost.id ? { ...p, ...data.post } : p)))
        toast.success("Beitrag aktualisiert")
      } else {
        const res = await fetch(`/api/practices/${practiceId}/bulletin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            author_id: currentUser?.id || null,
            author_name: currentUser?.name || currentUser?.email || "Unbekannt",
          }),
        })
        if (!res.ok) throw new Error("Create failed")
        const data = await res.json()
        setPosts((prev) => [data.post, ...prev])
        toast.success("Beitrag erstellt")
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(editingPost ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !practiceId) return
    try {
      await fetch(`/api/practices/${practiceId}/bulletin/${deleteTarget.id}`, { method: "DELETE" })
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success("Beitrag geloescht")
    } catch {
      toast.error("Fehler beim Loeschen")
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleTogglePin = async (post: BulletinPost) => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/bulletin/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: !post.is_pinned }),
      })
      if (!res.ok) throw new Error("Toggle failed")
      const data = await res.json()
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...data.post } : p)))
      toast.success(post.is_pinned ? "Beitrag losgelost" : "Beitrag angeheftet")
    } catch {
      toast.error("Fehler beim Anpinnen")
    }
  }

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedPosts = filteredPosts.filter((p) => p.is_pinned)
  const regularPosts = filteredPosts.filter((p) => !p.is_pinned)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isAuthorOrAdmin = (post: BulletinPost) => {
    if (!currentUser) return false
    return (
      post.author_id === currentUser.id ||
      currentUser.role === "super_admin" ||
      currentUser.role === "admin" ||
      currentUser.role === "practice_admin"
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Schwarzes Brett"
          description="Ankuendigungen, Hinweise und wichtige Mitteilungen fuer das Team."
          icon={Clipboard}
        />

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Beitraege durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Beitrag
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Noch keine Beitraege</h3>
              <p className="text-muted-foreground mt-1">
                Erstellen Sie den ersten Beitrag fuer Ihr Team.
              </p>
              <Button className="mt-4" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Beitrag erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pin className="h-4 w-4" />
                  Angeheftet ({pinnedPosts.length})
                </h3>
                {pinnedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onTogglePin={handleTogglePin}
                    formatDate={formatDate}
                    canManage={isAuthorOrAdmin(post)}
                  />
                ))}
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 && (
              <div className="space-y-3">
                {pinnedPosts.length > 0 && (
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Alle Beitraege ({regularPosts.length})
                  </h3>
                )}
                {regularPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onEdit={openEditDialog}
                    onDelete={setDeleteTarget}
                    onTogglePin={handleTogglePin}
                    formatDate={formatDate}
                    canManage={isAuthorOrAdmin(post)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Beitrag bearbeiten" : "Neuer Beitrag"}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? "Aktualisieren Sie Ihren Beitrag am Schwarzen Brett."
                : "Erstellen Sie einen neuen Beitrag fuer das Team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Betreff des Beitrags"
              />
            </div>
            <div>
              <Label htmlFor="content">Inhalt *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Schreiben Sie Ihren Beitrag..."
                rows={5}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_pinned">Anpinnen</Label>
              <Switch
                id="is_pinned"
                checked={formData.is_pinned}
                onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_important">Als wichtig markieren</Label>
              <Switch
                id="is_important"
                checked={formData.is_important}
                onCheckedChange={(checked) => setFormData({ ...formData, is_important: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichert..." : editingPost ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beitrag loeschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Beitrag &quot;{deleteTarget?.title}&quot; wird unwiderruflich geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Loeschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

function PostCard({
  post,
  onEdit,
  onDelete,
  onTogglePin,
  formatDate,
  canManage,
}: {
  post: BulletinPost
  onEdit: (post: BulletinPost) => void
  onDelete: (post: BulletinPost) => void
  onTogglePin: (post: BulletinPost) => void
  formatDate: (d: string) => string
  canManage: boolean
}) {
  return (
    <Card className={post.is_important ? "border-amber-500/50 bg-amber-500/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{post.title}</CardTitle>
              {post.is_pinned && (
                <Badge variant="secondary" className="text-xs">
                  <Pin className="h-3 w-3 mr-1" />
                  Angeheftet
                </Badge>
              )}
              {post.is_important && (
                <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Wichtig
                </Badge>
              )}
            </div>
            <CardDescription className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {post.author_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(post.created_at)}
              </span>
            </CardDescription>
          </div>
          {canManage && (
            <div className="flex items-center gap-1 shrink-0">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onTogglePin(post)}>
                <Pin className={`h-4 w-4 ${post.is_pinned ? "text-primary" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(post)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(post)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  )
}
