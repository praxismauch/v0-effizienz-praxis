"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles, MapPin, Search, Building2, Phone, Mail, Plus, Check, PhoneCall } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import RecommendedContactsDialog from "@/components/contacts/recommended-contacts-dialog"

interface AIContactSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface SearchResult {
  id: string
  name: string
  company?: string
  specialty?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  distance?: string
  selected?: boolean
}

export function AIContactSearchDialog({ open, onOpenChange, onSuccess }: AIContactSearchDialogProps) {
  const { toast } = useToast()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("")
  const [radius, setRadius] = useState("20")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [importing, setImporting] = useState(false)
  const [showRecommendedDialog, setShowRecommendedDialog] = useState(false)

  // Prefill location with practice postal code when dialog opens
  useEffect(() => {
    if (open && currentPractice?.zipCode && !location) {
      setLocation(currentPractice.zipCode)
    }
  }, [open, currentPractice?.zipCode])

  const exampleQueries = [
    "Alle Hausärzte",
    "Fachärzte für Orthopädie",
    "Physiotherapie-Praxen",
    "Labore und Diagnostikzentren",
    "Apotheken",
    "Pflegedienste",
  ]

  async function handleSearch() {
    if (!searchQuery.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Suchanfrage ein",
        variant: "destructive",
      })
      return
    }

    if (!currentUser?.practice_id) {
      toast({
        title: "Fehler",
        description: "Keine Praxis zugeordnet",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResults([])

    try {
      const response = await fetch("/api/contacts/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          location: location || undefined,
          radius: radius ? parseInt(radius) : 20,
          practice_id: currentUser.practice_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Suche fehlgeschlagen")
      }

      const data = await response.json()
      setResults(data.results?.map((r: SearchResult) => ({ ...r, selected: false })) || [])

      if (!data.results?.length) {
        toast({
          title: "Keine Ergebnisse",
          description: "Keine passenden Kontakte gefunden. Versuchen Sie eine andere Suchanfrage.",
        })
      }
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Suche konnte nicht durchgeführt werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function toggleResult(id: string) {
    setResults(results.map(r => 
      r.id === id ? { ...r, selected: !r.selected } : r
    ))
  }

  function selectAll() {
    const allSelected = results.every(r => r.selected)
    setResults(results.map(r => ({ ...r, selected: !allSelected })))
  }

  async function importSelected() {
    const selected = results.filter(r => r.selected)
    if (selected.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie mindestens einen Kontakt aus",
        variant: "destructive",
      })
      return
    }

    if (!currentUser?.practice_id) return

    setImporting(true)

    try {
      const response = await fetch(`/api/practices/${currentUser.practice_id}/contacts/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: selected.map(r => ({
            last_name: r.name,
            company: r.company || r.specialty,
            email: r.email,
            phone: r.phone,
            street: r.address?.split(",")[0]?.trim(),
            city: r.address?.split(",").slice(1).join(",").trim(),
            category: "Überweiser",
            ai_extracted: true,
          })),
        }),
      })

      if (!response.ok) throw new Error("Import fehlgeschlagen")

      const data = await response.json()

      toast({
        title: "Erfolg",
        description: `${data.imported || selected.length} Kontakt(e) wurden importiert`,
      })

      onSuccess()
      handleClose()
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Import fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  function handleClose() {
    setSearchQuery("")
    setLocation(currentPractice?.zipCode || "")
    setRadius("20")
    setResults([])
    onOpenChange(false)
  }

  const selectedCount = results.filter(r => r.selected).length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            KI-Kontaktsuche
          </DialogTitle>
          <DialogDescription>
            Beschreiben Sie, welche Art von Kontakten Sie suchen. Die KI findet passende Adressen in Ihrer Nähe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-query">Suchanfrage</Label>
            <Textarea
              id="search-query"
              placeholder='z.B. "Alle Hausärzte im 20km Radius" oder "Orthopäden in München"'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex flex-wrap gap-1">
              {exampleQueries.map((query) => (
                <Badge
                  key={query}
                  variant="secondary"
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => setSearchQuery(query)}
                >
                  {query}
                </Badge>
              ))}
            </div>
          </div>

          {/* Wichtige Nummern Button */}
          <Button
            variant="outline"
            className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5"
            onClick={() => setShowRecommendedDialog(true)}
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            Wichtige Nummern (Notdienste, KV, BGW, etc.)
          </Button>

          {/* Location & Radius */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Standort (optional)
              </Label>
              <Input
                id="location"
                placeholder="Stadt oder PLZ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                min="1"
                max="100"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
          </div>

          {/* Search Button */}
          <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suche läuft...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Kontakte suchen
              </>
            )}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {results.length} Ergebnis(se) gefunden
                </span>
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  {results.every(r => r.selected) ? "Alle abwählen" : "Alle auswählen"}
                </Button>
              </div>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-2 pb-4">
                  {results.map((result) => (
                    <Card
                      key={result.id}
                      className={`cursor-pointer transition-all ${
                        result.selected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleResult(result.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={result.selected} className="mt-1" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{result.name}</span>
                              {result.distance && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {result.distance}
                                </Badge>
                              )}
                            </div>
                            {(result.company || result.specialty) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate">{result.company || result.specialty}</span>
                              </div>
                            )}
                            {result.address && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{result.address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-4 mt-1">
                              {result.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{result.phone}</span>
                                </div>
                              )}
                              {result.email && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate">{result.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          {results.length > 0 && (
            <Button onClick={importSelected} disabled={importing || selectedCount === 0}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importiere...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  {selectedCount} Kontakt(e) importieren
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Recommended Contacts Dialog (Wichtige Nummern) */}
      <RecommendedContactsDialog
        open={showRecommendedDialog}
        onOpenChange={setShowRecommendedDialog}
        onSuccess={() => {
          onSuccess()
        }}
      />
    </Dialog>
  )
}

export default AIContactSearchDialog
