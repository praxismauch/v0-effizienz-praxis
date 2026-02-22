"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { Loader2, Save, Building2, MapPin, Phone, Mail, Globe, X, ChevronsUpDown, Printer, ExternalLink } from "lucide-react"

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
]

interface PracticeSettings {
  name: string
  street: string
  zipCity: string
  bundesland: string
  phone: string
  fax: string
  email: string
  website: string
  description: string
  type: string
  specializations: string[]
}

interface SpecialtyGroup {
  id: string
  name: string
}

export function PracticeSettingsTab() {
  const { toast } = useToast()
  const { currentPractice, refreshPractices } = usePractice()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [specialtyGroups, setSpecialtyGroups] = useState<SpecialtyGroup[]>([])
  const [practiceForms, setPracticeForms] = useState<{ id: string; value: string; label: string }[]>([])
  const [specialtyOpen, setSpecialtyOpen] = useState(false)
  const [settings, setSettings] = useState<PracticeSettings>({
    name: "",
    street: "",
    zipCity: "",
    bundesland: "",
    phone: "",
    fax: "",
    email: "",
    website: "",
    description: "",
    type: "",
    specializations: [],
  })

  useEffect(() => {
    if (currentPractice) {
      // Parse address "Straße, Ort, PLZ" into separate fields
      const addressParts = (currentPractice.address || "").split(", ")
      const street = addressParts[0] || ""
      const city = addressParts[1] || ""
      const zip = addressParts[2] || ""
      const zipCity = [zip, city].filter(Boolean).join(" ")

      // Parse specialty: stored as comma-separated string in DB (column is "specialty")
      const rawSpec = currentPractice.specialty || currentPractice.specialization || ""
      const specs = rawSpec
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean)

      setSettings({
        name: currentPractice.name || "",
        street,
        zipCity,
        bundesland: (currentPractice as any).bundesland || "",
        phone: currentPractice.phone || "",
        fax: currentPractice.fax || "",
        email: currentPractice.email || "",
        website: currentPractice.website || "",
        description: currentPractice.description || "",
        type: currentPractice.type || "",
        specializations: specs,
      })
    }
  }, [currentPractice])

  useEffect(() => {
    async function fetchSpecialtyGroups() {
      try {
        const res = await fetch("/api/specialty-groups")
        if (res.ok) {
          const data = await res.json()
          setSpecialtyGroups(data.specialtyGroups || [])
        }
      } catch (error) {
        console.error("Error fetching specialty groups:", error)
      }
    }
    async function fetchPracticeForms() {
      try {
        const res = await fetch("/api/practice-forms")
        if (res.ok) {
          const data = await res.json()
          setPracticeForms(data || [])
        }
      } catch (error) {
        console.error("Error fetching practice forms:", error)
      }
    }
    fetchSpecialtyGroups()
    fetchPracticeForms()
  }, [])

  const handleSave = async () => {
    if (!currentPractice?.id) return

    setIsSaving(true)
    try {
      // Rejoin street + zipCity into a single address string for the DB
      const zipCityParts = settings.zipCity.trim().split(/\s+/)
      const zip = zipCityParts[0] || ""
      const city = zipCityParts.slice(1).join(" ") || ""
      const address = [settings.street, city, zip].filter(Boolean).join(", ")

      const { street, zipCity, specializations, bundesland, ...rest } = settings
      const payload = { ...rest, address, street: settings.street, zip_code: zip, city, bundesland, specialty: specializations.join(", ") }

      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        console.log("[v0] Practice settings save error:", JSON.stringify(error))
        throw new Error(error.error || "Failed to update settings")
      }

      await refreshPractices()
      toast({
        title: "Gespeichert",
        description: "Die Praxiseinstellungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      console.error("Error saving practice settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Praxisinformationen
          </CardTitle>
          <CardDescription>Grundlegende Informationen über Ihre Praxis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Praxisname</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                placeholder="Name der Praxis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice_type">Praxisart</Label>
              <Select
value={settings.type}
onValueChange={(value) => setSettings({ ...settings, type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Praxisart auswählen" />
                </SelectTrigger>
  <SelectContent>
  {practiceForms.map((form) => (
    <SelectItem key={form.id} value={form.value}>
      {form.label}
    </SelectItem>
  ))}
  </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fachrichtungen</Label>
            <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={specialtyOpen}
                  className="w-full justify-between font-normal h-auto min-h-10"
                >
                  {settings.specializations.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {settings.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                          <span
                            role="button"
                            tabIndex={0}
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSettings({
                                ...settings,
                                specializations: settings.specializations.filter((s) => s !== spec),
                              })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault()
                                e.stopPropagation()
                                setSettings({
                                  ...settings,
                                  specializations: settings.specializations.filter((s) => s !== spec),
                                })
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">{spec} entfernen</span>
                          </span>
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Fachrichtungen auswählen...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                  {specialtyGroups.map((group) => {
                    const isSelected = settings.specializations.includes(group.name)
                    return (
                      <label
                        key={group.id}
                        className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSettings({
                                ...settings,
                                specializations: [...settings.specializations, group.name],
                              })
                            } else {
                              setSettings({
                                ...settings,
                                specializations: settings.specializations.filter((s) => s !== group.name),
                              })
                            }
                          }}
                        />
                        {group.name}
                      </label>
                    )
                  })}
                  {specialtyGroups.length === 0 && (
                    <p className="text-sm text-muted-foreground px-2 py-1.5">Keine Fachrichtungen gefunden</p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={settings.description}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="Kurze Beschreibung Ihrer Praxis"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kontaktdaten
          </CardTitle>
          <CardDescription>Kontaktinformationen und Erreichbarkeit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input
                id="street"
                value={settings.street}
                onChange={(e) => setSettings({ ...settings, street: e.target.value })}
                placeholder="Musterstraße 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCity">PLZ und Ort</Label>
              <Input
                id="zipCity"
                value={settings.zipCity}
                onChange={(e) => setSettings({ ...settings, zipCity: e.target.value })}
                placeholder="87616 Marktoberdorf"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bundesland">Bundesland</Label>
              <Select
                value={settings.bundesland}
                onValueChange={(value) => setSettings({ ...settings, bundesland: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bundesland auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {BUNDESLAENDER.map((land) => (
                    <SelectItem key={land} value={land}>
                      {land}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefon
              </Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="+49 123 456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fax" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Fax
              </Label>
              <Input
                id="fax"
                value={settings.fax}
                onChange={(e) => setSettings({ ...settings, fax: e.target.value })}
                placeholder="+49 123 456780"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-Mail
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                placeholder="praxis@beispiel.de"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website
            </Label>
            <Input
              id="website"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              placeholder="https://www.beispiel.de"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Business Profil
          </CardTitle>
          <CardDescription>Verwalten Sie Ihr Google Business Profil direkt bei Google</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild className="gap-2">
              <a
                href="https://business.google.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                Google Business Dashboard
              </a>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent((settings.name || "Praxis") + " " + (settings.zipCity || ""))}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4" />
                Auf Google Maps anzeigen
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Ihr Google Business Profil beeinflusst, wie Ihre Praxis in der Google-Suche und auf Google Maps erscheint.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
