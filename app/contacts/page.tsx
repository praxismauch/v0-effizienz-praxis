"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Upload, Search, Mail, Phone, Building2, Trash2, Edit, Sparkles, Settings2, Users, Star, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import CreateContactDialog from "@/components/contacts/create-contact-dialog"
import EditContactDialog from "@/components/contacts/edit-contact-dialog"
import AIContactExtractorDialog from "@/components/contacts/ai-contact-extractor-dialog"
import AIContactSearchDialog from "@/components/contacts/ai-contact-search-dialog"
import AIRecommendedContactsDialog from "@/components/contacts/ai-recommended-contacts-dialog"
import BatchImportContactsDialog from "@/components/contacts/batch-import-contacts-dialog"
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTeam } from "@/contexts/team-context"
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

interface Contact {
  id: string
  salutation: string | null
  title: string | null
  first_name: string | null
  last_name: string
  company: string | null
  position: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  category: string | null
  image_url: string | null
  ai_extracted: boolean
  is_active: boolean
  is_favorite?: boolean
  created_at: string
  contact_person: string | null
  direct_phone: string | null
  availability: string | null
}



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
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    company: true,
    contact: true,
    address: true,
    category: true,
  })
  const { toast } = useToast()
  const router = useRouter()

  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { teamMembers, loading: teamLoading } = useTeam()

  const hasLoadedRef = useRef(false)
  const loadingPracticeIdRef = useRef<string | null>(null)

  const practiceId = currentPractice?.id?.toString()

  const loadContacts = useCallback(async () => {
    if (!practiceId) return

    // Prevent duplicate loads for same practice
    if (loadingPracticeIdRef.current === practiceId && hasLoadedRef.current) return
    loadingPracticeIdRef.current = practiceId

    try {
      setLoading(true)

      const response = await fetch(`/api/practices/${practiceId}/contacts`)

      if (!response.ok) {
        throw new Error("Failed to fetch contacts")
      }

      const data = await response.json()
      const activeContacts = data.filter((c: Contact & { deleted_at?: string }) => !c.deleted_at)
      setContacts(activeContacts)
      hasLoadedRef.current = true
    } catch (error: any) {
      console.error("[v0] Error loading contacts:", error)
      toast({
        title: "Fehler",
        description: "Kontakte konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [practiceId, toast])

  useEffect(() => {
    if (practiceLoading || userLoading) return
    if (!practiceId) {
      setLoading(false)
      return
    }
    loadContacts()
  }, [practiceId, practiceLoading, userLoading, loadContacts])

  const handleReload = useCallback(async () => {
    hasLoadedRef.current = false
    loadingPracticeIdRef.current = null
    if (practiceId) {
      try {
        setLoading(true)
        const response = await fetch(`/api/practices/${practiceId}/contacts`)
        if (!response.ok) {
          throw new Error("Failed to fetch contacts")
        }
        const data = await response.json()
        const activeContacts = data.filter((c: Contact & { deleted_at?: string }) => !c.deleted_at)
        setContacts(activeContacts)
        hasLoadedRef.current = true
        loadingPracticeIdRef.current = practiceId
      } catch (error: any) {
        console.error("[v0] Error reloading contacts:", error)
        toast({
          title: "Fehler",
          description: "Kontakte konnten nicht aktualisiert werden",
          variant: "destructive",
        })
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

      if (!response.ok) {
        throw new Error("Failed to toggle favorite")
      }

      const updatedContact = await response.json()
      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, is_favorite: updatedContact.is_favorite } : c))
      )

      toast({
        title: updatedContact.is_favorite ? "Als Favorit markiert" : "Favorit entfernt",
        description: `${contact.first_name || ""} ${contact.last_name}`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Favorit konnte nicht geändert werden",
        variant: "destructive",
      })
    }
  }

  async function confirmDelete() {
    if (!contactToDelete || !practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/contacts?id=${contactToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete contact")
      }

      setContacts((prevContacts) => prevContacts.filter((c) => c.id !== contactToDelete.id))

      toast({
        title: "Erfolg",
        description: "Kontakt wurde gelöscht",
      })
      // Reload is no longer needed since we update state directly, but keep for sync
      // handleReload()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Kontakt konnte nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setContactToDelete(null)
    }
  }

  // Convert team members to contact format
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
      isTeamMember: true,
    })) as (Contact & { isTeamMember?: boolean })[]
  }, [teamMembers, currentPractice?.name])

  // Merge contacts with team members and filter
  const filteredContacts = useMemo(() => {
    const allContacts = [...teamContactsFromMembers, ...contacts]
    const search = searchQuery.toLowerCase()
    return allContacts.filter((contact) => {
      // Filter by favorites if enabled
      if (showOnlyFavorites && !contact.is_favorite) return false
      
      // Search filter
      return (
        contact.first_name?.toLowerCase().includes(search) ||
        contact.last_name.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search) ||
        contact.email?.toLowerCase().includes(search) ||
        contact.category?.toLowerCase().includes(search)
      )
    })
  }, [contacts, teamContactsFromMembers, searchQuery, showOnlyFavorites])

  // Count favorites
  const favoritesCount = useMemo(() => {
    return contacts.filter((c) => c.is_favorite).length
  }, [contacts])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Kontakte</h1>
            <p className="text-muted-foreground">Verwalten Sie Ihre Praxiskontakte</p>
          </div>
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
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Kontakte durchsuchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant={showOnlyFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={showOnlyFavorites ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
                >
                  <Star className={`h-4 w-4 mr-1 ${showOnlyFavorites ? "fill-current" : ""}`} />
                  Favoriten {favoritesCount > 0 && `(${favoritesCount})`}
                </Button>
                <Badge variant="secondary">{filteredContacts.length} Kontakte</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Spalten anzeigen</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.name}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, name: checked }))
                      }
                    >
                      Name
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.company}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, company: checked }))
                      }
                    >
                      Firma
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.contact}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, contact: checked }))
                      }
                    >
                      Kontakt
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.address}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, address: checked }))
                      }
                    >
                      Adresse
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.category}
                      onCheckedChange={(checked) =>
                        setVisibleColumns((prev) => ({ ...prev, category: checked }))
                      }
                    >
                      Kategorie
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Lädt...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Kontakte gefunden</div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {visibleColumns.company && <TableHead className="min-w-[140px]">Firma</TableHead>}
                        {visibleColumns.name && <TableHead className="min-w-[180px]">Name</TableHead>}
                        {visibleColumns.contact && <TableHead className="min-w-[180px]">Kontakt</TableHead>}
                        {visibleColumns.address && <TableHead className="min-w-[160px]">Adresse</TableHead>}
                        {visibleColumns.category && <TableHead className="min-w-[100px]">Kategorie</TableHead>}
                        <TableHead className="text-right min-w-[100px]">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((contact) => (
<TableRow
                          key={contact.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (!contact.id.startsWith("team-")) {
                              router.push(`/contacts/${contact.id}`)
                            }
                          }}
                        >
                                          {visibleColumns.company && (
                                            <TableCell>
                                              {contact.company && (
                                                <div className="flex items-center gap-2">
                                                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                  <span className="truncate max-w-[120px]">{contact.company}</span>
                                                </div>
                                              )}
                                            </TableCell>
                                          )}
                                          {visibleColumns.name && (
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                {contact.image_url && (
                                                  <img
                                                    src={contact.image_url || "/placeholder.svg"}
                                                    alt={contact.last_name}
                                                    className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                                  />
                                                )}
                                                <div>
                                                  <div className="font-medium whitespace-nowrap">
                                                    {contact.salutation && `${contact.salutation} `}
                                                    {contact.title && `${contact.title} `}
                                                    {contact.first_name} {contact.last_name}
                                                  </div>
                                                  {contact.position && (
                                                    <div className="text-sm text-muted-foreground">{contact.position}</div>
                                                  )}
                                                </div>
                                              </div>
                                            </TableCell>
                                          )}
                          {visibleColumns.contact && (
                            <TableCell>
                              <div className="space-y-1">
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="hover:underline truncate max-w-[150px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                {(contact.phone || contact.mobile) && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <a
                                      href={`tel:${contact.phone || contact.mobile}`}
                                      className="hover:underline whitespace-nowrap"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {contact.phone || contact.mobile}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.address && (
                            <TableCell>
                              {(contact.street || contact.city) && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    [contact.street, contact.house_number, contact.postal_code, contact.city]
                                      .filter(Boolean)
                                      .join(" ")
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline block"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.street && (
                                    <div className="whitespace-nowrap">
                                      {contact.street} {contact.house_number}
                                    </div>
                                  )}
                                  {contact.city && (
                                    <div className="whitespace-nowrap">
                                      {contact.postal_code} {contact.city}
                                    </div>
                                  )}
                                </a>
                              )}
                            </TableCell>
                          )}
                          {visibleColumns.category && (
                            <TableCell>
                              {contact.category && (
                                <Badge 
                                  variant={contact.category === "Team" ? "default" : "outline"}
                                  className={contact.category === "Team" ? "bg-primary/10 text-primary border-primary/20" : ""}
                                >
                                  {contact.category === "Team" && <Users className="h-3 w-3 mr-1" />}
                                  {contact.category}
                                </Badge>
                              )}
                              {contact.ai_extracted && (
                                <Badge variant="secondary" className="ml-2">
                                  KI
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            {contact.id.startsWith("team-") ? (
                              <span className="text-xs text-muted-foreground italic">Teammitglied</span>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => toggleFavorite(contact)}
                                title={contact.is_favorite ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
                              >
                                <Star
                                  className={`h-4 w-4 ${
                                    contact.is_favorite
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground hover:text-amber-400"
                                  }`}
                                />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <CreateContactDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={handleReload} />

          {selectedContact && (
            <EditContactDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              contact={selectedContact}
              onSuccess={handleReload}
            />
          )}

          <AIContactExtractorDialog open={showAIDialog} onOpenChange={setShowAIDialog} onSuccess={handleReload} />

          <AIContactSearchDialog open={showAISearchDialog} onOpenChange={setShowAISearchDialog} onSuccess={handleReload} />

          <AIRecommendedContactsDialog open={showRecommendedDialog} onOpenChange={setShowRecommendedDialog} onSuccess={handleReload} />

          <BatchImportContactsDialog
            open={showBatchDialog}
            onOpenChange={setShowBatchDialog}
            onSuccess={handleReload}
          />

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
                <AlertDialogAction
                  onClick={confirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
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
