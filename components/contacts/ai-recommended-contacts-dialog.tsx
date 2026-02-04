"use client"

import { useState } from "react"
import { Sparkles, Phone, MapPin, Building2, Loader2, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface RecommendedContact {
  id: string
  category: string
  name: string
  phone: string
  address?: string
  description?: string
  radius?: string
  selected: boolean
}

interface AIRecommendedContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const CATEGORY_COLORS: Record<string, string> = {
  "Notfall": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "Berufsgenossenschaft": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "Giftnotruf": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "Kassenärztliche Vereinigung": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "Gesundheitsamt": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "Klinik": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "Apotheke": "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  "Facharzt": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "Pflegedienst": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  "Sozialdienst": "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  "Ärztekammer": "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
}

export default function AIRecommendedContactsDialog({
  open,
  onOpenChange,
  onSuccess,
}: AIRecommendedContactsDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [contacts, setContacts] = useState<RecommendedContact[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)

  const practiceId = currentPractice?.id?.toString()

  const generateRecommendations = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/contacts/recommended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId,
          bundesland: currentPractice?.bundesland || "Bayern",
          address: currentPractice?.street 
            ? `${currentPractice.street}, ${currentPractice.zip_code || ""} ${currentPractice.city || ""}`
            : currentPractice?.city || "",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate recommendations")
      }

      const data = await response.json()
      setContacts(data.contacts.map((c: any, index: number) => ({
        ...c,
        id: `rec-${index}`,
        selected: true,
      })))
      setHasGenerated(true)
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Empfehlungen konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleContact = (id: string) => {
    setContacts(contacts.map((c) => 
      c.id === id ? { ...c, selected: !c.selected } : c
    ))
  }

  const selectAll = () => {
    setContacts(contacts.map((c) => ({ ...c, selected: true })))
  }

  const deselectAll = () => {
    setContacts(contacts.map((c) => ({ ...c, selected: false })))
  }

  const selectedCount = contacts.filter((c) => c.selected).length

  const saveSelectedContacts = async () => {
    const selectedContacts = contacts.filter((c) => c.selected)
    if (selectedContacts.length === 0) {
      toast({
        title: "Hinweis",
        description: "Bitte wählen Sie mindestens einen Kontakt aus",
      })
      return
    }

    if (!practiceId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: selectedContacts.map((c) => ({
            company: c.name,
            last_name: c.category,
            phone: c.phone,
            street: c.address?.split(",")[0]?.trim() || null,
            city: c.address?.split(",")[1]?.trim() || null,
            category: "Partner",
            notes: c.description || `${c.category} - ${c.radius || ""}`,
            ai_extracted: true,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save contacts")
      }

      toast({
        title: "Erfolg",
        description: `${selectedContacts.length} Kontakte wurden hinzugefügt`,
      })

      onOpenChange(false)
      setContacts([])
      setHasGenerated(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Kontakte konnten nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setContacts([])
    setHasGenerated(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Empfohlene Kontakte
          </DialogTitle>
          <DialogDescription>
            Basierend auf dem Bundesland ({currentPractice?.bundesland || "nicht gesetzt"}) und dem Standort Ihrer Praxis 
            werden relevante Notfall- und Partnerkontakte vorgeschlagen.
          </DialogDescription>
        </DialogHeader>

        {!hasGenerated ? (
          <div className="py-12 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Kontaktempfehlungen generieren</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Klicken Sie auf den Button, um eine Liste empfohlener Kontakte basierend auf Ihrem Bundesland 
              und Praxisstandort zu erhalten.
            </p>
            <Button onClick={generateRecommendations} disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere Empfehlungen...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Empfehlungen generieren
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedCount} von {contacts.length} ausgewählt</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  Alle auswählen
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  Keine auswählen
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      contact.selected 
                        ? "bg-primary/5 border-primary/30" 
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleContact(contact.id)}
                  >
                    <Checkbox 
                      checked={contact.selected} 
                      onCheckedChange={() => toggleContact(contact.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{contact.name}</p>
                          {contact.description && (
                            <p className="text-sm text-muted-foreground">{contact.description}</p>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={CATEGORY_COLORS[contact.category] || ""}
                        >
                          {contact.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{contact.phone}</span>
                        </div>
                        {contact.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">{contact.address}</span>
                          </div>
                        )}
                        {contact.radius && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5" />
                            <span>{contact.radius}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          {hasGenerated && (
            <Button onClick={saveSelectedContacts} disabled={saving || selectedCount === 0}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Speichere...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {selectedCount} Kontakte hinzufügen
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
