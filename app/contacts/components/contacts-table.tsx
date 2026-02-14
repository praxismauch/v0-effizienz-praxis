"use client"

import { useRouter } from "next/navigation"
import { Mail, Phone, Building2, Users, Star } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Contact, VisibleColumns } from "../contact-types"

interface ContactsTableProps {
  contacts: Contact[]
  visibleColumns: VisibleColumns
  loading: boolean
  onToggleFavorite: (contact: Contact) => void
}

export function ContactsTable({ contacts, visibleColumns, loading, onToggleFavorite }: ContactsTableProps) {
  const router = useRouter()

  if (loading) {
    return <div className="text-center py-8">Lädt...</div>
  }

  if (contacts.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Keine Kontakte gefunden</div>
  }

  return (
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
          {contacts.map((contact) => (
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
                    onClick={() => onToggleFavorite(contact)}
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
  )
}
