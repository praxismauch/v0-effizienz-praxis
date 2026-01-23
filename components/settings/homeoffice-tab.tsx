"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Home, Loader2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { HomeofficePolicy, PolicyFormData } from "@/app/settings/types"
import { WEEK_DAYS } from "@/app/settings/types"

interface HomeofficeTabProps {
  practiceId: string
  teamMembers: Array<{ id: string; name: string }>
}

export function HomeofficeTab({ practiceId, teamMembers }: HomeofficeTabProps) {
  const [policies, setPolicies] = useState<HomeofficePolicy[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showNewPolicyForm, setShowNewPolicyForm] = useState(false)
  const [newPolicy, setNewPolicy] = useState<PolicyFormData>({
    user_id: null,
    is_allowed: true,
    allowed_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    allowed_start_time: "08:00",
    allowed_end_time: "18:00",
    max_days_per_week: 2,
    requires_reason: false,
    requires_location_verification: false,
  })

  useEffect(() => {
    fetchPolicies()
  }, [practiceId])

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/homeoffice-policies`)
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      }
    } catch (error) {
      console.error("Error fetching policies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePolicy = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/homeoffice-policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPolicy),
      })
      if (response.ok) {
        toast.success("Richtlinie gespeichert")
        fetchPolicies()
        setShowNewPolicyForm(false)
        setNewPolicy({
          user_id: null,
          is_allowed: true,
          allowed_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          allowed_start_time: "08:00",
          allowed_end_time: "18:00",
          max_days_per_week: 2,
          requires_reason: false,
          requires_location_verification: false,
        })
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePolicy = async (id: string) => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/homeoffice-policies/${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Richtlinie gelöscht")
        fetchPolicies()
      }
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Homeoffice-Richtlinien
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie die Homeoffice-Regelungen für Ihre Praxis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {policies.length === 0 && !showNewPolicyForm ? (
            <div className="text-center py-8 text-muted-foreground">
              <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Noch keine Homeoffice-Richtlinien definiert</p>
            </div>
          ) : (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div key={policy.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {policy.user_id
                        ? teamMembers.find((m) => m.id === policy.user_id)?.name || "Unbekannt"
                        : "Standard-Richtlinie"}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePolicy(policy.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Max. {policy.max_days_per_week} Tage pro Woche</p>
                    <p>
                      {policy.allowed_start_time} - {policy.allowed_end_time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showNewPolicyForm && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Neue Richtlinie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Erlaubte Tage</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => (
                      <div key={day.value} className="flex items-center gap-2">
                        <Checkbox
                          checked={newPolicy.allowed_days.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewPolicy((prev) => ({
                                ...prev,
                                allowed_days: [...prev.allowed_days, day.value],
                              }))
                            } else {
                              setNewPolicy((prev) => ({
                                ...prev,
                                allowed_days: prev.allowed_days.filter((d) => d !== day.value),
                              }))
                            }
                          }}
                        />
                        <Label className="text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Max. Tage pro Woche</Label>
                    <Input
                      type="number"
                      value={newPolicy.max_days_per_week}
                      onChange={(e) =>
                        setNewPolicy((prev) => ({ ...prev, max_days_per_week: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Begründung erforderlich</Label>
                  <Switch
                    checked={newPolicy.requires_reason}
                    onCheckedChange={(checked) => setNewPolicy((prev) => ({ ...prev, requires_reason: checked }))}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSavePolicy} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Speichern
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPolicyForm(false)}>
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showNewPolicyForm && (
            <Button onClick={() => setShowNewPolicyForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Richtlinie
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
