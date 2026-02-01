"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { usePractice } from "@/contexts/practice-context"
import { Loader2, Plus, MapPin, Phone, Mail, Globe, MoreVertical, Star, Pencil, Trash2, Building2 } from "lucide-react"

interface PracticeLocation {
  id: string
  practice_id: number
  name: string
  street: string | null
  city: string | null
  zip_code: string | null
  country: string
  phone: string | null
  email: string | null
  fax: string | null
  website: string | null
  is_main: boolean
  is_active: boolean
  opening_hours: Record<string, any>
  notes: string | null
  created_at: string
  updated_at: string
}

interface LocationFormData {
  name: string
  street: string
  city: string
  zipCode: string
  country: string
  phone: string
  email: string
  fax: string
  website: string
  isMain: boolean
  isActive: boolean
  notes: string
}

const emptyFormData: LocationFormData = {
  name: "",
  street: "",
  city: "",
  zipCode: "",
  country: "Deutschland",
  phone: "",
  email: "",
  fax: "",
  website: "",
  isMain: false,
  isActive: true,
  notes: "",
}

export function PracticeLocationsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [locations, setLocations] = useState<PracticeLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<PracticeLocation | null>(null)
  const [deletingLocation, setDeletingLocation] = useState<PracticeLocation | null>(null)
  const [formData, setFormData] = useState<LocationFormData>(emptyFormData)

  useEffect(() => {
    if (currentPractice?.id) {
      loadLocations()
    }
  }, [currentPractice?.id])

  const loadLocations = async () => {
    if (!currentPractice?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error("Error loading locations:", error)
      toast({
        title: "Fehler",
        description: "Standorte konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (location?: PracticeLocation) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        street: location.street || "",
        city: location.city || "",
        zipCode: location.zip_code || "",
        country: location.country || "Deutschland",
        phone: location.phone || "",
        email: location.email || "",
        fax: location.fax || "",
        website: location.website || "",
        isMain: location.is_main,
        isActive: location.is_active,
        notes: location.notes || "",
      })
    } else {
      setEditingLocation(null)
      setFormData(emptyFormData)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!currentPractice?.id || !formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für den Standort ein.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const url = editingLocation
        ? `/api/practices/${currentPractice.id}/locations/${editingLocation.id}`
        : `/api/practices/${currentPractice.id}/locations`

      const response = await fetch(url, {
        method: editingLocation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      toast({
        title: "Erfolg",
        description: editingLocation ? "Standort wurde aktualisiert." : "Neuer Standort wurde hinzugefügt.",
      })

      setDialogOpen(false)
      loadLocations()
    } catch (error) {
      console.error("Error saving location:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Standort konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetMain = async (location: PracticeLocation) => {
    if (!currentPractice?.id || location.is_main) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/locations/${location.id}`, { method: "PATCH" })

      if (!response.ok) {
        throw new Error("Failed to set main location")
      }

      toast({
        title: "Erfolg",
        description: `"${location.name}" ist jetzt der Hauptstandort.`,
      })

      loadLocations()
    } catch (error) {
      console.error("Error setting main location:", error)
      toast({
        title: "Fehler",
        description: "Hauptstandort konnte nicht geändert werden.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!currentPractice?.id || !deletingLocation) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/locations/${deletingLocation.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Löschen")
      }

      toast({
        title: "Erfolg",
        description: "Standort wurde gelöscht.",
      })

      setDeleteDialogOpen(false)
      setDeletingLocation(null)
      loadLocations()
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Standort konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const formatAddress = (location: PracticeLocation) => {
    const parts = [location.street, location.zip_code, location.city].filter(Boolean)
    return parts.join(", ") || "Keine Adresse"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Praxisstandorte
            </CardTitle>
            <CardDescription>
              Verwalten Sie mehrere Standorte Ihrer Praxis. Ein Standort muss als Hauptstandort markiert sein.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Standort
          </Button>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Standorte vorhanden.</p>
              <p className="text-sm">Fügen Sie Ihren ersten Standort hinzu.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <Card
                  key={location.id}
                  className={`${location.is_main ? "border-primary" : ""} ${!location.is_active ? "opacity-60" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{location.name}</h3>
                          {location.is_main && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              Hauptstandort
                            </Badge>
                          )}
                          {!location.is_active && <Badge variant="secondary">Inaktiv</Badge>}
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              [location.street, location.zip_code, location.city].filter(Boolean).join(", ")
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            <MapPin className="h-4 w-4" />
                            {formatAddress(location)}
                          </a>
                          {location.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {location.phone}
                            </div>
                          )}
                          {location.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {location.email}
                            </div>
                          )}
                          {location.website && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-4 w-4" />
                              {location.website}
                            </div>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDialog(location)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          {!location.is_main && (
                            <DropdownMenuItem onClick={() => handleSetMain(location)}>
                              <Star className="h-4 w-4 mr-2" />
                              Als Hauptstandort setzen
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeletingLocation(location)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={locations.length <= 1}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLocation ? "Standort bearbeiten" : "Neuen Standort hinzufügen"}</DialogTitle>
            <DialogDescription>
              {editingLocation
                ? "Aktualisieren Sie die Standortinformationen."
                : "Fügen Sie einen neuen Standort für Ihre Praxis hinzu."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Standortname *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. Hauptpraxis, Zweigstelle Mitte"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="street">Straße</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Musterstraße 123"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="zipCode">Postleitzahl</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/\D/g, "").slice(0, 5)
                      setFormData({ ...formData, zipCode: numericValue })
                    }}
                    placeholder="12345"
                    maxLength={5}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="030 12345678"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                    placeholder="030 12345679"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="standort@praxis.de"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.praxis.de"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notizen</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Zusätzliche Informationen zum Standort..."
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isMain">Hauptstandort</Label>
                  <div className="text-sm text-muted-foreground">
                    Dieser Standort wird als primärer Standort angezeigt
                  </div>
                </div>
                <Switch
                  id="isMain"
                  checked={formData.isMain}
                  onCheckedChange={(checked) => setFormData({ ...formData, isMain: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="isActive">Aktiv</Label>
                  <div className="text-sm text-muted-foreground">Inaktive Standorte werden ausgeblendet</div>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.name.trim()}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingLocation ? "Speichern" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Standort löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Standort &quot;{deletingLocation?.name}&quot; wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PracticeLocationsTab
