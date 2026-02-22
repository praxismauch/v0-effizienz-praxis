"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarDays, Loader2, Save, ShieldCheck, X, UserPlus, Check, ChevronsUpDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar_url?: string
}

interface DienstplanSettings {
  plannerDays: 5 | 6 | 7
  adminUserIds: string[]
}

const DEFAULT_SETTINGS: DienstplanSettings = {
  plannerDays: 5,
  adminUserIds: [],
}

export function DienstplanSettingsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<DienstplanSettings>(DEFAULT_SETTINGS)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [adminPopoverOpen, setAdminPopoverOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadData = async () => {
      if (!currentPractice?.id) return
      setLoading(true)
      try {
        const [settingsRes, teamRes] = await Promise.all([
          fetch(`/api/practices/${currentPractice.id}/settings`),
          fetch(`/api/practices/${currentPractice.id}/team-members`),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          const systemSettings = data?.settings?.system_settings
          if (systemSettings?.dienstplan) {
            setSettings({
              plannerDays: systemSettings.dienstplan.plannerDays || 5,
              adminUserIds: systemSettings.dienstplan.adminUserIds || [],
            })
          }
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json()
          const members = (teamData.members || teamData || []).map((m: any) => ({
            id: m.id,
            name: m.name || `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unbekannt",
            role: m.role || m.position || "",
            avatar_url: m.avatar_url || m.image_url || "",
          }))
          setTeamMembers(members)
        }
      } catch (error) {
        console.error("Error loading dienstplan settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [currentPractice?.id])

  const toggleAdmin = (memberId: string) => {
    setSettings((prev) => ({
      ...prev,
      adminUserIds: prev.adminUserIds.includes(memberId)
        ? prev.adminUserIds.filter((id) => id !== memberId)
        : [...prev.adminUserIds, memberId],
    }))
  }

  const removeAdmin = (memberId: string) => {
    setSettings((prev) => ({
      ...prev,
      adminUserIds: prev.adminUserIds.filter((id) => id !== memberId),
    }))
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.role || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedAdmins = teamMembers.filter((m) => settings.adminUserIds.includes(m.id))

  const handleSave = async () => {
    if (!currentPractice?.id) return
    setSaving(true)
    try {
      // First load existing system_settings to merge
      const getResponse = await fetch(`/api/practices/${currentPractice.id}/settings`)
      let existingSystemSettings = {}
      if (getResponse.ok) {
        const data = await getResponse.json()
        existingSystemSettings = data?.settings?.system_settings || {}
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            ...existingSystemSettings,
            dienstplan: settings,
          },
        }),
      })

      if (response.ok) {
        toast({
          title: "Gespeichert",
          description: "Dienstplan-Einstellungen wurden erfolgreich gespeichert",
        })
      } else {
        throw new Error("Save failed")
      }
    } catch (error) {
      console.error("Error saving dienstplan settings:", error)
      toast({
        title: "Fehler",
        description: "Dienstplan-Einstellungen konnten nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Dienstplan-Einstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie die Grundeinstellungen fur Ihren Dienstplan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Planner Days */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Arbeitstage im Planer</Label>
            <p className="text-sm text-muted-foreground">
              Legen Sie fest, wie viele Tage pro Woche im Dienstplan angezeigt werden sollen.
            </p>
            <RadioGroup
              value={String(settings.plannerDays)}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, plannerDays: Number(val) as 5 | 6 | 7 }))
              }
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <Label
                htmlFor="days-5"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 5
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="5" id="days-5" className="sr-only" />
                <span className="text-2xl font-bold">5</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - Fr</span>
              </Label>
              <Label
                htmlFor="days-6"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 6
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="6" id="days-6" className="sr-only" />
                <span className="text-2xl font-bold">6</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - Sa</span>
              </Label>
              <Label
                htmlFor="days-7"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 7
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="7" id="days-7" className="sr-only" />
                <span className="text-2xl font-bold">7</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - So</span>
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Dienstplan Admin Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Dienstplan-Verantwortliche
          </CardTitle>
          <CardDescription>
            Bestimmen Sie, welche Teammitglieder den Dienstplan bearbeiten und verwalten dürfen.
            Diese Personen können Schichten erstellen, bearbeiten und Mitarbeitern zuweisen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected admins display */}
          {selectedAdmins.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Aktuell ausgewählt ({selectedAdmins.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedAdmins.map((admin) => (
                  <Badge
                    key={admin.id}
                    variant="secondary"
                    className="pl-1 pr-1 py-1 gap-2 text-sm"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={admin.avatar_url} />
                      <AvatarFallback className="text-[10px]">
                        {getInitials(admin.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{admin.name}</span>
                    {admin.role && (
                      <span className="text-muted-foreground text-xs">({admin.role})</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAdmin(admin.id)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add admin popover */}
          <Popover open={adminPopoverOpen} onOpenChange={setAdminPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 w-full justify-between">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  {selectedAdmins.length === 0
                    ? "Verantwortliche auswaehlen..."
                    : "Weitere hinzufuegen..."}
                </span>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-2 border-b">
                <input
                  type="text"
                  placeholder="Teammitglied suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Teammitglieder gefunden
                  </p>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = settings.adminUserIds.includes(member.id)
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleAdmin(member.id)}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-md px-2 py-2 text-left text-sm transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{member.name}</p>
                          {member.role && (
                            <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                          )}
                        </div>
                        {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </button>
                    )
                  })
                )}
              </div>
            </PopoverContent>
          </Popover>

          {selectedAdmins.length === 0 && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              Noch keine Verantwortlichen ausgewählt. Ohne Zuweisung können nur Admins und Praxisinhaber den Dienstplan bearbeiten.
            </p>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Einstellungen speichern
      </Button>
    </div>
  )
}
