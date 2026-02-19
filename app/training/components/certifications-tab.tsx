"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Award, Edit, Trash2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { toast } from "sonner"
import type { Certification } from "../types"
import { INITIAL_CERTIFICATION_FORM, COURSE_CATEGORIES } from "../types"

interface CertificationsTabProps {
  certifications: Certification[]
  practiceId: string
  onCertificationsChange: React.Dispatch<React.SetStateAction<Certification[]>>
  onDelete: (id: string, name: string) => void
  createTrigger?: number
}

export function CertificationsTab({ certifications, practiceId, onCertificationsChange, onDelete, createTrigger }: CertificationsTabProps) {
  const { currentUser } = useUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [formData, setFormData] = useState(INITIAL_CERTIFICATION_FORM)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (createTrigger && createTrigger > 0) openCreate()
  }, [createTrigger])

  const openCreate = () => {
    setEditingCert(null)
    setFormData(INITIAL_CERTIFICATION_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (cert: Certification) => {
    setEditingCert(cert)
    setFormData({
      name: cert.name || "",
      description: cert.description || "",
      issuing_authority: cert.issuing_authority || "",
      category: cert.category || "pflicht",
      validity_months: cert.validity_months || 12,
      is_mandatory: cert.is_mandatory || false,
      reminder_days_before: cert.renewal_reminder_days || cert.reminder_days_before || 30,
      icon: cert.icon || "award",
      color: cert.color || "blue",
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein.")
      return
    }

    setIsSaving(true)
    try {
      if (editingCert) {
        const res = await fetch(`/api/practices/${practiceId}/training/certifications/${editingCert.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!res.ok) throw new Error("Update failed")
        const data = await res.json()
        onCertificationsChange((prev) => prev.map((c) => (c.id === editingCert.id ? { ...c, ...data.certification } : c)))
        toast.success("Zertifizierung aktualisiert")
      } else {
        const res = await fetch(`/api/practices/${practiceId}/training/certifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, created_by: currentUser?.id }),
        })
        if (!res.ok) throw new Error("Create failed")
        const data = await res.json()
        onCertificationsChange((prev) => [...prev, data.certification])
        toast.success("Zertifizierung erstellt")
      }
      setIsDialogOpen(false)
    } catch {
      toast.error(editingCert ? "Fehler beim Aktualisieren" : "Fehler beim Erstellen")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
  <div className="space-y-4">
  {certifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Keine Zertifizierungen gefunden</p>
            <p className="text-sm text-muted-foreground mb-4">Definieren Sie erforderliche Zertifizierungen</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Zertifizierung erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription>{cert.issuing_authority}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={cert.is_mandatory ? "destructive" : "secondary"}>
                    {cert.is_mandatory ? "Pflicht" : "Optional"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {cert.description && <p className="text-sm text-muted-foreground mb-4">{cert.description}</p>}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gültigkeit:</span>
                    <span>{cert.validity_months || 12} Monate</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Erinnerung:</span>
                    <span>{cert.renewal_reminder_days || cert.reminder_days_before || 30} Tage vorher</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(cert)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive bg-transparent"
                    onClick={() => onDelete(cert.id, cert.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCert ? "Zertifizierung bearbeiten" : "Neue Zertifizierung"}</DialogTitle>
            <DialogDescription>
              {editingCert ? "Passen Sie die Zertifizierungsdetails an." : "Definieren Sie eine neue Zertifizierung für Ihr Team."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="z.B. Erste-Hilfe-Kurs" />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={formData.description} onChange={(e) => updateField("description", e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Ausstellende Stelle</Label>
              <Input value={formData.issuing_authority} onChange={(e) => updateField("issuing_authority", e.target.value)} placeholder="z.B. Deutsches Rotes Kreuz" />
            </div>
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={formData.category} onValueChange={(v) => updateField("category", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pflicht">Pflicht</SelectItem>
                  {COURSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gültigkeit (Monate)</Label>
                <Input type="number" min="1" value={formData.validity_months} onChange={(e) => updateField("validity_months", parseInt(e.target.value) || 12)} />
              </div>
              <div className="space-y-2">
                <Label>Erinnerung (Tage vorher)</Label>
                <Input type="number" min="1" value={formData.reminder_days_before} onChange={(e) => updateField("reminder_days_before", parseInt(e.target.value) || 30)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Pflichtzertifizierung</Label>
              <Switch checked={formData.is_mandatory} onCheckedChange={(v) => updateField("is_mandatory", v)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Speichern..." : editingCert ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
