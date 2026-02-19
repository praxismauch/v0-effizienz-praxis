"use client"

import React from "react"
import { Plus, Trash2, Save, FileText, Calendar, Clock } from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useScheduleTemplates } from "../hooks/use-schedule-templates"
import type { ShiftType, ScheduleTemplate } from "../types"

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
  open, onOpenChange, practiceId, shiftTypes: shiftTypesProp,
  availableRoles: availableRolesProp, onApplyTemplate,
}: ScheduleTemplateDialogProps) {
  const shiftTypes = shiftTypesProp || []
  const availableRoles = availableRolesProp || []
  const { toast } = useToast()

  const {
    templates, isLoading, isSaving, activeTab, setActiveTab,
    editingTemplate, templateName, setTemplateName,
    templateDescription, setTemplateDescription, templateShifts,
    handleNewTemplate, handleEditTemplate, handleAddShift,
    handleRemoveShift, handleShiftChange, handleSaveTemplate,
    handleDeleteTemplate, getShiftTypeName, getShiftTypeColor,
  } = useScheduleTemplates(practiceId, shiftTypes, open)

  const handleApplyTemplate = (template: ScheduleTemplate) => {
    onApplyTemplate(template)
    onOpenChange(false)
    toast({
      title: "Vorlage angewendet",
      description: `Die Vorlage "${template.name}" wurde auf den Wochenplan angewendet.`,
    })
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
                              {template.is_default && <Badge variant="secondary">Standard</Badge>}
                            </CardTitle>
                            {template.description && (
                              <CardDescription className="mt-1">{template.description}</CardDescription>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                              <FileText className="h-4 w-4 mr-1" />
                              Bearbeiten
                            </Button>
                            <Button variant="default" size="sm" onClick={() => handleApplyTemplate(template)}>
                              <Calendar className="h-4 w-4 mr-1" />
                              Anwenden
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map((day, dayIndex) => {
                            const dayShifts = template.shifts?.filter((s) => s.day_of_week === dayIndex) || []
                            return dayShifts.length > 0 ? (
                              <div key={dayIndex} className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{day.slice(0, 2)}:</span>
                                {dayShifts.map((shift, idx) => (
                                  <Badge key={idx} variant="outline" style={{
                                    borderColor: getShiftTypeColor(shift.shift_type_id),
                                    color: getShiftTypeColor(shift.shift_type_id),
                                  }}>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Name der Vorlage *</Label>
                  <Input id="template-name" placeholder="z.B. Standard-Woche, Urlaubszeit..." value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="template-desc">Beschreibung</Label>
                  <Input id="template-desc" placeholder="Optionale Beschreibung..." value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} />
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium">Schichten konfigurieren</h4>
                    <p className="text-xs text-muted-foreground">Definieren Sie die Schichten für jeden Wochentag</p>
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
                      <p className="text-sm text-muted-foreground mb-2">Noch keine Schichten konfiguriert</p>
                      <Button variant="outline" size="sm" onClick={handleAddShift}>
                        <Plus className="h-4 w-4 mr-1" />
                        Erste Schicht hinzufügen
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {templateShifts.map((shift, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Select value={String(shift.day_of_week)} onValueChange={(val) => handleShiftChange(index, "day_of_week", parseInt(val))}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DAYS.map((day, i) => <SelectItem key={i} value={String(i)}>{day}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={shift.shift_type_id} onValueChange={(val) => handleShiftChange(index, "shift_type_id", val)}>
                          <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {shiftTypes.length > 0 ? shiftTypes.map((st) => (
                              <SelectItem key={st.id} value={st.id}>
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: st.color }} />
                                  {st.name}
                                </div>
                              </SelectItem>
                            )) : <SelectItem value="" disabled>Keine Schichttypen</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Select value={shift.role_filter || "all"} onValueChange={(val) => handleShiftChange(index, "role_filter", val)}>
                          <SelectTrigger className="flex-1"><SelectValue placeholder="Alle Rollen" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Alle Rollen</SelectItem>
                            {availableRoles.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveShift(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "edit" && (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setActiveTab("templates")}>Abbrechen</Button>
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
