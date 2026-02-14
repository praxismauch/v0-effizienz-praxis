"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Plus, Search, Phone, Mail, MapPin, ExternalLink, Star, Loader2 } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import Link from "next/link"

interface SupplierContact {
  id: string
  first_name: string | null
  last_name: string
  company: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  street: string | null
  house_number: string | null
  postal_code: string | null
  city: string | null
  contact_person: string | null
  direct_phone: string | null
  is_favorite: boolean
  category: string | null
}

export function SuppliersTab() {
  const { currentPractice } = usePractice()
  const [contacts, setContacts] = useState<SupplierContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchSupplierContacts = useCallback(async () => {
    if (!currentPractice?.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/contacts`, { credentials: "include" })
      if (response.ok) {
        const allContacts: SupplierContact[] = await response.json()
        const suppliers = allContacts.filter(
          (c) => c.category?.toLowerCase() === "lieferant"
        )
        setContacts(suppliers)
      }
    } catch (error) {
      console.error("Error fetching supplier contacts:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    fetchSupplierContacts()
  }, [fetchSupplierContacts])

  const filteredContacts = contacts.filter((c) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      c.last_name?.toLowerCase().includes(search) ||
      c.first_name?.toLowerCase().includes(search) ||
      c.company?.toLowerCase().includes(search) ||
      c.email?.toLowerCase().includes(search)
    )
  })

  const displayName = (c: SupplierContact) => {
    if (c.company) return c.company
    return [c.first_name, c.last_name].filter(Boolean).join(" ")
  }

  const subName = (c: SupplierContact) => {
    if (c.company) {
      const personName = [c.first_name, c.last_name].filter(Boolean).join(" ")
      return personName || c.contact_person || null
    }
    return c.contact_person || null
  }

  const addressLine = (c: SupplierContact) => {
    const parts = []
    if (c.street) parts.push(`${c.street}${c.house_number ? ` ${c.house_number}` : ""}`)
    if (c.postal_code || c.city) parts.push([c.postal_code, c.city].filter(Boolean).join(" "))
    return parts.join(", ")
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Lieferanten</CardTitle>
              <CardDescription>
                Kontakte mit Kategorie &quot;Lieferant&quot; aus Ihrer Kontaktliste
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Lieferant
            </Button>
          </div>
          {contacts.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Lieferanten suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              {contacts.length === 0 ? (
                <>
                  <p>Noch keine Lieferanten angelegt</p>
                  <p className="text-sm mt-1">
                    Erstellen Sie einen Kontakt mit Kategorie &quot;Lieferant&quot;
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ersten Lieferanten anlegen
                  </Button>
                </>
              ) : (
                <p>Keine Lieferanten gefunden für &quot;{searchTerm}&quot;</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`}>
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Building2 className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{displayName(contact)}</CardTitle>
                            {subName(contact) && (
                              <p className="text-sm text-muted-foreground">{subName(contact)}</p>
                            )}
                          </div>
                        </div>
                        {contact.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {(contact.phone || contact.direct_phone) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{contact.direct_phone || contact.phone}</span>
                        </div>
                      )}
                      {addressLine(contact) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{addressLine(contact)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateContactDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchSupplierContacts}
        defaultCategory="Lieferant"
      />
    </>
  )
}
