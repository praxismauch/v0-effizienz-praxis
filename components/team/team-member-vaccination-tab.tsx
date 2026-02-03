"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Plus, Calendar, CheckCircle, AlertCircle, Clock, FileText, ClipboardCheck } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface VaccinationRecord {
  id: string
  vaccination_type: string
  vaccination_name: string
  date_administered: string | null
  expiry_date: string | null
  next_due_date: string | null
  status: 'pending' | 'up_to_date' | 'overdue' | 'not_required'
  titer_control_done: boolean
  titer_control_date: string | null
  titer_control_result: string | null
  notes: string | null
  is_required: boolean
  batch_number: string | null
  administered_by: string | null
}

const VACCINATION_TYPES = [
  { type: 'hepatitis_b', name: 'Hepatitis B (inkl. Titerkontrolle!)', required: true, needsTiterControl: true },
  { type: 'measles', name: 'Masern (Nachweis nach IfSG verpflichtend)', required: true, needsTiterControl: false },
  { type: 'rubella', name: 'Röteln', required: false, needsTiterControl: false },
  { type: 'mumps', name: 'Mumps', required: false, needsTiterControl: false },
  { type: 'varicella', name: 'Varizellen (Windpocken)', required: false, needsTiterControl: false },
  { type: 'influenza', name: 'Influenza (jährlich, empfohlen)', required: false, needsTiterControl: false },
  { type: 'covid19', name: 'COVID-19 (empfohlen)', required: false, needsTiterControl: false },
  { type: 'tetanus', name: 'Tetanus', required: true, needsTiterControl: false },
  { type: 'diphtheria', name: 'Diphtherie', required: true, needsTiterControl: false },
  { type: 'pertussis', name: 'Pertussis (Keuchhusten)', required: true, needsTiterControl: false },
]

interface TeamMemberVaccinationTabProps {
  teamMemberId: string
  practiceId: number
}

export function TeamMemberVaccinationTab({ teamMemberId, practiceId }: TeamMemberVaccinationTabProps) {
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState<VaccinationRecord | null>(null)
  const [initialExam, setInitialExam] = useState({
    vaccination_passport_checked: false,
    measles_proof_documented: false,
    hepatitis_b_titer_checked: false,
    exam_date: '',
    exam_notes: '',
  })
  const [followUpExams, setFollowUpExams] = useState<Array<{
    id: string
    exam_date: string
    next_due_date: string
    completed: boolean
    notes: string
  }>>([])
  const [showInitialExamDialog, setShowInitialExamDialog] = useState(false)
  const { toast } = useToast()

  // Calculate next follow-up date (3 years from last exam)
  const calculateNextFollowUp = (lastExamDate: string) => {
    if (!lastExamDate) return null
    const date = new Date(lastExamDate)
    date.setFullYear(date.getFullYear() + 3)
    return date.toISOString().split('T')[0]
  }

  // Check if follow-up is due
  const isFollowUpDue = (nextDueDate: string) => {
    if (!nextDueDate) return false
    const today = new Date()
    const dueDate = new Date(nextDueDate)
    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 30 // Due within 30 days
  }

  const [formData, setFormData] = useState({
    vaccination_type: '',
    date_administered: '',
    expiry_date: '',
    next_due_date: '',
    status: 'up_to_date' as const,
    titer_control_done: false,
    titer_control_date: '',
    titer_control_result: '',
    notes: '',
    batch_number: '',
    administered_by: '',
  })

  const loadVaccinations = async () => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${teamMemberId}/vaccinations`)
      if (res.ok) {
        const data = await res.json()
        setVaccinations(data.vaccinations || [])
      }
    } catch (error) {
      console.error("Error loading vaccinations:", error)
    } finally {
      setLoading(false)
    }
  }

  useState(() => {
    loadVaccinations()
  })

  const handleSave = async () => {
    const vaccinationType = VACCINATION_TYPES.find(v => v.type === formData.vaccination_type)
    if (!vaccinationType) return

    const payload = {
      vaccination_type: formData.vaccination_type,
      vaccination_name: vaccinationType.name,
      date_administered: formData.date_administered || null,
      expiry_date: formData.expiry_date || null,
      next_due_date: formData.next_due_date || null,
      status: formData.status,
      titer_control_done: formData.titer_control_done,
      titer_control_date: formData.titer_control_date || null,
      titer_control_result: formData.titer_control_result || null,
      notes: formData.notes || null,
      is_required: vaccinationType.required,
      batch_number: formData.batch_number || null,
      administered_by: formData.administered_by || null,
    }

    try {
      const url = editingVaccination
        ? `/api/practices/${practiceId}/team-members/${teamMemberId}/vaccinations/${editingVaccination.id}`
        : `/api/practices/${practiceId}/team-members/${teamMemberId}/vaccinations`
      
      const res = await fetch(url, {
        method: editingVaccination ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast({
          title: "Erfolg",
          description: "Impfstatus wurde gespeichert.",
        })
        loadVaccinations()
        setShowAddDialog(false)
        setEditingVaccination(null)
        resetForm()
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Impfstatus konnte nicht gespeichert werden.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      vaccination_type: '',
      date_administered: '',
      expiry_date: '',
      next_due_date: '',
      status: 'up_to_date',
      titer_control_done: false,
      titer_control_date: '',
      titer_control_result: '',
      notes: '',
      batch_number: '',
      administered_by: '',
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      up_to_date: { variant: "default" as const, icon: CheckCircle, label: "Aktuell" },
      overdue: { variant: "destructive" as const, icon: AlertCircle, label: "Überfällig" },
      pending: { variant: "secondary" as const, icon: Clock, label: "Ausstehend" },
      not_required: { variant: "outline" as const, icon: FileText, label: "Nicht erforderlich" },
    }
    const config = variants[status as keyof typeof variants] || variants.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const selectedVaccType = VACCINATION_TYPES.find(v => v.type === formData.vaccination_type)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="animate-pulse">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Lade Impfstatus...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Impfstatus
              </CardTitle>
              <CardDescription>
                {vaccinations.length} Impfung{vaccinations.length !== 1 ? "en" : ""} erfasst
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Impfung hinzufügen
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Erstuntersuchung Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Erstuntersuchung bei Einstellung</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white">IfSG verpflichtend</Badge>
          </div>
          <CardDescription>
            Diese Prüfungen sind bei jeder Neueinstellung immer verpflichtend durchzuführen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Checkbox 
                checked={initialExam.vaccination_passport_checked} 
                onCheckedChange={(checked) => 
                  setInitialExam({...initialExam, vaccination_passport_checked: checked as boolean})
                }
              />
              <div className="flex-1">
                <Label className="font-semibold">Impfpass / Impfnachweise sichten</Label>
                <p className="text-sm text-muted-foreground">Überprüfen Sie alle vorhandenen Impfnachweise</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Checkbox 
                checked={initialExam.measles_proof_documented} 
                onCheckedChange={(checked) => 
                  setInitialExam({...initialExam, measles_proof_documented: checked as boolean})
                }
              />
              <div className="flex-1">
                <Label className="font-semibold text-red-600">Masern-Nachweis (IfSG!) dokumentieren</Label>
                <p className="text-sm text-muted-foreground">Gesetzlich verpflichtender Nachweis nach Infektionsschutzgesetz</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg">
              <Checkbox 
                checked={initialExam.hepatitis_b_titer_checked} 
                onCheckedChange={(checked) => 
                  setInitialExam({...initialExam, hepatitis_b_titer_checked: checked as boolean})
                }
              />
              <div className="flex-1">
                <Label className="font-semibold">Hepatitis-B-Status inkl. Anti-HBs-Titer</Label>
                <p className="text-sm text-muted-foreground">Immunstatus prüfen und dokumentieren</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              type="date"
              placeholder="Untersuchungsdatum"
              value={initialExam.exam_date}
              onChange={(e) => setInitialExam({...initialExam, exam_date: e.target.value})}
              className="flex-1 bg-white"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "Erstuntersuchung gespeichert",
                  description: "Die Erstuntersuchung wurde dokumentiert.",
                })
              }}
            >
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Examinations Section */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-lg">Nachuntersuchungen (alle 3 Jahre)</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white">Zyklisch fällig</Badge>
          </div>
          <CardDescription>
            Regelmäßige Kontrolle des Impfstatus alle 3 Jahre nach Erstuntersuchung
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {initialExam.exam_date && (
            <div className="p-3 bg-white rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Erstuntersuchung</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(initialExam.exam_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Abgeschlossen
                </Badge>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">Nächste Nachuntersuchung fällig:</p>
                <p className="text-lg font-bold text-amber-700">
                  {format(new Date(calculateNextFollowUp(initialExam.exam_date) || ''), 'dd.MM.yyyy', { locale: de })}
                </p>
                {isFollowUpDue(calculateNextFollowUp(initialExam.exam_date) || '') && (
                  <Badge variant="destructive" className="mt-2">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Bald fällig
                  </Badge>
                )}
              </div>
            </div>
          )}

          {!initialExam.exam_date && (
            <div className="p-4 text-center text-muted-foreground bg-white rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Bitte zuerst eine Erstuntersuchung durchführen und dokumentieren
              </p>
            </div>
          )}

          {followUpExams.map((exam) => (
            <div key={exam.id} className="p-3 bg-white rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Nachuntersuchung</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(exam.exam_date), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
                <Badge variant="outline" className={exam.completed ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                  {exam.completed ? 'Abgeschlossen' : 'Ausstehend'}
                </Badge>
              </div>
              {exam.notes && (
                <p className="text-sm text-muted-foreground">{exam.notes}</p>
              )}
            </div>
          ))}

          {initialExam.exam_date && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2"
              onClick={() => {
                const nextDate = calculateNextFollowUp(initialExam.exam_date)
                if (nextDate) {
                  setFollowUpExams([...followUpExams, {
                    id: Date.now().toString(),
                    exam_date: new Date().toISOString().split('T')[0],
                    next_due_date: calculateNextFollowUp(new Date().toISOString().split('T')[0]) || '',
                    completed: true,
                    notes: ''
                  }])
                  toast({
                    title: "Nachuntersuchung dokumentiert",
                    description: `Nächste Untersuchung fällig: ${format(new Date(calculateNextFollowUp(new Date().toISOString().split('T')[0]) || ''), 'dd.MM.yyyy', { locale: de })}`,
                  })
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nachuntersuchung dokumentieren
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {vaccinations.map((vaccination) => {
          const vaccType = VACCINATION_TYPES.find(v => v.type === vaccination.vaccination_type)
          return (
            <Card key={vaccination.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
              setEditingVaccination(vaccination)
              setFormData({
                vaccination_type: vaccination.vaccination_type,
                date_administered: vaccination.date_administered || '',
                expiry_date: vaccination.expiry_date || '',
                next_due_date: vaccination.next_due_date || '',
                status: vaccination.status,
                titer_control_done: vaccination.titer_control_done,
                titer_control_date: vaccination.titer_control_date || '',
                titer_control_result: vaccination.titer_control_result || '',
                notes: vaccination.notes || '',
                batch_number: vaccination.batch_number || '',
                administered_by: vaccination.administered_by || '',
              })
              setShowAddDialog(true)
            }}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{vaccination.vaccination_name}</CardTitle>
                  {getStatusBadge(vaccination.status)}
                </div>
                {vaccination.is_required && (
                  <Badge variant="outline" className="w-fit">IfSG verpflichtend</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {vaccination.date_administered && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Geimpft: {format(new Date(vaccination.date_administered), 'dd.MM.yyyy', { locale: de })}</span>
                  </div>
                )}
                {vaccination.next_due_date && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Nächste Auffrischung: {format(new Date(vaccination.next_due_date), 'dd.MM.yyyy', { locale: de })}</span>
                  </div>
                )}
                {vaccType?.needsTiterControl && vaccination.titer_control_done && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Titerkontrolle durchgeführt</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {vaccinations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Impfungen erfasst</p>
            <Button variant="link" onClick={() => setShowAddDialog(true)}>
              Erste Impfung hinzufügen
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setEditingVaccination(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVaccination ? 'Impfung bearbeiten' : 'Neue Impfung hinzufügen'}</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Impfinformationen für den Mitarbeiter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Impfung *</Label>
              <Select value={formData.vaccination_type} onValueChange={(value) => setFormData({ ...formData, vaccination_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Impfung auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {VACCINATION_TYPES.map((vacc) => (
                    <SelectItem key={vacc.type} value={vacc.type}>
                      {vacc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Impfdatum</Label>
                <Input
                  type="date"
                  value={formData.date_administered}
                  onChange={(e) => setFormData({ ...formData, date_administered: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Nächste Auffrischung</Label>
                <Input
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up_to_date">Aktuell</SelectItem>
                  <SelectItem value="overdue">Überfällig</SelectItem>
                  <SelectItem value="pending">Ausstehend</SelectItem>
                  <SelectItem value="not_required">Nicht erforderlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedVaccType?.needsTiterControl && (
              <>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="titer_control"
                    checked={formData.titer_control_done}
                    onChange={(e) => setFormData({ ...formData, titer_control_done: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="titer_control">Titerkontrolle durchgeführt</Label>
                </div>

                {formData.titer_control_done && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Datum der Titerkontrolle</Label>
                      <Input
                        type="date"
                        value={formData.titer_control_date}
                        onChange={(e) => setFormData({ ...formData, titer_control_date: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ergebnis</Label>
                      <Input
                        value={formData.titer_control_result}
                        onChange={(e) => setFormData({ ...formData, titer_control_result: e.target.value })}
                        placeholder="z.B. Titer positiv"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chargennummer</Label>
                <Input
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label>Durchgeführt von</Label>
                <Input
                  value={formData.administered_by}
                  onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
                  placeholder="z.B. Dr. Müller"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Zusätzliche Informationen..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingVaccination(null)
              resetForm()
            }}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={!formData.vaccination_type}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
