"use client"

import { useState, useEffect, useCallback } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { Plus, Loader2, Wrench, Calendar, FileText } from "lucide-react"
import { format, parseISO, addDays } from "date-fns"
import { de } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DeviceMaintenanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  device: any
  onSuccess: () => void
}

interface MaintenanceReport {
  id: string
  maintenance_type: string
  maintenance_date: string
  performed_by?: string
  performed_by_company?: string
  title?: string
  description?: string
  findings?: string
  actions_taken?: string
  cost?: number
  currency?: string
  status: string
  created_at: string
}

export function DeviceMaintenanceDialog({ open, onOpenChange, device, onSuccess }: DeviceMaintenanceDialogProps) {
  const { currentPractice } = usePractice()
  const [reports, setReports] = useState<MaintenanceReport[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const [formData, setFormData] = useState({
    maintenance_type: "routine",
    maintenance_date: format(new Date(), "yyyy-MM-dd"),
    performed_by: "",
    performed_by_company: device?.maintenance_service_partner || "",
    title: "",
    description: "",
    findings: "",
    actions_taken: "",
    parts_replaced: "",
    cost: "",
    next_maintenance_date: device?.maintenance_interval_days
      ? format(addDays(new Date(), device.maintenance_interval_days), "yyyy-MM-dd")
      : "",
    next_maintenance_notes: "",
  })

  const loadReports = useCallback(async () => {
    if (!currentPractice?.id || !device?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${device.id}/maintenance`)
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || [])
      }
    } catch (error) {
      console.error("[v0] Error loading maintenance reports:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id, device?.id])

  useEffect(() => {
    if (open) {
      loadReports()
      // Update form with device defaults
      setFormData((prev) => ({
        ...prev,
        performed_by_company: device?.maintenance_service_partner || "",
        next_maintenance_date: device?.maintenance_interval_days
          ? format(addDays(new Date(), device.maintenance_interval_days), "yyyy-MM-dd")
          : "",
      }))
    }
  }, [open, loadReports, device])

  const handleAddReport = async () => {
    if (!currentPractice?.id || !device?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices/${device.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: formData.cost ? Number.parseFloat(formData.cost) : null,
        }),
      })

      if (response.ok) {
        toast({
          title: "Wartungsbericht erstellt",
          description: "Der Wartungsbericht wurde erfolgreich gespeichert.",
        })
        loadReports()
        onSuccess()
        setShowAddForm(false)
        setFormData({
          maintenance_type: "routine",
          maintenance_date: format(new Date(), "yyyy-MM-dd"),
          performed_by: "",
          performed_by_company: device?.maintenance_service_partner || "",
          title: "",
          description: "",
          findings: "",
          actions_taken: "",
          parts_replaced: "",
          cost: "",
          next_maintenance_date: device?.maintenance_interval_days
            ? format(addDays(new Date(), device.maintenance_interval_days), "yyyy-MM-dd")
            : "",
          next_maintenance_notes: "",
        })
      } else {
        throw new Error("Failed to save report")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Der Wartungsbericht konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getMaintenanceTypeLabel = (type: string) => {
    switch (type) {
      case "routine":
        return "Routinewartung"
      case "repair":
        return "Reparatur"
      case "inspection":
        return "Inspektion"
      case "calibration":
        return "Kalibrierung"
      default:
        return type
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Wartung - {device?.name}
          </DialogTitle>
          <DialogDescription>Dokumentieren Sie Wartungen und Reparaturen</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Add Form */}
          {showAddForm ? (
            <div className="border rounded-lg">
              <div className="p-4">
                <h4 className="font-medium mb-4">Neuen Wartungsbericht erstellen</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Wartungsart *</Label>
                    <Select
                      value={formData.maintenance_type}
                      onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="routine">Routinewartung</SelectItem>
                        <SelectItem value="repair">Reparatur</SelectItem>
                        <SelectItem value="inspection">Inspektion</SelectItem>
                        <SelectItem value="calibration">Kalibrierung</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Wartungsdatum *</Label>
                    <Input
                      type="date"
                      value={formData.maintenance_date}
                      onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Durchgeführt von</Label>
                    <Input
                      value={formData.performed_by}
                      onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Firma</Label>
                    <Input
                      value={formData.performed_by_company}
                      onChange={(e) => setFormData({ ...formData, performed_by_company: e.target.value })}
                      placeholder="Servicefirma"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Titel</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Kurzer Titel für den Bericht"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Beschreibung</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Allgemeine Beschreibung der durchgeführten Arbeiten"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Befunde</Label>
                    <Textarea
                      value={formData.findings}
                      onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                      placeholder="Was wurde festgestellt?"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Durchgeführte Maßnahmen</Label>
                    <Textarea
                      value={formData.actions_taken}
                      onChange={(e) => setFormData({ ...formData, actions_taken: e.target.value })}
                      placeholder="Was wurde gemacht?"
                      rows={2}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Ausgetauschte Teile</Label>
                    <Input
                      value={formData.parts_replaced}
                      onChange={(e) => setFormData({ ...formData, parts_replaced: e.target.value })}
                      placeholder="z.B. Filter, Dichtungen, etc."
                    />
                  </div>
                  <div>
                    <Label>Kosten (EUR)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Nächste Wartung</Label>
                    <Input
                      type="date"
                      value={formData.next_maintenance_date}
                      onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Hinweise für nächste Wartung</Label>
                    <Input
                      value={formData.next_maintenance_notes}
                      onChange={(e) => setFormData({ ...formData, next_maintenance_notes: e.target.value })}
                      placeholder="Was sollte bei der nächsten Wartung beachtet werden?"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleAddReport} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Bericht speichern
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button onClick={() => setShowAddForm(true)} className="mb-4">
                <Plus className="h-4 w-4 mr-2" />
                Wartungsbericht erstellen
              </Button>

              {/* Reports List */}
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Wartungsberichte vorhanden</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {report.title || getMaintenanceTypeLabel(report.maintenance_type)}
                              </h4>
                              <Badge variant="outline">{getMaintenanceTypeLabel(report.maintenance_type)}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(report.maintenance_date), "dd.MM.yyyy", { locale: de })}
                              </span>
                              {report.performed_by_company && <span>• {report.performed_by_company}</span>}
                              {report.cost && (
                                <span>
                                  • {report.cost.toLocaleString("de-DE")} {report.currency || "EUR"}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge
                            className={cn(
                              report.status === "completed" && "bg-green-100 text-green-700",
                              report.status === "in_progress" && "bg-yellow-100 text-yellow-700",
                            )}
                          >
                            {report.status === "completed" ? "Abgeschlossen" : "In Bearbeitung"}
                          </Badge>
                        </div>
                        {report.description && <p className="text-sm mt-2">{report.description}</p>}
                        {report.findings && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Befunde:</span> {report.findings}
                          </div>
                        )}
                        {report.actions_taken && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <span className="font-medium">Maßnahmen:</span> {report.actions_taken}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DeviceMaintenanceDialog
