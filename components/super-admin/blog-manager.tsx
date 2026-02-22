"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  Sparkles,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Lightbulb,
  BookOpen,
  ExternalLink,
  RefreshCw,
  Wand2,
  FileText,
  Copy,
} from "lucide-react"
import BlogPostEditor from "@/components/blog-post-editor"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author_name: string
  published_at: string
  created_at: string
  is_published: boolean
  tags: string[]
  seo_title?: string
  seo_description?: string
  featured_image_url?: string
}

interface TopicSuggestion {
  topic: string
  category: string
  description: string
}

const CATEGORIES = [
  "Best Practices",
  "Digitalisierung",
  "Praxismanagement",
  "Qualitaetsmanagement",
  "Teamfuehrung",
  "Patientenzufriedenheit",
  "Effizienz",
  "Recht & Compliance",
]

const TONES = [
  { value: "professional", label: "Professionell" },
  { value: "informative", label: "Informativ" },
  { value: "practical", label: "Praxisnah" },
]

const LENGTHS = [
  { value: "short", label: "Kurz (~500 Woerter)" },
  { value: "medium", label: "Mittel (~1000 Woerter)" },
  { value: "long", label: "Lang (~2000 Woerter)" },
]

export default function BlogManager() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  // AI generation state
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genTopic, setGenTopic] = useState("")
  const [genCategory, setGenCategory] = useState("Best Practices")
  const [genTone, setGenTone] = useState("professional")
  const [genLength, setGenLength] = useState("medium")
  const [genKeywords, setGenKeywords] = useState("")
  const [generatedPost, setGeneratedPost] = useState<any>(null)
  const [previewHtml, setPreviewHtml] = useState("")

  // Topic suggestions
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<TopicSuggestion[]>([])

  const fetchPosts = useCallback(async () => {
    try {
      const response = await fetch("/api/blog-posts")
      const data = await response.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error("Error fetching blog posts:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const handleTogglePublish = async (post: BlogPost) => {
    const newStatus = !post.is_published
    // Optimistic update
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: newStatus } : p)))
    try {
      const response = await fetch(`/api/blog-posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...post,
          is_published: newStatus,
          published_at: newStatus ? new Date().toISOString() : null,
        }),
      })
      if (!response.ok) throw new Error("Failed")
      toast({
        title: newStatus ? "Veröffentlicht" : "Entwurf",
        description: newStatus ? "Blog-Post ist jetzt live." : "Blog-Post ist jetzt ein Entwurf.",
      })
    } catch {
      // Revert
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, is_published: !newStatus } : p)))
      toast({ title: "Fehler", description: "Status konnte nicht geaendert werden.", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!postToDelete) return
    try {
      const response = await fetch(`/api/blog-posts/${postToDelete}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed")
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete))
      toast({ title: "Geloescht", description: "Blog-Post wurde geloescht." })
    } catch {
      toast({ title: "Fehler", description: "Blog-Post konnte nicht geloescht werden.", variant: "destructive" })
    } finally {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    }
  }

  const handleGeneratePost = async () => {
    if (!genTopic.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie ein Thema ein.", variant: "destructive" })
      return
    }
    setGenerating(true)
    setGeneratedPost(null)
    setPreviewHtml("")

    try {
      const response = await fetch("/api/super-admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: genTopic,
          category: genCategory,
          tone: genTone,
          targetLength: genLength,
          keywords: genKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || "Generation fehlgeschlagen")
      }

      const data = await response.json()
      setGeneratedPost(data)
      setPreviewHtml(data.content || "")
      toast({ title: "Generiert", description: "Blog-Post wurde erfolgreich generiert." })
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveGenerated = async () => {
    if (!generatedPost) return
    setGenerating(true)

    try {
      const response = await fetch("/api/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedPost.title,
          slug: generatedPost.slug,
          excerpt: generatedPost.excerpt,
          content: generatedPost.content,
          category: generatedPost.category || genCategory,
          tags: generatedPost.tags || [],
          seo_title: generatedPost.seo_title,
          seo_description: generatedPost.seo_description,
          is_published: false,
        }),
      })

      if (!response.ok) throw new Error("Speichern fehlgeschlagen")

      toast({ title: "Gespeichert", description: "Blog-Post als Entwurf gespeichert." })
      setGenerateOpen(false)
      setGeneratedPost(null)
      setGenTopic("")
      setGenKeywords("")
      fetchPosts()
    } catch (error: any) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const handleFetchSuggestions = async () => {
    setLoadingSuggestions(true)
    try {
      const response = await fetch("/api/super-admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suggest-topics" }),
      })
      if (!response.ok) throw new Error("Failed")
      const data = await response.json()
      setSuggestions(data.suggestions || [])
    } catch {
      toast({ title: "Fehler", description: "Themenvorschlaege konnten nicht geladen werden.", variant: "destructive" })
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleUseSuggestion = (suggestion: TopicSuggestion) => {
    setGenTopic(suggestion.topic)
    setGenCategory(suggestion.category)
    setSuggestionsOpen(false)
    setGenerateOpen(true)
  }

  const publishedCount = posts.filter((p) => p.is_published).length
  const draftCount = posts.filter((p) => !p.is_published).length

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-sm text-muted-foreground">Gesamt</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Eye className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedCount}</p>
              <p className="text-sm text-muted-foreground">Veröffentlicht</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <EyeOff className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{draftCount}</p>
              <p className="text-sm text-muted-foreground">Entwuerfe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => {
            setSuggestionsOpen(true)
            if (suggestions.length === 0) handleFetchSuggestions()
          }}
          variant="outline"
          className="gap-2"
        >
          <Lightbulb className="h-4 w-4" />
          KI-Themenvorschlaege
        </Button>
        <Button
          onClick={() => {
            setGeneratedPost(null)
            setPreviewHtml("")
            setGenerateOpen(true)
          }}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          KI Blog-Post generieren
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setEditingPost(null)
            setEditorOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Manuell erstellen
        </Button>
      </div>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Blog-Posts
          </CardTitle>
          <CardDescription>Verwalten Sie Ihre Insights & Best Practices Artikel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Noch keine Blog-Posts</h3>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie Ihren ersten Blog-Post mit KI-Unterstützung.
              </p>
              <Button onClick={() => setGenerateOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Ersten Post generieren
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{post.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={post.is_published}
                          onCheckedChange={() => handleTogglePublish(post)}
                          aria-label={post.is_published ? "Unpublish" : "Publish"}
                        />
                        <span className="text-sm">{post.is_published ? "Live" : "Entwurf"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(post.published_at || post.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingPost(post)
                            setEditorOpen(true)
                          }}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                          title="Vorschau"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPostToDelete(post.id)
                            setDeleteDialogOpen(true)
                          }}
                          title="Löschen"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* AI Topic Suggestions Dialog */}
      <Dialog open={suggestionsOpen} onOpenChange={setSuggestionsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              KI-Themenvorschlaege
            </DialogTitle>
            <DialogDescription>
              Lassen Sie die KI passende Blog-Themen vorschlagen, basierend auf Ihren bestehenden Inhalten.
            </DialogDescription>
          </DialogHeader>

          {loadingSuggestions ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Themen werden analysiert...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Keine Vorschläge verfügbar.</p>
              <Button onClick={handleFetchSuggestions} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Erneut versuchen
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {suggestions.map((s, i) => (
                <Card
                  key={i}
                  className="cursor-pointer transition-colors hover:bg-accent/50"
                  onClick={() => handleUseSuggestion(s)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{s.topic}</p>
                        <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {s.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button onClick={handleFetchSuggestions} variant="ghost" className="gap-2 mt-2">
                <RefreshCw className="h-4 w-4" />
                Neue Vorschlaege laden
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              KI Blog-Post generieren
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie das Thema und die KI erstellt einen professionellen Blog-Post.
            </DialogDescription>
          </DialogHeader>

          {!generatedPost ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gen-topic">Thema *</Label>
                <Textarea
                  id="gen-topic"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="z.B. Wie digitale Checklisten die QM-Dokumentation in Arztpraxen revolutionieren"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={genCategory} onValueChange={setGenCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ton</Label>
                  <Select value={genTone} onValueChange={setGenTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Laenge</Label>
                  <Select value={genLength} onValueChange={setGenLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gen-keywords">Keywords (optional, kommagetrennt)</Label>
                <Input
                  id="gen-keywords"
                  value={genKeywords}
                  onChange={(e) => setGenKeywords(e.target.value)}
                  placeholder="Praxismanagement, Digitalisierung, QM"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setGenerateOpen(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleGeneratePost} disabled={generating || !genTopic.trim()} className="gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Wird generiert...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generieren
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Generated Post Preview */}
              <div className="rounded-lg border bg-card">
                <div className="border-b p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{generatedPost.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{generatedPost.excerpt}</p>
                    </div>
                    <Badge variant="secondary">{generatedPost.category || genCategory}</Badge>
                  </div>
                  {generatedPost.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {generatedPost.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 max-h-96 overflow-y-auto">
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>

                {(generatedPost.seo_title || generatedPost.seo_description) && (
                  <div className="border-t p-4 bg-muted/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">SEO-Vorschau</p>
                    <p className="text-sm font-medium text-primary">{generatedPost.seo_title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{generatedPost.seo_description}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedPost(null)
                    setPreviewHtml("")
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Neu generieren
                </Button>
                <Button onClick={handleSaveGenerated} disabled={generating} className="gap-2">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Als Entwurf speichern
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Blog Post Editor Dialog (manual edit) */}
      <BlogPostEditor
        post={editingPost}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={fetchPosts}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Blog-Post löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rueckgaengig gemacht werden. Der Blog-Post wird dauerhaft geloescht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
