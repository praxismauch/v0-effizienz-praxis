"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TeamMemberSelectItem } from "@/components/team-member-select-item"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { Plus, Loader2, GraduationCap, CheckCircle, AlertTriangle, User, Calendar, Pencil, Trash2 } from "lucide-react"
import { format, parseISO, isBefore } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface DeviceTrainingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any
}

interface Training {
  id: string
  team_member_id: string
  team_member_name: string
  training_date: string
  trainer_name?: string
  trainer_role?: string
  training_type: string
  valid_until?: string
  is_valid: boolean
  notes?: string
}

export function DeviceTrainingsDialog({ open, onOpenChange, device }: DeviceTrainingsDialogProps) {
  const { currentPractice } = usePractice()
  const { teamMembers } = useTeam()
  const [trainings, setTrainings] = useState<Training[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [editingTraining, setEditingTraining] = useState<Training | null>(null)

  const [formData, setFormData] = useState({
    team_member_id: "",
    training_date: format(new Date(), "yyyy-MM-dd"),
    trainer_name: "",
    trainer_role: "internal",
    training_type: "initial",
    valid_until: "",
    notes: "",
  })

  const loadTrainings = useCallback(async () => {
    if (!currentPractice?.id || !device?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${device.id}/trainings`)
      if (response.ok) {
        const data = await response.json()
        setTrainings(data.trainings || [])
      }
    } catch (error) {
      console.error("[v0] Error loading trainings:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id, device?.id])

  useEffect(() => {
    if (open) {
      loadTrainings()
    }
  }, [open, loadTrainings])

  const handleAddTraining = async () => {
    if (!formData.team_member_id || !currentPractice?.id || !device?.id) {
      toast({ title: "Fehler", description: "Bitte wählen Sie einen Mitarbeiter aus.", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const member = teamMembers.find((m: any) => m.team_member_id === formData.team_member_id || m.id === formData.team_member_id || m.user_id === formData.team_member_id)

      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${device.id}/trainings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          team_member_name: member ? `${member.first_name} ${member.last_name}` : "",
        }),
      })

      if (response.ok) {
        toast({ title: "Einweisung dokumentiert", description: "Die Einweisung wurde erfolgreich gespeichert." })
        loadTrainings()
        setShowAddForm(false)
        setFormData({
          team_member_id: "",
          training_date: format(new Date(), "yyyy-MM-dd"),
          trainer_name: "",
          trainer_role: "internal",
          training_type: "initial",
          valid_until: "",
          notes: "",
        })
      } else {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || "Failed to save training")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Einweisung konnte nicht gespeichert werden.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTraining = async (trainingId: string) => {
    if (!currentPractice?.id || !device?.id) return
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/devices/${device.id}/trainings?trainingId=${trainingId}`,
        { method: "DELETE" },
      )
      if (response.ok) {
        toast({ title: "Einweisung gelöscht" })
        loadTrainings()
      } else {
        toast({ title: "Fehler", description: "Einweisung konnte nicht gelöscht werden.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Einweisung konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const handleEditTraining = (training: Training) => {
    setEditingTraining(training)
    setFormData({
      team_member_id: training.team_member_id,
      training_date: training.training_date,
      trainer_name: training.trainer_name || "",
      trainer_role: training.trainer_type || "internal",
      training_type: training.training_type || "initial",
      valid_until: training.valid_until || "",
      notes: training.notes || "",
    })
    setShowAddForm(true)
  }

  const handleUpdateTraining = async () => {
    if (!editingTraining || !currentPractice?.id || !device?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${device.id}/trainings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTraining.id,
          training_date: formData.training_date,
          trainer_name: formData.trainer_name,
          training_type: formData.training_type,
          valid_until: formData.valid_until,
          notes: formData.notes,
        }),
      })

      if (response.ok) {
        toast({ title: "Einweisung aktualisiert" })
        setShowAddForm(false)
        setEditingTraining(null)
        loadTrainings()
      } else {
        toast({ title: "Fehler", description: "Einweisung konnte nicht aktualisiert werden.", variant: "destructive" })
      }
    } catch {
      toast({ title: "Fehler", description: "Einweisung konnte nicht aktualisiert werden.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const activeMembers = teamMembers.filter(isActiveMember)

  // Check which members have valid training
  const trainedMemberIds = new Set(
    trainings
      .filter((t) => t.is_valid && (!t.valid_until || !isBefore(parseISO(t.valid_until), new Date())))
      .map((t) => t.team_member_id),
  )

  const untrainedMembers = activeMembers.filter(
    (m) => !trainedMemberIds.has(m.id) && !trainedMemberIds.has(m.user_id || ""),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Einweisungen - {device?.name}
          </DialogTitle>
          <DialogDescription>Dokumentieren Sie Geräteeinweisungen für Ihre Teammitglieder</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{trainedMemberIds.size} eingewiesen</span>
            </div>
            {untrainedMembers.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>{untrainedMembers.length} ohne Einweisung</span>
              </div>
            )}
          </div>

          {/* Add Form */}
          {showAddForm ? (
            <div className="border rounded-lg mb-4">
              <div className="p-4">
                <h4 className="font-medium mb-4">{editingTraining ? "Einweisung bearbeiten" : "Neue Einweisung dokumentieren"}</h4>
                <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden">
                  <Label>Mitarbeiter *</Label>
                  <Select
                    value={formData.team_member_id}
                    onValueChange={(value) => setFormData({ ...formData, team_member_id: value })}
                  >
                    <SelectTrigger className="truncate">
                      <SelectValue placeholder="Mitarbeiter auswählen" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-[300px]">
                      {activeMembers.map((member) => {
                        const tmId = (member as any).team_member_id || member.id
                        if (!tmId) return null
                        const userId = member.user_id || member.id
                        const needsTraining = !trainedMemberIds.has(tmId) && !trainedMemberIds.has(userId || "")
                        return (
                          <TeamMemberSelectItem
                            key={tmId}
                            value={tmId}
                            firstName={member.first_name}
                            lastName={member.last_name}
                            avatarUrl={member.avatar_url}
                            role={needsTraining ? "(nicht eingewiesen)" : undefined}
                          />
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Einweisungsdatum *</Label>
                  <Input
                    type="date"
                    value={formData.training_date}
                    onChange={(e) => setFormData({ ...formData, training_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Einweiser-Typ</Label>
                  <Select
                    value={formData.trainer_role}
                    onValueChange={(value) => setFormData({ ...formData, trainer_role: value, trainer_name: "" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Intern</SelectItem>
                      <SelectItem value="manufacturer">Hersteller</SelectItem>
                      <SelectItem value="external">Extern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Einweiser</Label>
                  {formData.trainer_role === "internal" ? (
                    <Select
                      value={formData.trainer_name}
                      onValueChange={(value) => {
                        const member = activeMembers.find((m) => m.id === value)
                        const name = member ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : value
                        setFormData({ ...formData, trainer_name: name })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Teammitglied auswählen">
                          {formData.trainer_name || "Teammitglied auswählen"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {activeMembers
                          .filter((m) => (m.first_name || m.last_name))
                          .map((member) => {
                            const fullName = `${member.first_name || ""} ${member.last_name || ""}`.trim()
                            return (
                              <SelectItem key={member.id} value={member.id}>
                                {fullName || member.email || "Unbenannt"}
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.trainer_name}
                      onChange={(e) => setFormData({ ...formData, trainer_name: e.target.value })}
                      placeholder="Name des Einweisenden"
                    />
                  )}
                </div>
                <div>
                  <Label>Einweisungsart</Label>
                  <Select
                    value={formData.training_type}
                    onValueChange={(value) => setFormData({ ...formData, training_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Ersteinweisung</SelectItem>
                      <SelectItem value="refresher">Auffrischung</SelectItem>
                      <SelectItem value="update">Update/Änderung</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gültig bis</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Notizen</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Zusätzliche Anmerkungen..."
                    rows={2}
                  />
                </div>
              </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => { setShowAddForm(false); setEditingTraining(null) }}>
                  Abbrechen
                </Button>
                <Button onClick={editingTraining ? handleUpdateTraining : handleAddTraining} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTraining ? "Aktualisieren" : "Speichern"}
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowAddForm(true)} className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Einweisung dokumentieren
            </Button>
          )}

          {/* Trainings List */}
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : trainings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Einweisungen dokumentiert</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trainings.map((training) => {
                  const isExpired = training.valid_until && isBefore(parseISO(training.valid_until), new Date())

                  return (
                    <div
                      key={training.id}
                      className={cn(
                        "group flex items-center justify-between p-3 border rounded-lg transition-colors hover:bg-muted/30",
                        isExpired && "border-red-200 bg-red-50 hover:bg-red-50/80",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center",
                            isExpired ? "bg-red-100" : "bg-green-100",
                          )}
                        >
                          {isExpired ? (
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{training.team_member_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(training.training_date), "dd.MM.yyyy", { locale: de })}
                            {training.trainer_name && (
                              <>
                                <span>•</span>
                                <User className="h-3 w-3" />
                                {training.trainer_name}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            training.training_type === "initial" && "bg-blue-50",
                            training.training_type === "refresher" && "bg-yellow-50",
                            training.training_type === "update" && "bg-purple-50",
                          )}
                        >
                          {training.training_type === "initial"
                            ? "Ersteinweisung"
                            : training.training_type === "refresher"
                              ? "Auffrischung"
                              : "Update"}
                        </Badge>
                        {training.valid_until && (
                          <Badge variant={isExpired ? "destructive" : "outline"}>
                            {isExpired ? "Abgelaufen" : `bis ${format(parseISO(training.valid_until), "dd.MM.yyyy")}`}
                          </Badge>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditTraining(training)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTraining(training.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeviceTrainingsDialog
