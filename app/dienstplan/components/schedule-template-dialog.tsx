"use client"

import React, { useState, useEffect } from "react"
import { Plus, Trash2, Save, FileText, Copy, Calendar, Clock, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import type { ShiftType, ScheduleTemplate, ScheduleTemplateShift, DAYS_OF_WEEK } from "../types"

const DAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

interface ScheduleTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  shiftTypes: ShiftType[]
  availableRoles: string[]
  onApplyTemplate: (template: ScheduleTemplate) => void
}

export default function ScheduleTemplateDialog({
  open,
  onOpenChange,
  practiceId,
  shiftTypes: shiftTypesProp,
  availableRoles: availableRolesProp,
  onApplyTemplate,
}: ScheduleTemplateDialogProps) {
  // Add null safety guards
  const shiftTypes = shiftTypesProp || []
  const availableRoles = availableRolesProp || []
  
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("templates")
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Edit form state
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [templateShifts, setTemplateShifts] = useState<ScheduleTemplateShift[]>([])

  // Load templates on open
  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open, practiceId])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/schedule-templates`)
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      } else {
        // Gracefully handle errors (e.g. 401 auth issues) - show empty list
        console.error("Failed to load templates, status:", res.status)
        setTemplates([])
      }
    } catch (error) {
      console.error("Error loading templates:", error)
      toast({
        title: "Fehler",
        description: "Vorlagen konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateName("")
    setTemplateDescription("")
    setTemplateShifts([])
    setActiveTab("edit")
  }

  const handleEditTemplate = (template: ScheduleTemplate) => {
    setEditingTemplate(template)
    setTemplateName(template.name)
    setTemplateDescription(template.description || "")
    setTemplateShifts(template.shifts || [])
    setActiveTab("edit")
  }

  const handleAddShift = () => {
    const newShift: ScheduleTemplateShift = {
      day_of_week: 0,
      shift_type_id: (shiftTypes && shiftTypes.length > 0 && shiftTypes[0]?.id) || "",
      role_filter: undefined,
    }
    setTemplateShifts([...templateShifts, newShift])
  }

  const handleRemoveShift = (index: number) => {
    setTemplateShifts(templateShifts.filter((_, i) => i !== index))
  }

  const handleShiftChange = (index: number, field: keyof ScheduleTemplateShift, value: any) => {
    const updated = [...templateShifts]
    updated[index] = { ...updated[index], [field]: value === "all" ? undefined : value }
    setTemplateShifts(updated)
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Namen für die Vorlage ein.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      const templateData = {
        name: templateName,
        description: templateDescription,
        shifts: templateShifts,
        is_default: false,
      }

      const url = editingTemplate
        ? `/api/practices/${practiceId}/schedule-templates/${editingTemplate.id}`
        : `/api/practices/${practiceId}/schedule-templates`
      
      const res = await fetch(url, {
        method: editingTemplate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      })

      if (res.ok) {
        toast({
          title: "Erfolg",
          description: editingTemplate ? "Vorlage aktualisiert" : "Vorlage erstellt",
        })
        await loadTemplates()
        setActiveTab("templates")
      } else {
        throw new Error("Failed to save template")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/schedule-templates/${templateId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Erfolg", description: "Vorlage gelöscht" })
        await loadTemplates()
      } else {
        throw new Error("Failed to delete template")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorlage konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  const handleApplyTemplate = (template: ScheduleTemplate) => {
    onApplyTemplate(template)
    onOpenChange(false)
    toast({
      title: "Vorlage angewendet",
      description: `Die Vorlage "${template.name}" wurde auf den Wochenplan angewendet.`,
    })
  }

  const getShiftTypeName = (id: string) => {
    return shiftTypes.find((st) => st.id === id)?.name || "Unbekannt"
  }

  const getShiftTypeColor = (id: string) => {
    return shiftTypes.find((st) => st.id === id)?.color || "#6b7280"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Wochenplan-Vorlagen
          </DialogTitle>
          <DialogDescription>
            Erstellen und verwalten Sie wiederverwendbare Vorlagen für Ihren Wochenplan.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates">Vorlagen</TabsTrigger>
            <TabsTrigger value="edit">
              {editingTemplate ? "Vorlage bearbeiten" : "Neue Vorlage"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="flex justify-end mb-4">
              <Button onClick={handleNewTemplate}>
                <Plus className="h-4 w-4 mr-2" />
                Neue Vorlage
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Lädt...</div>
            ) : templates.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Noch keine Vorlagen erstellt</p>
                  <Button onClick={handleNewTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Vorlage erstellen
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {template.name}
                              {template.is_default && (
                                <Badge variant="secondary">Standard</Badge>
                              )}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="mt-1">
                                {template.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Bearbeiten
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApplyTemplate(template)}
                            >
                              <Calendar className="h-4 w-4 mr-1" />
                              Anwenden
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTemplate(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map((day, dayIndex) => {
                            const dayShifts = template.shifts?.filter(
                              (s) => s.day_of_week === dayIndex
                            ) || []
                            return dayShifts.length > 0 ? (
                              <div key={dayIndex} className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{day.slice(0, 2)}:</span>
                                {dayShifts.map((shift, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    style={{
                                      borderColor: getShiftTypeColor(shift.shift_type_id),
                                      color: getShiftTypeColor(shift.shift_type_id),
                                    }}
                                  >
                                    {getShiftTypeName(shift.shift_type_id)}
                                  </Badge>
                                ))}
                              </div>
                            ) : null
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="edit" className="mt-4">
            <div className="space-y-6">
              {/* Template Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Name der Vorlage *</Label>
                  <Input
                    id="template-name"
                    placeholder="z.B. Standard-Woche, Urlaubszeit..."
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-desc">Beschreibung</Label>
                  <Input
                    id="template-desc"
                    placeholder="Optionale Beschreibung..."
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Shift Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium">Schichten konfigurieren</h4>
                    <p className="text-xs text-muted-foreground">
                      Definieren Sie die Schichten für jeden Wochentag
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddShift}>
                    <Plus className="h-4 w-4 mr-1" />
                    Schicht hinzufügen
                  </Button>
                </div>

                {templateShifts.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Noch keine Schichten konfiguriert
                      </p>
                      <Button variant="outline" size="sm" onClick={handleAddShift}>
                        <Plus className="h-4 w-4 mr-1" />
                        Erste Schicht hinzufügen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    <div className="space-y-2">
                      {templateShifts.map((shift, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={String(shift.day_of_week)}
                            onValueChange={(val) =>
                              handleShiftChange(index, "day_of_week", parseInt(val))
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DAYS.map((day, i) => (
                                <SelectItem key={i} value={String(i)}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={shift.shift_type_id}
                            onValueChange={(val) =>
                              handleShiftChange(index, "shift_type_id", val)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {shiftTypes && shiftTypes.length > 0 ? (
                                shiftTypes.map((st) => (
                                  <SelectItem key={st.id} value={st.id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: st.color }}
                                      />
                                      {st.name}
                                    </div>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  Keine Schichttypen
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Select
                            value={shift.role_filter || "all"}
                            onValueChange={(val) =>
                              handleShiftChange(index, "role_filter", val)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Alle Rollen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Alle Rollen</SelectItem>
                              {availableRoles.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            onClick={() => handleRemoveShift(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "edit" && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setActiveTab("templates")}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveTemplate} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Speichert..." : "Vorlage speichern"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
