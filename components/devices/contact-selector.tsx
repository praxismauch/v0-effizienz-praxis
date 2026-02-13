"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Contact } from "lucide-react"
import type { ContactOption } from "./device-form-types"
import { getContactDisplayName } from "./device-form-types"

interface ContactSelectorProps {
  label: string
  isOpen: boolean
  onToggle: () => void
  contacts: ContactOption[]
  contactsLoading: boolean
  onSelect: (contact: ContactOption) => void
}

export function ContactSelector({
  label,
  isOpen,
  onToggle,
  contacts,
  contactsLoading,
  onSelect,
}: ContactSelectorProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggle}
          className="h-7 text-xs gap-1"
        >
          <Contact className="h-3 w-3" />
          Aus Kontakten wählen
        </Button>
      </div>

      {isOpen && (
        <div className="mb-3 p-3 border rounded-lg bg-muted/30">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Kontakt auswählen zum Übernehmen der Daten
          </Label>
          {contactsLoading ? (
            <div className="text-sm text-muted-foreground py-2">Laden...</div>
          ) : contacts.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2">Keine Kontakte vorhanden</div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => onSelect(contact)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
                >
                  <div className="font-medium">{getContactDisplayName(contact)}</div>
                  {contact.company && (contact.first_name || contact.last_name) && (
                    <div className="text-xs text-muted-foreground">
                      {`${contact.first_name || ""} ${contact.last_name || ""}`.trim()}
                    </div>
                  )}
                  {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
