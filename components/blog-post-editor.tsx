"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { X, Sparkles, Loader2, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BlogPost {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  featured_image_url?: string
  is_published: boolean
  tags: string[]
  seo_title?: string
  seo_description?: string
}

interface BlogPostEditorProps {
  post?: BlogPost | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

function BlogPostEditor({ post, open, onOpenChange, onSave }: BlogPostEditorProps) {
  const [formData, setFormData] = useState<BlogPost>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    is_published: false,
    tags: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [contentTab, setContentTab] = useState<string>("edit")

  useEffect(() => {
    if (post) {
      setFormData(post)
    } else {
      setFormData({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category: "",
        is_published: false,
        tags: [],
      })
    }
  }, [post, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = post?.id ? `/api/blog-posts/${post.id}` : "/api/blog-posts"
      const method = post?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to save blog post")
      }

      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving blog post:", error)
      alert("Fehler beim Speichern des Blog-Posts")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) })
  }

  const handleAIImprove = async () => {
    if (!formData.content.trim()) return
    setImproving(true)
    try {
      const response = await fetch("/api/super-admin/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Verbessere und optimiere den folgenden Blog-Post-Inhalt. Behalte die Kernaussagen bei, verbessere Stil, Struktur und SEO: ${formData.content.substring(0, 500)}`,
          category: formData.category || "Best Practices",
          tone: "professional",
          targetLength: "medium",
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          setFormData((prev) => ({
            ...prev,
            content: data.content,
            seo_title: data.seo_title || prev.seo_title,
            seo_description: data.seo_description || prev.seo_description,
          }))
        }
      }
    } catch (error) {
      console.error("AI improve failed:", error)
    } finally {
      setImproving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Blog-Post bearbeiten" : "Neuer Blog-Post"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="wird-automatisch-generiert"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategorie *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="z.B. Best Practices, Analytics, Digitalisierung"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Kurzbeschreibung *</Label>
            <Textarea
              id="excerpt"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Inhalt (HTML) *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIImprove}
                disabled={improving || !formData.content.trim()}
                className="gap-1.5"
              >
                {improving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Wird verbessert...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    KI verbessern
                  </>
                )}
              </Button>
            </div>
            <Tabs value={contentTab} onValueChange={setContentTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="edit">Editor</TabsTrigger>
                <TabsTrigger value="preview" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Vorschau
                </TabsTrigger>
              </TabsList>
              <TabsContent value="edit" className="mt-2">
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                  required
                />
              </TabsContent>
              <TabsContent value="preview" className="mt-2">
                <div
                  className="min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border p-4 prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: formData.content || "<p class='text-muted-foreground'>Keine Vorschau verfügbar</p>" }}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured_image_url">Bild-URL</Label>
            <Input
              id="featured_image_url"
              type="url"
              value={formData.featured_image_url || ""}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Tag hinzufügen"
              />
              <Button type="button" onClick={addTag}>
                Hinzufügen
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <div
                  key={tag}
                  className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-primary/70">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO-Titel</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ""}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="SEO-optimierter Seitentitel (max 60 Zeichen)"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">Meta-Description</Label>
              <Input
                id="seo_description"
                value={formData.seo_description || ""}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Meta-Beschreibung (max 155 Zeichen)"
                maxLength={155}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="is_published"
              checked={formData.is_published}
              onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
            />
            <Label htmlFor="is_published">Veröffentlicht</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BlogPostEditor
