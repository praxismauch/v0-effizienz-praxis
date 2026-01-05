"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Pencil, Trash2, CheckCircle, AlertCircle } from "lucide-react"

interface KnowledgeViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  article: any
  onEdit: () => void
  onDelete: () => void
}

export function KnowledgeViewer({ open, onOpenChange, article, onEdit, onDelete }: KnowledgeViewerProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [hasConfirmed, setHasConfirmed] = useState(false)
  const [confirmations, setConfirmations] = useState<any[]>([])
  const [isConfirming, setIsConfirming] = useState(false)
  const [loadingConfirmations, setLoadingConfirmations] = useState(false)

  useEffect(() => {
    if (article?.requires_confirmation && open) {
      fetchConfirmations()
    }
  }, [article?.id, open])

  const fetchConfirmations = async () => {
    if (!article?.id) return

    setLoadingConfirmations(true)
    try {
      const response = await fetch(`/api/knowledge-base/${article.id}/confirmations`)
      if (response.ok) {
        const data = await response.json()
        setConfirmations(data.confirmations || [])
        // Check if current user has confirmed
        const userConfirmation = data.confirmations?.find((c: any) => c.user_id === currentUser?.id)
        setHasConfirmed(!!userConfirmation)
      }
    } catch (error) {
      console.error("[v0] Error fetching confirmations:", error)
    } finally {
      setLoadingConfirmations(false)
    }
  }

  const handleConfirm = async () => {
    if (!article?.id || !currentPractice?.id) return

    setIsConfirming(true)
    try {
      const response = await fetch(`/api/knowledge-base/${article.id}/confirmations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practice_id: currentPractice.id }),
      })

      if (response.ok) {
        setHasConfirmed(true)
        fetchConfirmations()
      }
    } catch (error) {
      console.error("[v0] Error confirming article:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{article.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {article.category} • Version {article.version}
              </DialogDescription>
            </div>
            <Badge>{article.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {article.requires_confirmation && (
            <Card className={`p-4 ${hasConfirmed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-start gap-3">
                {hasConfirmed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {hasConfirmed ? "Gelesen und verstanden" : "Lesebestätigung erforderlich"}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {hasConfirmed
                      ? "Sie haben bestätigt, dass Sie diesen Artikel gelesen und verstanden haben."
                      : "Dieser Artikel muss von allen Mitarbeitern gelesen und verstanden werden. Bitte bestätigen Sie nach dem Lesen."}
                  </p>
                  {!hasConfirmed && (
                    <Button size="sm" onClick={handleConfirm} disabled={isConfirming}>
                      {isConfirming ? "Wird bestätigt..." : "Ich habe gelesen und verstanden"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{article.content}</p>
          </div>

          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag: string, idx: number) => (
                <Badge key={idx} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {article.requires_confirmation && currentUser?.role === "admin" && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-sm mb-3">Bestätigungen ({confirmations.length})</h4>
              {loadingConfirmations ? (
                <p className="text-sm text-muted-foreground">Lade Bestätigungen...</p>
              ) : confirmations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Bestätigungen vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {confirmations.map((confirmation) => (
                    <div key={confirmation.user_id} className="flex items-center justify-between text-sm">
                      <span>{confirmation.user_name}</span>
                      <span className="text-muted-foreground">
                        {new Date(confirmation.confirmed_at).toLocaleString("de-DE")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>Erstellt: {new Date(article.created_at).toLocaleString("de-DE")}</p>
            <p>Aktualisiert: {new Date(article.updated_at).toLocaleString("de-DE")}</p>
            {article.published_at && <p>Veröffentlicht: {new Date(article.published_at).toLocaleString("de-DE")}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </Button>
          <Button onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Bearbeiten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
