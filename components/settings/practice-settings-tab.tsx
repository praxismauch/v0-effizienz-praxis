"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { Loader2, Save, Building2, MapPin, Phone, Mail, Globe } from "lucide-react"

interface PracticeSettings {
  name: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  practice_type: string
  specialization: string
}

export function PracticeSettingsTab() {
  const { toast } = useToast()
  const { currentPractice, refreshPractice } = usePractice()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<PracticeSettings>({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    practice_type: "",
    specialization: "",
  })

  useEffect(() => {
    if (currentPractice) {
      setSettings({
        name: currentPractice.name || "",
        address: currentPractice.address || "",
        phone: currentPractice.phone || "",
        email: currentPractice.email || "",
        website: currentPractice.website || "",
        description: currentPractice.description || "",
        practice_type: currentPractice.practice_type || "",
        specialization: currentPractice.specialization || "",
      })
    }
  }, [currentPractice])

  const handleSave = async () => {
    if (!currentPractice?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update settings")
      }

      await refreshPractice?.()
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
                value={settings.practice_type}
                onValueChange={(value) => setSettings({ ...settings, practice_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Praxisart auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allgemeinmedizin">Allgemeinmedizin</SelectItem>
                  <SelectItem value="facharzt">Facharztpraxis</SelectItem>
                  <SelectItem value="zahnarzt">Zahnarztpraxis</SelectItem>
                  <SelectItem value="mvz">MVZ</SelectItem>
                  <SelectItem value="other">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Fachrichtung</Label>
            <Input
              id="specialization"
              value={settings.specialization}
              onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
              placeholder="z.B. Innere Medizin, Orthopädie"
            />
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
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              placeholder="Straße, PLZ Ort"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
