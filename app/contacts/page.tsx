"use client"

import { useState, useEffect } from "react"
import { Plus, Upload, Search, Mail, Phone, Building2, Trash2, Edit, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import CreateContactDialog from "@/components/contacts/create-contact-dialog"
import EditContactDialog from "@/components/contacts/edit-contact-dialog"
import AIContactExtractorDialog from "@/components/contacts/ai-contact-extractor-dialog"
import BatchImportContactsDialog from "@/components/contacts/batch-import-contacts-dialog"
import { AppLayout } from "@/components/app-layout"
import { usePractice } from "@/contexts/practice-context"
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
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  useEffect(() => {
    if (practiceLoading) return
    if (!currentPractice?.id) {
      setLoading(false)
      return
    }
    loadContacts()
  }, [currentPractice, practiceLoading])

  async function loadContacts() {
    if (!currentPractice?.id) return

    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("practice_id", currentPractice.id)
        .order("last_name", { ascending: true })

      if (error) throw error
      setContacts(data || [])
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: "Kontakte konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function confirmDelete() {
    if (!contactToDelete) return

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contactToDelete.id)

      if (error) throw error

      toast({
        title: "Erfolg",
        description: "Kontakt wurde gelöscht",
      })
      loadContacts()
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
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Lädt...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Keine Kontakte gefunden</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Firma</TableHead>
                      <TableHead>Kontakt</TableHead>
                      <TableHead>Adresse</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {contact.image_url && (
                              <img
                                src={contact.image_url || "/placeholder.svg"}
                                alt={contact.last_name}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="font-medium">
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
                        <TableCell>
                          {contact.company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {contact.company}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <a href={`mailto:${contact.email}`} className="hover:underline">
                                  {contact.email}
                                </a>
                              </div>
                            )}
                            {(contact.phone || contact.mobile) && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                {contact.phone || contact.mobile}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(contact.street || contact.city) && (
                            <div className="text-sm">
                              {contact.street && (
                                <div>
                                  {contact.street} {contact.house_number}
                                </div>
                              )}
                              {contact.city && (
                                <div>
                                  {contact.postal_code} {contact.city}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.category && <Badge variant="outline">{contact.category}</Badge>}
                          {contact.ai_extracted && (
                            <Badge variant="secondary" className="ml-2">
                              KI
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedContact(contact)
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setContactToDelete(contact)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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

          <CreateContactDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={loadContacts} />

          {selectedContact && (
            <EditContactDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              contact={selectedContact}
              onSuccess={loadContacts}
            />
          )}

          <AIContactExtractorDialog open={showAIDialog} onOpenChange={setShowAIDialog} onSuccess={loadContacts} />

          <BatchImportContactsDialog
            open={showBatchDialog}
            onOpenChange={setShowBatchDialog}
            onSuccess={loadContacts}
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
