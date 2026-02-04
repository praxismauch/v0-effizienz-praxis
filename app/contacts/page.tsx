"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, Upload, Search, Mail, Phone, Building2, Trash2, Edit, Sparkles, Settings2, Users, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
  created_at: string
  contact_person: string | null
  direct_phone: string | null
  availability: string | null
}

interface TeamMember {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  role: string
  avatar?: string | null
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()
  const { teamMembers, loading: teamLoading } = useTeam()
  const [showTeamMembers, setShowTeamMembers] = useState(true)

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

  const filteredContacts = contacts.filter((contact) => {
    const search = searchQuery.toLowerCase()
    return (
      contact.first_name?.toLowerCase().includes(search) ||
      contact.last_name.toLowerCase().includes(search) ||
      contact.company?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search)
    )
  })

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
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowAISearchDialog(true)}
            >
              <Search className="h-4 w-4" />
              KI-Suche
            </Button>
            <Button
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => setShowRecommendedDialog(true)}
            >
              <Phone className="h-4 w-4" />
              Empfohlene Nummern
            </Button>
            <Button variant="outline" onClick={() => setShowBatchDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Batch Import
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kontakt
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Team Members Section */}
          <Collapsible open={showTeamMembers} onOpenChange={setShowTeamMembers}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <h2 className="font-semibold">Praxis-Team</h2>
                      <Badge variant="secondary">{teamMembers.length} Mitglieder</Badge>
                    </div>
                    {showTeamMembers ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {teamLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Lädt Teammitglieder...</div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">Keine Teammitglieder verfügbar</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {teamMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <span>{(member.first_name?.[0] || member.name?.[0] || "?").toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{member.name || `${member.first_name} ${member.last_name}`}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            {member.email && (
                              <a
                                href={`mailto:${member.email}`}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                title={member.email}
                              >
                                <Mail className="h-3 w-3" />
                                <span className="hidden xl:inline truncate max-w-[120px]">{member.email}</span>
                              </a>
                            )}
                            {(member.phone || member.mobile) && (
                              <a
                                href={`tel:${member.phone || member.mobile}`}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{member.phone || member.mobile}</span>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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
<TableRow key={contact.id}>
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
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                )}
                                {(contact.phone || contact.mobile) && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                    <span className="whitespace-nowrap">{contact.phone || contact.mobile}</span>
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
                              {contact.category && <Badge variant="outline">{contact.category}</Badge>}
                              {contact.ai_extracted && (
                                <Badge variant="secondary" className="ml-2">
                                  KI
                                </Badge>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => {
                                  setSelectedContact(contact)
                                  setShowEditDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0"
                                onClick={() => setContactToDelete(contact)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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
