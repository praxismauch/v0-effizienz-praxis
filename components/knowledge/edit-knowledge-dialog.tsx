"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { usePractice } from "@/contexts/practice-context"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Users, User, Trash2 } from "lucide-react"
import { RichTextEditor } from "./rich-text-editor"

interface EditKnowledgeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: any
  onSuccess: () => void
  orgaCategories: Array<{ id: string; name: string; color: string }>
}

interface TeamMember {
  id: string
  name: string
  email?: string
  avatar_url?: string
  role?: string
}

export function EditKnowledgeDialog({
  open,
  onOpenChange,
  article,
  onSuccess,
  orgaCategories,
}: EditKnowledgeDialogProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    status: "draft",
    requires_confirmation: false,
    confirmation_required_for_team_ids: [] as string[],
    confirmation_required_for_member_ids: [] as string[],
  })
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)

  useEffect(() => {
    const fetchTeams = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/teams`)
        if (response.ok) {
          const data = await response.json()
          setTeams(data.teams || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching teams:", error)
      } finally {
        setLoadingTeams(false)
      }
    }

    const fetchTeamMembers = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(Array.isArray(data) ? data : data.teamMembers || data.members || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching team members:", error)
      } finally {
        setLoadingMembers(false)
      }
    }

    fetchTeams()
    fetchTeamMembers()
  }, [currentPractice?.id])

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title,
        content: article.content,
        category: article.category,
        status: article.status,
        requires_confirmation: article.requires_confirmation || false,
        confirmation_required_for_team_ids: article.confirmation_required_for_team_ids || [],
        confirmation_required_for_member_ids: article.confirmation_required_for_member_ids || [],
      })
      setTags(article.tags || [])
    }
  }, [article])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/knowledge-base/${article.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags,
          updated_by: currentUser?.id,
          version: article.version + 1,
          published_at:
            formData.status === "published" && article.status !== "published"
              ? new Date().toISOString()
              : article.published_at,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("[v0] Error updating article:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!article?.id) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/knowledge-base/${article.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setShowDeleteConfirm(false)
        onOpenChange(false)
        onSuccess()
      } else {
        console.error("[v0] Error deleting article:", await response.text())
      }
    } catch (error) {
      console.error("[v0] Error deleting article:", error)
    } finally {
      setIsDeleting(false)
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

  const safeOrgaCategories = orgaCategories || []

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const toggleMemberSelection = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      confirmation_required_for_member_ids: prev.confirmation_required_for_member_ids.includes(memberId)
        ? prev.confirmation_required_for_member_ids.filter((id) => id !== memberId)
        : [...prev.confirmation_required_for_member_ids, memberId],
    }))
  }

  const selectAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      confirmation_required_for_member_ids: teamMembers.map((m) => m.id),
    }))
  }

  const deselectAllMembers = () => {
    setFormData((prev) => ({
      ...prev,
      confirmation_required_for_member_ids: [],
    }))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("knowledge.editDialogTitle", "Artikel bearbeiten")}</DialogTitle>
            <DialogDescription>
              {t(
                "knowledge.editDialogDescription",
                "Bearbeiten Sie den Artikel. Die Versionsnummer wird automatisch erhöht.",
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("knowledge.titleLabel", "Titel")} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">{t("knowledge.categoryLabel", "Kategorie")} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("knowledge.selectCategoryPlaceholder", "Kategorie wählen")} />
                </SelectTrigger>
                <SelectContent>
                  {safeOrgaCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("knowledge.contentLabel", "Inhalt")} *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                articleTitle={formData.title}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">{t("knowledge.tagsLabel", "Tags")}</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  placeholder={t("knowledge.addTagPlaceholder", "Tag hinzufügen...")}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  {t("knowledge.addTagButton", "Hinzufügen")}
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
              <Label htmlFor="status">{t("knowledge.statusLabel", "Status")} *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("knowledge.statusDraft", "Entwurf")}</SelectItem>
                  <SelectItem value="published">{t("knowledge.statusPublished", "Veröffentlicht")}</SelectItem>
                  <SelectItem value="archived">{t("knowledge.statusArchived", "Archiviert")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requires_confirmation"
                  checked={formData.requires_confirmation}
                  onChange={(e) => setFormData({ ...formData, requires_confirmation: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="requires_confirmation" className="font-semibold">
                  Muss von Mitarbeitern gelesen werden
                </Label>
              </div>

              {formData.requires_confirmation && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <Label className="font-medium">Welche Teams müssen diesen Artikel lesen?</Label>
                    </div>
                    <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                      {loadingTeams ? (
                        <p className="text-sm text-muted-foreground">Teams werden geladen...</p>
                      ) : teams.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Keine Teams verfügbar. Bitte erstellen Sie Teams in den Einstellungen.
                        </p>
                      ) : (
                        teams.map((team) => (
                          <div key={team.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`team-${team.id}`}
                              checked={formData.confirmation_required_for_team_ids.includes(team.id)}
                              onCheckedChange={(checked) => {
                                const teamIds = checked
                                  ? [...formData.confirmation_required_for_team_ids, team.id]
                                  : formData.confirmation_required_for_team_ids.filter((id) => id !== team.id)
                                setFormData({ ...formData, confirmation_required_for_team_ids: teamIds })
                              }}
                            />
                            <Label htmlFor={`team-${team.id}`} className="font-normal cursor-pointer">
                              {team.name}
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <Label className="font-medium">Oder einzelne Mitarbeiter auswählen</Label>
                      </div>
                      {teamMembers.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={selectAllMembers}
                            className="h-7 text-xs"
                          >
                            Alle auswählen
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={deselectAllMembers}
                            className="h-7 text-xs"
                          >
                            Keine
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/30 max-h-48 overflow-y-auto">
                      {loadingMembers ? (
                        <p className="text-sm text-muted-foreground">Mitarbeiter werden geladen...</p>
                      ) : teamMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Keine Mitarbeiter verfügbar.</p>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                                formData.confirmation_required_for_member_ids.includes(member.id)
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:bg-muted"
                              }`}
                              onClick={() => toggleMemberSelection(member.id)}
                            >
                              <Checkbox
                                checked={formData.confirmation_required_for_member_ids.includes(member.id)}
                                onCheckedChange={() => toggleMemberSelection(member.id)}
                              />
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar_url || "/placeholder.svg"} alt={member.name} />
                                <AvatarFallback className="text-xs bg-primary/10">
                                  {getInitials(member.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{member.name}</p>
                                {member.role && <p className="text-xs text-muted-foreground truncate">{member.role}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.confirmation_required_for_member_ids.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {formData.confirmation_required_for_member_ids.length} Mitarbeiter ausgewählt
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="sm:mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("common.delete", "Löschen")}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.cancel", "Abbrechen")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t("common.saving", "Speichern...") : t("common.save", "Speichern")}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Artikel &quot;{article?.title}&quot; löschen möchten? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default EditKnowledgeDialog
