"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Building2, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface RecommendedContact {
  id: string
  category: string
  name: string
  phone: string
  description?: string
  address?: string
  bundeslandSpecific?: boolean
  radiusKm?: number
}

// BGW contacts by Bundesland
const BGW_CONTACTS: Record<string, { name: string; phone: string; address: string }> = {
  "Baden-Württemberg": { name: "BGW Bezirksverwaltung Stuttgart", phone: "0711 9321-0", address: "Vollmoellerstr. 11, 70563 Stuttgart" },
  "Bayern": { name: "BGW Bezirksverwaltung München", phone: "089 35096-0", address: "Helmholtzstr. 2, 80636 München" },
  "Berlin": { name: "BGW Bezirksverwaltung Berlin", phone: "030 896856-0", address: "Spichernstr. 2-3, 10777 Berlin" },
  "Brandenburg": { name: "BGW Bezirksverwaltung Berlin", phone: "030 896856-0", address: "Spichernstr. 2-3, 10777 Berlin" },
  "Bremen": { name: "BGW Bezirksverwaltung Hamburg", phone: "040 20207-0", address: "Schäferkampsallee 24, 20357 Hamburg" },
  "Hamburg": { name: "BGW Bezirksverwaltung Hamburg", phone: "040 20207-0", address: "Schäferkampsallee 24, 20357 Hamburg" },
  "Hessen": { name: "BGW Bezirksverwaltung Mainz", phone: "06131 808-0", address: "Göttelmannstr. 3, 55130 Mainz" },
  "Mecklenburg-Vorpommern": { name: "BGW Bezirksverwaltung Hamburg", phone: "040 20207-0", address: "Schäferkampsallee 24, 20357 Hamburg" },
  "Niedersachsen": { name: "BGW Bezirksverwaltung Hannover", phone: "0511 8118-0", address: "Am Mittelfelde 169, 30519 Hannover" },
  "Nordrhein-Westfalen": { name: "BGW Bezirksverwaltung Bochum", phone: "0234 3078-0", address: "Universitätsstr. 78, 44789 Bochum" },
  "Rheinland-Pfalz": { name: "BGW Bezirksverwaltung Mainz", phone: "06131 808-0", address: "Göttelmannstr. 3, 55130 Mainz" },
  "Saarland": { name: "BGW Bezirksverwaltung Mainz", phone: "06131 808-0", address: "Göttelmannstr. 3, 55130 Mainz" },
  "Sachsen": { name: "BGW Bezirksverwaltung Dresden", phone: "0351 8647-0", address: "Hofmühlenstr. 4, 01187 Dresden" },
  "Sachsen-Anhalt": { name: "BGW Bezirksverwaltung Magdeburg", phone: "0391 6090-6", address: "Keplerstr. 12, 39104 Magdeburg" },
  "Schleswig-Holstein": { name: "BGW Bezirksverwaltung Hamburg", phone: "040 20207-0", address: "Schäferkampsallee 24, 20357 Hamburg" },
  "Thüringen": { name: "BGW Bezirksverwaltung Dresden", phone: "0351 8647-0", address: "Hofmühlenstr. 4, 01187 Dresden" },
}

// Giftnotruf by Bundesland
const GIFTNOTRUF_CONTACTS: Record<string, { name: string; phone: string }> = {
  "Baden-Württemberg": { name: "Giftnotruf Freiburg", phone: "0761 19240" },
  "Bayern": { name: "Giftnotruf München", phone: "089 19240" },
  "Berlin": { name: "Giftnotruf Berlin", phone: "030 19240" },
  "Brandenburg": { name: "Giftnotruf Berlin", phone: "030 19240" },
  "Bremen": { name: "Giftnotruf Göttingen", phone: "0551 19240" },
  "Hamburg": { name: "Giftnotruf Göttingen", phone: "0551 19240" },
  "Hessen": { name: "Giftnotruf Mainz", phone: "06131 19240" },
  "Mecklenburg-Vorpommern": { name: "Giftnotruf Göttingen", phone: "0551 19240" },
  "Niedersachsen": { name: "Giftnotruf Göttingen", phone: "0551 19240" },
  "Nordrhein-Westfalen": { name: "Giftnotruf Bonn", phone: "0228 19240" },
  "Rheinland-Pfalz": { name: "Giftnotruf Mainz", phone: "06131 19240" },
  "Saarland": { name: "Giftnotruf Homburg", phone: "06841 19240" },
  "Sachsen": { name: "Giftnotruf Erfurt", phone: "0361 730730" },
  "Sachsen-Anhalt": { name: "Giftnotruf Erfurt", phone: "0361 730730" },
  "Schleswig-Holstein": { name: "Giftnotruf Göttingen", phone: "0551 19240" },
  "Thüringen": { name: "Giftnotruf Erfurt", phone: "0361 730730" },
}

// KV contacts by Bundesland
const KV_CONTACTS: Record<string, { name: string; phone: string; address: string }> = {
  "Baden-Württemberg": { name: "Kassenärztliche Vereinigung Baden-Württemberg", phone: "0711 7875-0", address: "Albstadtweg 11, 70567 Stuttgart" },
  "Bayern": { name: "Kassenärztliche Vereinigung Bayerns", phone: "089 57093-0", address: "Elsenheimerstr. 39, 80687 München" },
  "Berlin": { name: "Kassenärztliche Vereinigung Berlin", phone: "030 31003-0", address: "Masurenallee 6A, 14057 Berlin" },
  "Brandenburg": { name: "Kassenärztliche Vereinigung Brandenburg", phone: "0331 2309-0", address: "Gregor-Mendel-Str. 10-11, 14469 Potsdam" },
  "Bremen": { name: "Kassenärztliche Vereinigung Bremen", phone: "0421 3404-0", address: "Schwachhauser Heerstr. 26/28, 28209 Bremen" },
  "Hamburg": { name: "Kassenärztliche Vereinigung Hamburg", phone: "040 22802-0", address: "Humboldtstr. 56, 22083 Hamburg" },
  "Hessen": { name: "Kassenärztliche Vereinigung Hessen", phone: "069 79502-0", address: "Georg-Voigt-Str. 15, 60325 Frankfurt am Main" },
  "Mecklenburg-Vorpommern": { name: "Kassenärztliche Vereinigung Mecklenburg-Vorpommern", phone: "0385 7431-0", address: "Neumühler Str. 22, 19057 Schwerin" },
  "Niedersachsen": { name: "Kassenärztliche Vereinigung Niedersachsen", phone: "0511 380-0", address: "Berliner Allee 22, 30175 Hannover" },
  "Nordrhein-Westfalen": { name: "Kassenärztliche Vereinigung Nordrhein", phone: "0211 5970-0", address: "Tersteegenstr. 9, 40474 Düsseldorf" },
  "Rheinland-Pfalz": { name: "Kassenärztliche Vereinigung Rheinland-Pfalz", phone: "06131 326-0", address: "Isaac-Fulda-Allee 14, 55124 Mainz" },
  "Saarland": { name: "Kassenärztliche Vereinigung Saarland", phone: "0681 998380", address: "Faktoreistr. 4, 66111 Saarbrücken" },
  "Sachsen": { name: "Kassenärztliche Vereinigung Sachsen", phone: "0351 8290-0", address: "Schützenhöhe 12, 01099 Dresden" },
  "Sachsen-Anhalt": { name: "Kassenärztliche Vereinigung Sachsen-Anhalt", phone: "0391 627-0", address: "Doctor-Eisenbart-Ring 2, 39120 Magdeburg" },
  "Schleswig-Holstein": { name: "Kassenärztliche Vereinigung Schleswig-Holstein", phone: "04551 883-0", address: "Bismarckallee 1-6, 23795 Bad Segeberg" },
  "Thüringen": { name: "Kassenärztliche Vereinigung Thüringen", phone: "03643 559-0", address: "Zum Hospitalgraben 8, 99425 Weimar" },
}

// National emergency contacts
const NATIONAL_CONTACTS: RecommendedContact[] = [
  { id: "notruf-112", category: "Notdienste", name: "Rettungsleitstelle / Notruf", phone: "112", description: "Europäischer Notruf - Rettungsdienst & Feuerwehr" },
  { id: "polizei-110", category: "Notdienste", name: "Polizei Notruf", phone: "110", description: "Polizeilicher Notruf" },
  { id: "feuerwehr-112", category: "Notdienste", name: "Feuerwehr", phone: "112", description: "Feuerwehr Notruf" },
  { id: "aerztekammer", category: "Standesorganisation", name: "Bundesärztekammer", phone: "030 400456-0", description: "Deutsche Ärztekammer - Herbert-Lewin-Platz 1, 10623 Berlin" },
  { id: "kbv", category: "Standesorganisation", name: "Kassenärztliche Bundesvereinigung", phone: "030 4005-0", description: "KBV - Herbert-Lewin-Platz 2, 10623 Berlin" },
  { id: "apothekennotdienst", category: "Notdienste", name: "Apothekennotdienst", phone: "0800 0022833", description: "Bundesweiter Apothekennotdienst (kostenfrei)" },
  { id: "telefonseelsorge", category: "Krisendienste", name: "Telefonseelsorge", phone: "0800 1110111", description: "Kostenfreie Krisenberatung 24/7" },
  { id: "patientenberatung", category: "Beratung", name: "Unabhängige Patientenberatung", phone: "0800 0117722", description: "Kostenfrei - Gesundheitsberatung" },
]

interface RecommendedContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function RecommendedContactsDialog({ open, onOpenChange, onSuccess }: RecommendedContactsDialogProps) {
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)

  // Get practice Bundesland from settings or address
  const bundesland = (currentPractice as any)?.bundesland || "Bayern"
  const practiceAddress = currentPractice?.address || `${currentPractice?.street}, ${currentPractice?.zipCode} ${currentPractice?.city}`

  // Generate recommended contacts based on practice location
  const recommendedContacts = useMemo(() => {
    const contacts: RecommendedContact[] = []

    // Add Bundesland-specific contacts
    const bgw = BGW_CONTACTS[bundesland]
    if (bgw) {
      contacts.push({
        id: `bgw-${bundesland}`,
        category: "Berufsgenossenschaft",
        name: bgw.name,
        phone: bgw.phone,
        address: bgw.address,
        bundeslandSpecific: true,
      })
    }

    const giftnotruf = GIFTNOTRUF_CONTACTS[bundesland]
    if (giftnotruf) {
      contacts.push({
        id: `giftnotruf-${bundesland}`,
        category: "Notdienste",
        name: giftnotruf.name,
        phone: giftnotruf.phone,
        bundeslandSpecific: true,
      })
    }

    const kv = KV_CONTACTS[bundesland]
    if (kv) {
      contacts.push({
        id: `kv-${bundesland}`,
        category: "Standesorganisation",
        name: kv.name,
        phone: kv.phone,
        address: kv.address,
        bundeslandSpecific: true,
      })
    }

    // Add location-based suggestions (these would be AI-generated in a real implementation)
    contacts.push(
      { id: "pflegedienst-local", category: "Pflegedienste", name: "Pflegedienste in Ihrer Nähe", phone: "Über KI-Suche finden", description: "Ambulante Pflegedienste im Umkreis von 15km", radiusKm: 15 },
      { id: "apotheke-local", category: "Apotheken", name: "Apotheken in Ihrer Nähe", phone: "Über KI-Suche finden", description: "Apotheken im Umkreis von 15km", radiusKm: 15 },
      { id: "fachärzte-local", category: "Fachärzte", name: "Fachärzte in Ihrer Nähe", phone: "Über KI-Suche finden", description: "Fachärzte verschiedener Disziplinen im Umkreis von 25km", radiusKm: 25 },
      { id: "klinik-local", category: "Kliniken", name: "Kliniken / Krankenhäuser", phone: "Über KI-Suche finden", description: "Krankenhäuser im Umkreis von 30km", radiusKm: 30 },
      { id: "gesundheitsamt-local", category: "Behörden", name: "Gesundheitsämter", phone: "Über KI-Suche finden", description: "Zuständige Gesundheitsämter im Umkreis von 25km", radiusKm: 25 },
      { id: "sapv-local", category: "Palliativversorgung", name: "SAPV / Palliativteams", phone: "Über KI-Suche finden", description: "Spezialisierte ambulante Palliativversorgung im Umkreis von 25km", radiusKm: 25 },
      { id: "sozialdienst-local", category: "Sozialdienste", name: "Sozialdienste", phone: "Über KI-Suche finden", description: "Sozialdienste im Umkreis von 25km", radiusKm: 25 },
    )

    // Add national contacts
    contacts.push(...NATIONAL_CONTACTS)

    return contacts
  }, [bundesland])

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    const validContacts = recommendedContacts.filter(c => !c.phone.includes("KI-Suche"))
    setSelectedContacts(new Set(validContacts.map((c) => c.id)))
  }

  const deselectAll = () => {
    setSelectedContacts(new Set())
  }

  const handleImport = async () => {
    if (selectedContacts.size === 0) {
      toast({
        title: "Keine Auswahl",
        description: "Bitte wählen Sie mindestens einen Kontakt aus",
        variant: "destructive",
      })
      return
    }

    if (!currentPractice?.id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis ausgewählt",
        variant: "destructive",
      })
      return
    }

    setImporting(true)
    setImportedCount(0)

    try {
      const contactsToImport = recommendedContacts.filter(
        (c) => selectedContacts.has(c.id) && !c.phone.includes("KI-Suche")
      )

      let successCount = 0

      for (const contact of contactsToImport) {
        try {
          const response = await fetch(`/api/practices/${currentPractice.id}/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              last_name: contact.name,
              company: contact.category,
              phone: contact.phone,
              street: contact.address?.split(",")[0] || "",
              city: contact.address?.split(",")[1]?.trim() || "",
              category: contact.category,
              notes: contact.description || "",
              ai_extracted: false,
            }),
          })

          if (response.ok) {
            successCount++
            setImportedCount(successCount)
          }
        } catch (err) {
          console.error("Error importing contact:", contact.name, err)
        }
      }

      toast({
        title: "Import abgeschlossen",
        description: `${successCount} von ${contactsToImport.length} Kontakten wurden importiert`,
      })

      if (successCount > 0) {
        onSuccess?.()
      }

      onOpenChange(false)
      setSelectedContacts(new Set())
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Kontakte konnten nicht importiert werden",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  // Group contacts by category
  const groupedContacts = useMemo(() => {
    const groups: Record<string, RecommendedContact[]> = {}
    recommendedContacts.forEach((contact) => {
      if (!groups[contact.category]) {
        groups[contact.category] = []
      }
      groups[contact.category].push(contact)
    })
    return groups
  }, [recommendedContacts])

  const validSelectedCount = Array.from(selectedContacts).filter(id => {
    const contact = recommendedContacts.find(c => c.id === id)
    return contact && !contact.phone.includes("KI-Suche")
  }).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Empfohlene Kontakte
          </DialogTitle>
          <DialogDescription>
            Wichtige Kontakte für Ihre Praxis in {bundesland}. Wählen Sie die Kontakte aus, die Sie hinzufügen möchten.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{validSelectedCount} ausgewählt</Badge>
            {bundesland && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {bundesland}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Alle auswählen
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Auswahl aufheben
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {Object.entries(groupedContacts).map(([category, contacts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {category}
                </h3>
                <div className="space-y-2">
                  {contacts.map((contact) => {
                    const isAISearch = contact.phone.includes("KI-Suche")
                    return (
                      <div
                        key={contact.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                          selectedContacts.has(contact.id) ? "bg-primary/5 border-primary/30" : "hover:bg-muted/50"
                        } ${isAISearch ? "opacity-60" : ""}`}
                      >
                        <Checkbox
                          id={contact.id}
                          checked={selectedContacts.has(contact.id)}
                          onCheckedChange={() => !isAISearch && toggleContact(contact.id)}
                          disabled={isAISearch}
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={contact.id}
                            className={`font-medium cursor-pointer ${isAISearch ? "cursor-not-allowed" : ""}`}
                          >
                            {contact.name}
                          </label>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className={`text-sm ${isAISearch ? "text-muted-foreground italic" : "font-mono"}`}>
                              {contact.phone}
                            </span>
                          </div>
                          {contact.description && (
                            <p className="text-xs text-muted-foreground mt-1">{contact.description}</p>
                          )}
                          {contact.address && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {contact.address}
                            </p>
                          )}
                          {contact.radiusKm && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {contact.radiusKm}km Umkreis
                            </Badge>
                          )}
                        </div>
                        {contact.bundeslandSpecific && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {bundesland}
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
            {importing && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Importiere... ({importedCount})</span>
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Abbrechen
          </Button>
          <Button onClick={handleImport} disabled={importing || validSelectedCount === 0}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importiere...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {validSelectedCount} Kontakte importieren
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
