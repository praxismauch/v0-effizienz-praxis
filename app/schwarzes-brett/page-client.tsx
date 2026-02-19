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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Clipboard,
  Plus,
  Pin,
  AlertTriangle,
  Edit,
  Trash2,
  Search,
  User,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Archive,
  ArrowUpCircle,
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  SortAsc,
  Users,
  Shield,
  Flame,
  LayoutGrid,
  List,
} from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { OrgaCategorySelect } from "@/components/orga-category-select"

// Constants
interface OrgaCategoryItem {
  id: string
  name: string
  color: string
}

const PRIORITIES = [
  { value: "normal", label: "Normal", color: "text-muted-foreground", bg: "" },
  { value: "important", label: "Wichtig", color: "text-amber-600", bg: "border-amber-500/50 bg-amber-500/5" },
  { value: "urgent", label: "Dringend", color: "text-red-600", bg: "border-red-500/50 bg-red-500/5" },
]

const VISIBILITY_OPTIONS = [
  { value: "all", label: "Alle Mitarbeiter" },
  { value: "roles", label: "Bestimmte Rollen" },
]

const ROLES = [
  { value: "doctor", label: "Arzt/Ärztin" },
  { value: "mfa", label: "MFA" },
  { value: "verah", label: "VERAH" },
  { value: "admin", label: "Verwaltung" },
  { value: "practice_admin", label: "Praxisleitung" },
]

interface BulletinPost {
  id: string
  practice_id: string
  author_id: string | null
  author_name: string
  title: string
  content: string
  category: string
  priority: string
  visibility: string
  visible_roles: string[]
  visible_user_ids: string[]
  is_pinned: boolean
  is_important: boolean
  publish_at: string
  expires_at: string | null
  requires_confirmation: boolean
  is_archived: boolean
  is_read: boolean
  read_count: number
  created_at: string
  updated_at: string
}

const defaultFormData = {
  title: "",
  content: "",
  category: "",
  priority: "normal",
  visibility: "all",
  visible_roles: [] as string[],
  is_pinned: false,
  publish_at: "",
  expires_at: "",
  requires_confirmation: false,
}

export default function SchwarzesBrettClient() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const [posts, setPosts] = useState<BulletinPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("aktiv")
  const [activCount, setActivCount] = useState(0)
  const [archivCount, setArchivCount] = useState(0)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filterUnread, setFilterUnread] = useState(false)
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid")

  // Orga categories from database
  const [orgaCategories, setOrgaCategories] = useState<OrgaCategoryItem[]>([])

  useEffect(() => {
    if (!practiceId) return
    fetch(`/api/practices/${practiceId}/orga-categories`)
      .then((res) => res.ok ? res.json() : { categories: [] })
      .then((data) => {
        const cats = (data.categories || []).sort((a: OrgaCategoryItem, b: OrgaCategoryItem) =>
          a.name.localeCompare(b.name)
        )
        setOrgaCategories(cats)
      })
      .catch(() => setOrgaCategories([]))
  }, [practiceId])

  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BulletinPost | null>(null)
  const [detailPost, setDetailPost] = useState<BulletinPost | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BulletinPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState(defaultFormData)

  const fetchPosts = useCallback(async () => {
  console.log("[v0] fetchPosts called, practiceId=", practiceId, "activeTab=", activeTab)
  if (!practiceId) {
  console.log("[v0] fetchPosts: no practiceId, aborting")
  return
  }
  try {
  const params = new URLSearchParams()
      if (filterCategory !== "all") params.set("category", filterCategory)
      if (filterPriority !== "all") params.set("priority", filterPriority)
      if (filterUnread) params.set("unread", "true")
      if (sortBy) params.set("sort", sortBy)
      if (searchQuery.trim()) params.set("search", searchQuery)
      if (currentUser?.id) params.set("userId", currentUser.id)
      params.set("archived", activeTab === "archiv" ? "true" : "false")

  const url = `/api/practices/${practiceId}/bulletin?${params}`
  console.log("[v0] fetchPosts: calling", url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  const data = await res.json()
  console.log("[v0] fetchPosts: got", (data.posts || []).length, "posts")
  setPosts(data.posts || [])

      // Fetch counts for both tabs
      const countActive = fetch(`/api/practices/${practiceId}/bulletin?archived=false&count_only=true${currentUser?.id ? `&userId=${currentUser.id}` : ""}`)
      const countArchive = fetch(`/api/practices/${practiceId}/bulletin?archived=true&count_only=true${currentUser?.id ? `&userId=${currentUser.id}` : ""}`)
      const [activeRes, archiveRes] = await Promise.all([countActive, countArchive])
      if (activeRes.ok) {
        const d = await activeRes.json()
        setActivCount(d.count ?? (d.posts || []).length)
      }
      if (archiveRes.ok) {
        const d = await archiveRes.json()
        setArchivCount(d.count ?? (d.posts || []).length)
      }
    } catch {
      console.error("Failed to fetch bulletin posts")
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, filterCategory, filterPriority, filterUnread, sortBy, searchQuery, currentUser?.id, activeTab])

  useEffect(() => {
  if (practiceId) {
  console.log("[v0] SchwarzesBrett: triggering fetchPosts, practiceId=", practiceId)
  setIsLoading(true)
  fetchPosts()
  } else {
  console.log("[v0] SchwarzesBrett: no practiceId yet, skipping fetch")
  }
  }, [fetchPosts, practiceId])

  const markAsRead = useCallback(async (postId: string) => {
    if (!practiceId || !currentUser?.id) return
    try {
      await fetch(`/api/practices/${practiceId}/bulletin/${postId}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id }),
      })
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_read: true, read_count: p.read_count + 1 } : p)))
    } catch {
      // silent
    }
  }, [practiceId, currentUser?.id])

  const openCreateDialog = () => {
    setEditingPost(null)
    setFormData(defaultFormData)
    setIsDialogOpen(true)
  }

  const openEditDialog = (post: BulletinPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category,
      priority: post.priority,
      visibility: post.visibility,
      visible_roles: post.visible_roles || [],
      is_pinned: post.is_pinned,
      publish_at: post.publish_at ? new Date(post.publish_at).toISOString().slice(0, 16) : "",
      expires_at: post.expires_at ? new Date(post.expires_at).toISOString().slice(0, 16) : "",
      requires_confirmation: post.requires_confirmation,
    })
    setIsDialogOpen(true)
  }

  const openDetailView = (post: BulletinPost) => {
    setDetailPost(post)
    if (!post.is_read) {
      markAsRead(post.id)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Bitte Titel und Inhalt eingeben")
      return
    }
    if (!practiceId) return

    setIsSaving(true)
    try {
      const payload = {
        ...formData,
        is_important: formData.priority === "urgent" || formData.priority === "important",
        publish_at: formData.publish_at || new Date().toISOString(),
        expires_at: formData.expires_at || null,
        author_id: currentUser?.id || null,
        author_name: currentUser?.name || currentUser?.email || "Unbekannt",
      }

      if (editingPost) {
        const res = await fetch(`/api/practices/${practiceId}/bulletin/${editingPost.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Update failed")
        toast.success("Beitrag aktualisiert")
      } else {
        const res = await fetch(`/api/practices/${practiceId}/bulletin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Create failed")
        toast.success("Beitrag erstellt")
      }
      setIsDialogOpen(false)
      fetchPosts()
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
      toast.success("Beitrag deaktiviert")
    } catch {
      toast.error("Fehler beim Deaktivieren")
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
      fetchPosts()
      toast.success(post.is_pinned ? "Beitrag losgelöst" : "Beitrag angeheftet")
    } catch {
      toast.error("Fehler beim Anpinnen")
    }
  }

  const handleArchive = async (post: BulletinPost) => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/bulletin/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_archived: !post.is_archived }),
      })
      if (!res.ok) throw new Error("Archive failed")
      fetchPosts()
      toast.success(post.is_archived ? "Beitrag wiederhergestellt" : "Beitrag archiviert")
    } catch {
      toast.error("Fehler beim Archivieren")
    }
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

  const pinnedPosts = posts.filter((p) => p.is_pinned)
  const regularPosts = posts.filter((p) => !p.is_pinned)

  const unreadCount = posts.filter((p) => !p.is_read).length
  const urgentCount = posts.filter((p) => p.priority === "urgent" && !p.is_read).length

  // Stats
  const stats = [
    { label: "Gesamt", value: posts.length, icon: Clipboard, iconColor: "text-blue-600", bgColor: "bg-blue-500/10" },
    { label: "Ungelesen", value: unreadCount, icon: EyeOff, iconColor: "text-amber-600", bgColor: "bg-amber-500/10" },
    { label: "Dringend", value: urgentCount, icon: Flame, iconColor: "text-red-600", bgColor: "bg-red-500/10" },
    { label: "Angeheftet", value: pinnedPosts.length, icon: Pin, iconColor: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Schwarzes Brett"
          subtitle="Zentrale Kommunikationsplattform für Ankündigungen, Hinweise und wichtige Mitteilungen."
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: Active / Archive */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="space-y-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="aktiv">Aktiv ({activCount})</TabsTrigger>
              <TabsTrigger value="archiv">
                <Archive className="h-4 w-4 mr-1" />
                Archiv ({archivCount})
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center justify-end gap-2">
              <div className="flex items-center rounded-md border">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-r-none"
                  onClick={() => setViewMode("list")}
                  title="Listenansicht"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8 rounded-l-none"
                  onClick={() => setViewMode("grid")}
                  title="Kachelansicht"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Beitrag
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="relative lg:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Volltextsuche..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kategorien</SelectItem>
                      {orgaCategories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || "#64748b" }} />
                            {c.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorität" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Prioritäten</SelectItem>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sortierung" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Neueste zuerst</SelectItem>
                      <SelectItem value="priority">Nach Priorität</SelectItem>
                      <SelectItem value="category">Nach Kategorie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="unread-filter"
                      checked={filterUnread}
                      onCheckedChange={setFilterUnread}
                    />
                    <Label htmlFor="unread-filter" className="text-sm">Nur ungelesene</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="aktiv" className="mt-4">
            <PostList
              posts={posts}
              pinnedPosts={pinnedPosts}
              regularPosts={regularPosts}
              isLoading={isLoading}
              onCreateNew={openCreateDialog}
              onEdit={openEditDialog}
              onDelete={setDeleteTarget}
              onTogglePin={handleTogglePin}
              onArchive={handleArchive}
              onViewDetail={openDetailView}
              isAuthorOrAdmin={isAuthorOrAdmin}
              viewMode={viewMode}
              orgaCategories={orgaCategories}
            />
          </TabsContent>
          
          <TabsContent value="archiv" className="mt-4">
            <PostList
              posts={posts}
              pinnedPosts={[]}
              regularPosts={posts}
              isLoading={isLoading}
              onCreateNew={openCreateDialog}
              onEdit={openEditDialog}
              onDelete={setDeleteTarget}
              onTogglePin={handleTogglePin}
              onArchive={handleArchive}
              onViewDetail={openDetailView}
              isAuthorOrAdmin={isAuthorOrAdmin}
              isArchiveView
              viewMode={viewMode}
              orgaCategories={orgaCategories}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Beitrag bearbeiten" : "Neuer Beitrag"}</DialogTitle>
            <DialogDescription>
              {editingPost
                ? "Aktualisieren Sie Ihren Beitrag am Schwarzen Brett."
                : "Erstellen Sie einen neuen Beitrag für das Team."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Title */}
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Betreff des Beitrags"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Inhalt *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Schreiben Sie Ihren Beitrag... (Markdown wird unterstützt)"
                rows={6}
              />
            </div>

            {/* Category + Priority row */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Kategorie</Label>
                <OrgaCategorySelect
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                  showNoneOption={false}
                  placeholder="Kategorie wählen..."
                />
              </div>
              <div>
                <Label>Priorität</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={p.color}>{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility */}
            <div>
              <Label>Sichtbarkeit</Label>
              <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v, visible_roles: [] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role selection when visibility = roles */}
            {formData.visibility === "roles" && (
              <div>
                <Label className="mb-2 block">Sichtbar für Rollen</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => {
                    const isSelected = formData.visible_roles.includes(role.value)
                    return (
                      <Badge
                        key={role.value}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            visible_roles: isSelected
                              ? formData.visible_roles.filter((r) => r !== role.value)
                              : [...formData.visible_roles, role.value],
                          })
                        }}
                      >
                        {role.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Publish / Expire dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="publish_at">Ver����ffentlichung</Label>
                <Input
                  id="publish_at"
                  type="datetime-local"
                  value={formData.publish_at}
                  onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Leer = sofort</p>
              </div>
              <div>
                <Label htmlFor="expires_at">Ablaufdatum</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Leer = kein Ablauf</p>
              </div>
            </div>

            {/* Switches row */}
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pin className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="is_pinned">Anpinnen</Label>
                </div>
                <Switch
                  id="is_pinned"
                  checked={formData.is_pinned}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_pinned: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="requires_confirmation">Lesebestätigung erforderlich</Label>
                    <p className="text-xs text-muted-foreground">Mitarbeiter müssen den Beitrag bestätigen</p>
                  </div>
                </div>
                <Switch
                  id="requires_confirmation"
                  checked={formData.requires_confirmation}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_confirmation: checked })}
                />
              </div>
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

      {/* Detail View Dialog */}
      <Dialog open={!!detailPost} onOpenChange={(open) => !open && setDetailPost(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailPost && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={detailPost.priority} />
                  <CategoryBadge category={detailPost.category} categories={orgaCategories} />
                  {detailPost.is_pinned && (
                    <Badge variant="secondary"><Pin className="h-3 w-3 mr-1" />Angeheftet</Badge>
                  )}
                  {detailPost.requires_confirmation && (
                    <Badge variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Lesebestätigung</Badge>
                  )}
                </div>
                <DialogTitle className="text-xl">{detailPost.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />{detailPost.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{formatDate(detailPost.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />{detailPost.read_count} gelesen
                  </span>
                  {detailPost.visibility === "roles" && (
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {detailPost.visible_roles?.map((r) => ROLES.find((rl) => rl.value === r)?.label).join(", ")}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-foreground leading-relaxed">{detailPost.content}</p>
              </div>
              {detailPost.expires_at && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-4 border-t">
                  <Clock className="h-3 w-3" />
                  Läuft ab am {formatDate(detailPost.expires_at)}
                </div>
              )}
              <DialogFooter className="mt-4">
                {isAuthorOrAdmin(detailPost) && (
                  <div className="flex gap-2 mr-auto">
                    <Button variant="outline" size="sm" onClick={() => { setDetailPost(null); openEditDialog(detailPost) }}>
                      <Edit className="h-4 w-4 mr-1" />Bearbeiten
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDetailPost(null); handleArchive(detailPost) }}>
                      <Archive className="h-4 w-4 mr-1" />Archivieren
                    </Button>
                  </div>
                )}
                <Button variant="outline" onClick={() => setDetailPost(null)}>Schließen</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Beitrag deaktivieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Beitrag &quot;{deleteTarget?.title}&quot; wird deaktiviert und archiviert. Er bleibt im Archiv suchbar (DSGVO-konform).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deaktivieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}

// --- Sub Components ---

function PostList({
  posts,
  pinnedPosts,
  regularPosts,
  isLoading,
  onCreateNew,
  onEdit,
  onDelete,
  onTogglePin,
  onArchive,
  onViewDetail,
  isAuthorOrAdmin,
  isArchiveView = false,
  viewMode = "list",
  orgaCategories = [],
}: {
  posts: BulletinPost[]
  pinnedPosts: BulletinPost[]
  regularPosts: BulletinPost[]
  isLoading: boolean
  onCreateNew: () => void
  onEdit: (p: BulletinPost) => void
  onDelete: (p: BulletinPost) => void
  onTogglePin: (p: BulletinPost) => void
  onArchive: (p: BulletinPost) => void
  onViewDetail: (p: BulletinPost) => void
  isAuthorOrAdmin: (p: BulletinPost) => boolean
  isArchiveView?: boolean
  viewMode?: "list" | "grid"
  orgaCategories?: OrgaCategoryItem[]
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {isArchiveView ? (
            <>
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Archiv ist leer</h3>
              <p className="text-muted-foreground mt-1">Keine archivierten Beiträge vorhanden.</p>
            </>
          ) : (
            <>
              <Clipboard className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Noch keine Beiträge</h3>
              <p className="text-muted-foreground mt-1">Erstellen Sie den ersten Beitrag für Ihr Team.</p>
              <Button className="mt-4" onClick={onCreateNew}>
                <Plus className="h-4 w-4 mr-2" />Ersten Beitrag erstellen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const isGrid = viewMode === "grid"
  const gridClass = isGrid ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"

  return (
    <div className="space-y-4">
      {/* Pinned */}
      {pinnedPosts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Pin className="h-4 w-4" />Angeheftet ({pinnedPosts.length})
          </h3>
          <div className={gridClass}>
            {pinnedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onArchive={onArchive}
                onClick={() => onViewDetail(post)}
                canManage={isAuthorOrAdmin(post)}
                viewMode={viewMode}
                orgaCategories={orgaCategories}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular */}
      {regularPosts.length > 0 && (
        <div className="space-y-3">
          {pinnedPosts.length > 0 && (
            <h3 className="text-sm font-medium text-muted-foreground">
              Beiträge ({regularPosts.length})
            </h3>
          )}
          <div className={gridClass}>
            {regularPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onArchive={onArchive}
                onClick={() => onViewDetail(post)}
                canManage={isAuthorOrAdmin(post)}
                viewMode={viewMode}
                orgaCategories={orgaCategories}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PostCard({
  post,
  onEdit,
  onDelete,
  onTogglePin,
  onArchive,
  onClick,
  canManage,
  viewMode = "list",
  orgaCategories = [],
}: {
  post: BulletinPost
  onEdit: (p: BulletinPost) => void
  onDelete: (p: BulletinPost) => void
  onTogglePin: (p: BulletinPost) => void
  onArchive: (p: BulletinPost) => void
  onClick: () => void
  canManage: boolean
  viewMode?: "list" | "grid"
  orgaCategories?: OrgaCategoryItem[]
}) {
  const priorityConfig = PRIORITIES.find((p) => p.value === post.priority) || PRIORITIES[0]
  const isGrid = viewMode === "grid"

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${priorityConfig.bg} ${!post.is_read ? "border-l-4 border-l-primary" : ""} ${isGrid ? "flex flex-col h-full" : ""}`}
      onClick={onClick}
    >
      <CardHeader className={isGrid ? "pb-2 flex-1" : "pb-2"}>
        <div className={isGrid ? "space-y-2" : "flex items-start justify-between gap-4"}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{post.title}</CardTitle>
              {!post.is_read && <Badge className="text-xs">Neu</Badge>}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {post.is_pinned && (
                <Badge variant="secondary" className="text-xs"><Pin className="h-3 w-3 mr-1" />Angeheftet</Badge>
              )}
              <PriorityBadge priority={post.priority} />
              <CategoryBadge category={post.category} categories={orgaCategories} />
              {post.requires_confirmation && (
                <Badge variant="outline" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Bestätigung</Badge>
              )}
            </div>
            <CardDescription className={`flex items-center gap-3 mt-2 flex-wrap ${isGrid ? "text-xs" : ""}`}>
              <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.author_name}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.created_at)}</span>
              {!isGrid && (
                <>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.read_count} gelesen</span>
                  {post.visibility === "roles" && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{post.visible_roles?.length || 0} Rollen</span>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          {canManage && !isGrid && (
            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onTogglePin(post)} title={post.is_pinned ? "Lösen" : "Anpinnen"}>
                <Pin className={`h-4 w-4 ${post.is_pinned ? "text-primary" : ""}`} />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(post)} title="Bearbeiten">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onArchive(post)} title={post.is_archived ? "Wiederherstellen" : "Archivieren"}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDelete(post)} title="Deaktivieren">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className={isGrid ? "pt-0" : ""}>
        <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${isGrid ? "line-clamp-3" : "line-clamp-2"}`}>{post.content}</p>
        {canManage && isGrid && (
          <div className="flex items-center gap-1 mt-3 border-t pt-2" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onTogglePin(post)} title={post.is_pinned ? "Lösen" : "Anpinnen"}>
              <Pin className={`h-3.5 w-3.5 ${post.is_pinned ? "text-primary" : ""}`} />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(post)} title="Bearbeiten">
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onArchive(post)} title={post.is_archived ? "Wiederherstellen" : "Archivieren"}>
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDelete(post)} title="Deaktivieren">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  if (priority === "urgent") {
    return <Badge variant="destructive" className="text-xs"><Flame className="h-3 w-3 mr-1" />Dringend</Badge>
  }
  if (priority === "important") {
    return <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />Wichtig</Badge>
  }
  return null
}

function CategoryBadge({ category, categories = [] }: { category: string; categories?: OrgaCategoryItem[] }) {
  if (!category || category === "none") return null
  const cat = categories.find((c) => c.name === category)
  return (
    <Badge variant="secondary" className="text-xs">
      {cat && (
        <span className="inline-block h-2 w-2 rounded-full mr-1 flex-shrink-0" style={{ backgroundColor: cat.color || "#64748b" }} />
      )}
      {category}
    </Badge>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
