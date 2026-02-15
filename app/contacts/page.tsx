"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Plus, Upload, Search, Phone, Sparkles, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { useToast } from "@/hooks/use-toast"
import CreateContactDialog from "@/components/contacts/create-contact-dialog"
import EditContactDialog from "@/components/contacts/edit-contact-dialog"
import AIContactExtractorDialog from "@/components/contacts/ai-contact-extractor-dialog"
import AIContactSearchDialog from "@/components/contacts/ai-contact-search-dialog"
import AIRecommendedContactsDialog from "@/components/contacts/ai-recommended-contacts-dialog"
import BatchImportContactsDialog from "@/components/contacts/batch-import-contacts-dialog"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
import type { Contact, VisibleColumns } from "./contact-types"
import { ContactsToolbar } from "./components/contacts-toolbar"
import { ContactsTable } from "./components/contacts-table"

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showAISearchDialog, setShowAISearchDialog] = useState(false)
  const [showRecommendedDialog, setShowRecommendedDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>({
    name: true,
    company: true,
    contact: true,
    address: true,
    category: true,
  })
  const { toast } = useToast()

  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { teamMembers, loading: teamLoading } = useTeam()

  const hasLoadedRef = useRef(false)
  const loadingPracticeIdRef = useRef<string | null>(null)
  const practiceId = currentPractice?.id?.toString()

  const loadContacts = useCallback(async () => {
    if (!practiceId) return
    if (loadingPracticeIdRef.current === practiceId && hasLoadedRef.current) return
    loadingPracticeIdRef.current = practiceId

    try {
      setLoading(true)
      const response = await fetch(`/api/practices/${practiceId}/contacts`)
      if (!response.ok) throw new Error("Failed to fetch contacts")
      const data = await response.json()
      const activeContacts = data.filter((c: Contact & { deleted_at?: string }) => !c.deleted_at)
      setContacts(activeContacts)
      hasLoadedRef.current = true
    } catch {
      toast({ title: "Fehler", description: "Kontakte konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [practiceId, toast])

  useEffect(() => {
    if (practiceLoading || userLoading) return
    if (!practiceId) { setLoading(false); return }
    loadContacts()
  }, [practiceId, practiceLoading, userLoading, loadContacts])

  const handleReload = useCallback(async () => {
    hasLoadedRef.current = false
    loadingPracticeIdRef.current = null
    if (practiceId) {
      try {
        setLoading(true)
        const response = await fetch(`/api/practices/${practiceId}/contacts`)
        if (!response.ok) throw new Error("Failed to fetch contacts")
        const data = await response.json()
        const activeContacts = data.filter((c: Contact & { deleted_at?: string }) => !c.deleted_at)
        setContacts(activeContacts)
        hasLoadedRef.current = true
        loadingPracticeIdRef.current = practiceId
      } catch {
        toast({ title: "Fehler", description: "Kontakte konnten nicht aktualisiert werden", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
  }, [practiceId, toast])

  async function toggleFavorite(contact: Contact) {
    if (!practiceId || contact.id.startsWith("team-")) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: contact.id, action: "toggle_favorite" }),
      })
      if (!response.ok) throw new Error("Failed to toggle favorite")
      const updatedContact = await response.json()
      setContacts((prev) => prev.map((c) => (c.id === contact.id ? { ...c, is_favorite: updatedContact.is_favorite } : c)))
      toast({ title: updatedContact.is_favorite ? "Als Favorit markiert" : "Favorit entfernt", description: `${contact.first_name || ""} ${contact.last_name}` })
    } catch {
      toast({ title: "Fehler", description: "Favorit konnte nicht geändert werden", variant: "destructive" })
    }
  }

  async function confirmDelete() {
    if (!contactToDelete || !practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts?id=${contactToDelete.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete contact")
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id))
      toast({ title: "Erfolg", description: "Kontakt wurde gelöscht" })
    } catch {
      toast({ title: "Fehler", description: "Kontakt konnte nicht gelöscht werden", variant: "destructive" })
    } finally {
      setContactToDelete(null)
    }
  }

  const teamContactsFromMembers: Contact[] = useMemo(() => {
    return teamMembers.map((member) => ({
      id: `team-${member.id}`,
      salutation: null,
      title: null,
      first_name: member.first_name || member.name?.split(" ")[0] || null,
      last_name: member.last_name || member.name?.split(" ").slice(1).join(" ") || member.name || "",
      company: currentPractice?.name || "Praxis",
      position: member.role || null,
      email: member.email || null,
      phone: member.phone || null,
      mobile: member.mobile || null,
      street: null,
      house_number: null,
      postal_code: null,
      city: null,
      category: "Team",
      image_url: member.avatar || null,
      ai_extracted: false,
      is_active: true,
      created_at: new Date().toISOString(),
      contact_person: null,
      direct_phone: null,
      availability: null,
    })) as Contact[]
  }, [teamMembers, currentPractice?.name])

  const filteredContacts = useMemo(() => {
    const allContacts = [...teamContactsFromMembers, ...contacts]
    const search = searchQuery.toLowerCase()
    return allContacts.filter((contact) => {
      if (showOnlyFavorites && !contact.is_favorite) return false
      return (
        contact.first_name?.toLowerCase().includes(search) ||
        contact.last_name.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.category?.toLowerCase().includes(search)
      )
    })
  }, [contacts, teamContactsFromMembers, searchQuery, showOnlyFavorites])

  const favoritesCount = useMemo(() => contacts.filter((c) => c.is_favorite).length, [contacts])

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Kontakte"
          subtitle="Verwalten Sie Ihre Praxiskontakte"
          actions={
            <div className="flex gap-2">
              <Button
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => setShowAIDialog(true)}
              >
                <Sparkles className="h-4 w-4" />
                KI-Extraktion
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Neuer Kontakt
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowAISearchDialog(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    KI-Suche
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowRecommendedDialog(true)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Empfohlene Nummern
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowBatchDialog(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Batch Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <ContactsToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                showOnlyFavorites={showOnlyFavorites}
                onToggleFavorites={() => setShowOnlyFavorites(!showOnlyFavorites)}
                favoritesCount={favoritesCount}
                totalCount={filteredContacts.length}
                visibleColumns={visibleColumns}
                onVisibleColumnsChange={setVisibleColumns}
              />
            </CardHeader>
            <CardContent>
              <ContactsTable
                contacts={filteredContacts}
                visibleColumns={visibleColumns}
                loading={loading}
                onToggleFavorite={toggleFavorite}
              />
            </CardContent>
          </Card>

          <CreateContactDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleReload} />
          {selectedContact && (
            <EditContactDialog open={showEditDialog} onOpenChange={setShowEditDialog} contact={selectedContact} onSuccess={handleReload} />
          )}
          <AIContactExtractorDialog open={showAIDialog} onOpenChange={setShowAIDialog} onSuccess={handleReload} />
          <AIContactSearchDialog open={showAISearchDialog} onOpenChange={setShowAISearchDialog} onSuccess={handleReload} />
          <AIRecommendedContactsDialog open={showRecommendedDialog} onOpenChange={setShowRecommendedDialog} onSuccess={handleReload} />
          <BatchImportContactsDialog open={showBatchDialog} onOpenChange={setShowBatchDialog} onSuccess={handleReload} />

          <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kontakt löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie den Kontakt "{contactToDelete?.first_name} {contactToDelete?.last_name}" wirklich löschen?
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </AppLayout>
  )
}
