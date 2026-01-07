"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"

interface CreateKnowledgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateKnowledgeDialog({ open, onOpenChange, onSuccess }: CreateKnowledgeDialogProps) {
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { t } = useTranslation()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    status: "published",
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orgaCategories, setOrgaCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    const fetchOrgaCategories = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          const categories = data.categories || []
          const seen = new Set<string>()
          const uniqueCategories = categories.filter((cat: any) => {
            const key = cat.name?.toLowerCase()?.trim()
            if (key && !seen.has(key)) {
              seen.add(key)
              return true
            }
            return false
          })
          setOrgaCategories(uniqueCategories)
        }
      } catch (error) {
        console.error("[v0] Error fetching orga categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    if (open) {
      fetchOrgaCategories()
    }
  }, [currentPractice?.id, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags,
          practice_id: currentPractice?.id,
          created_by: currentUser?.id,
          published_at: formData.status === "published" ? new Date().toISOString() : null,
        }),
      })

      if (response.ok) {
        const newArticle = await response.json()
        toast({
          title: "Artikel erstellt",
          description:
            formData.status === "published"
              ? "Der Artikel wurde veröffentlicht und ist im Handbuch sichtbar."
              : "Der Artikel wurde als Entwurf gespeichert.",
        })
        setFormData({ title: "", content: "", category: "", status: "published" })
        setTags([])
        onOpenChange(false)
        setTimeout(() => {
          onSuccess()
        }, 100)
      } else {
        const error = await response.json()
        toast({
          title: "Fehler",
          description: error.error || "Der Artikel konnte nicht erstellt werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error creating article:", error)
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("knowledge.createDialog.title", "Neuer Artikel")}</DialogTitle>
          <DialogDescription>
            {t("knowledge.createDialog.description", "Erstellen Sie einen neuen Artikel für die QM-Dokumentation.")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("knowledge.createDialog.titleLabel", "Titel *")}</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t("knowledge.createDialog.categoryLabel", "Kategorie *")}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              required
              disabled={loadingCategories}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingCategories
                      ? "Kategorien werden geladen..."
                      : t("knowledge.createDialog.categoryPlaceholder", "Kategorie wählen")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {orgaCategories.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Kategorien verfügbar</div>
                ) : (
                  orgaCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">{t("knowledge.createDialog.contentLabel", "Inhalt *")}</Label>
            <RichTextEditor content={formData.content} onChange={(content) => setFormData({ ...formData, content })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{t("knowledge.createDialog.tagsLabel", "Tags")}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                placeholder={t("knowledge.createDialog.tagPlaceholder", "Tag hinzufügen...")}
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                {t("knowledge.createDialog.addTagButton", "Hinzufügen")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("knowledge.createDialog.statusLabel", "Status *")}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">
                  {t("knowledge.createDialog.statusPublished", "Veröffentlicht")}
                </SelectItem>
                <SelectItem value="draft">{t("knowledge.createDialog.statusDraft", "Entwurf")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.status === "published"
                ? "Der Artikel wird sofort im Praxis Handbuch sichtbar sein."
                : "Entwürfe sind nur im Tab 'Entwürfe' sichtbar, nicht im Handbuch."}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("common.creating", "Wird erstellt...") : t("common.create", "Erstellen")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateKnowledgeDialog
