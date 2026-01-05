"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { usePractice } from "@/contexts/practice-context"
import { Upload, X, FileText, Calculator, Palmtree } from "lucide-react"
import { put } from "@vercel/blob"
import { Card, CardContent } from "@/components/ui/card"

interface CreateContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMemberId: string
  memberName: string
  onContractCreated: (contract: any) => void
  existingContracts?: any[]
}

function CreateContractDialog({
  open,
  onOpenChange,
  teamMemberId,
  memberName,
  onContractCreated,
  existingContracts = [],
}: CreateContractDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [isInfinite, setIsInfinite] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    contract_type: "full-time",
    start_date: "",
    end_date: "",
    hours_per_week: "",
    salary: "",
    salary_currency: "EUR",
    bonus_personal_goal: "8",
    bonus_practice_goal: "7",
    bonus_employee_discussion: "5",
    notes: "",
    has_13th_salary: false,
    holiday_days_fulltime: "30",
    working_days_fulltime: "5",
  })

  const calculatedHolidayDays = useMemo(() => {
    const hoursPerWeek = Number.parseFloat(formData.hours_per_week) || 0
    const workingDaysFulltime = Number.parseInt(formData.working_days_fulltime) || 5
    const holidayDaysFulltime = Number.parseInt(formData.holiday_days_fulltime) || 30

    if (hoursPerWeek <= 0 || workingDaysFulltime <= 0) return 0

    const fullTimeHoursPerWeek = workingDaysFulltime * 8
    const workingDaysPartTime = (hoursPerWeek / fullTimeHoursPerWeek) * workingDaysFulltime

    return Math.ceil((workingDaysPartTime / workingDaysFulltime) * holidayDaysFulltime)
  }, [formData.hours_per_week, formData.working_days_fulltime, formData.holiday_days_fulltime])

  useEffect(() => {
    if (open && existingContracts.length > 0) {
      const sortedContracts = [...existingContracts]
        .filter((c) => c.end_date)
        .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())

      if (sortedContracts.length > 0) {
        const latestEndDate = new Date(sortedContracts[0].end_date)
        latestEndDate.setDate(latestEndDate.getDate() + 1)
        const defaultStartDate = latestEndDate.toISOString().split("T")[0]
        setFormData((prev) => ({ ...prev, start_date: defaultStartDate }))
      }
    } else if (open && existingContracts.length === 0) {
      setFormData((prev) => ({ ...prev, start_date: "" }))
    }
  }, [open, existingContracts])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files)
      setUploadedFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_member_id: teamMemberId,
          ...formData,
          end_date: isInfinite ? null : formData.end_date || null,
          hours_per_week: formData.hours_per_week ? Number.parseFloat(formData.hours_per_week) : null,
          salary: formData.salary ? Number.parseFloat(formData.salary) : null,
          bonus_personal_goal: formData.bonus_personal_goal ? Number.parseFloat(formData.bonus_personal_goal) : null,
          bonus_practice_goal: formData.bonus_practice_goal ? Number.parseFloat(formData.bonus_practice_goal) : null,
          bonus_employee_discussion: formData.bonus_employee_discussion
            ? Number.parseFloat(formData.bonus_employee_discussion)
            : null,
          holiday_days_fulltime: formData.holiday_days_fulltime ? Number.parseInt(formData.holiday_days_fulltime) : 30,
          working_days_fulltime: formData.working_days_fulltime ? Number.parseInt(formData.working_days_fulltime) : 5,
        }),
      })

      if (res.ok) {
        const newContract = await res.json()

        if (uploadedFiles.length > 0) {
          for (const file of uploadedFiles) {
            const blob = await put(`contracts/${newContract.id}/${file.name}`, file, {
              access: "public",
            })

            await fetch(`/api/practices/${currentPractice.id}/contracts/${newContract.id}/files`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                file_name: file.name,
                file_url: blob.url,
                file_size: file.size,
                file_type: file.type,
              }),
            })
          }
        }

        onContractCreated(newContract)
        setFormData({
          contract_type: "full-time",
          start_date: "",
          end_date: "",
          hours_per_week: "",
          salary: "",
          salary_currency: "EUR",
          bonus_personal_goal: "8",
          bonus_practice_goal: "7",
          bonus_employee_discussion: "5",
          notes: "",
          has_13th_salary: false,
          holiday_days_fulltime: "30",
          working_days_fulltime: "5",
        })
        setIsInfinite(false)
        setUploadedFiles([])
      }
    } catch (error) {
      console.error("Error creating contract:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neuer Vertrag für {memberName}</DialogTitle>
          <DialogDescription>Erstellen Sie einen neuen Arbeitsvertrag mit Gültigkeitszeitraum</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type">Vertragsart *</Label>
              <Select
                value={formData.contract_type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, contract_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Vollzeit</SelectItem>
                  <SelectItem value="part-time">Teilzeit</SelectItem>
                  <SelectItem value="temporary">Befristet</SelectItem>
                  <SelectItem value="freelance">Freiberuflich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_per_week">Wochenstunden</Label>
              <Input
                id="hours_per_week"
                type="number"
                step="0.5"
                placeholder="z.B. 40"
                value={formData.hours_per_week}
                onChange={(e) => setFormData((prev) => ({ ...prev, hours_per_week: e.target.value }))}
              />
            </div>
          </div>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Palmtree className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Urlaubsanspruch</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="working_days_fulltime" className="text-sm">
                    Arbeitstage/Woche (Vollzeit)
                  </Label>
                  <Input
                    id="working_days_fulltime"
                    type="number"
                    min="1"
                    max="7"
                    value={formData.working_days_fulltime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, working_days_fulltime: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holiday_days_fulltime" className="text-sm">
                    Urlaubstage/Jahr (Vollzeit)
                  </Label>
                  <Input
                    id="holiday_days_fulltime"
                    type="number"
                    min="0"
                    max="60"
                    value={formData.holiday_days_fulltime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, holiday_days_fulltime: e.target.value }))}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Berechneter Urlaubsanspruch</Label>
                  <div className="flex items-center gap-2 h-10 px-3 bg-white border rounded-md">
                    <Calculator className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-700">{calculatedHolidayDays} Tage</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2">
                Formel: Aufrunden(Wochenstunden ÷ {Number.parseInt(formData.working_days_fulltime) * 8}h ×{" "}
                {formData.working_days_fulltime} Tage ÷ {formData.working_days_fulltime} ×{" "}
                {formData.holiday_days_fulltime})
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum *</Label>
              <Input
                id="start_date"
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum</Label>
              <Input
                id="end_date"
                type="date"
                disabled={isInfinite}
                value={formData.end_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="infinite"
                  checked={isInfinite}
                  onCheckedChange={(checked) => {
                    setIsInfinite(checked as boolean)
                    if (checked) {
                      setFormData((prev) => ({ ...prev, end_date: "" }))
                    }
                  }}
                />
                <Label htmlFor="infinite" className="text-sm font-normal cursor-pointer">
                  Unbefristeter Vertrag
                </Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Gehalt</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="z.B. 3500.00"
                value={formData.salary}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_currency">Währung</Label>
              <Select
                value={formData.salary_currency}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, salary_currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <h4 className="font-medium text-sm">Bonus-Anteile (%)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bonus_personal_goal">Persönliches Ziel</Label>
                <Input
                  id="bonus_personal_goal"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 8"
                  value={formData.bonus_personal_goal}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bonus_personal_goal: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus_practice_goal">Praxis Ziel</Label>
                <Input
                  id="bonus_practice_goal"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 7"
                  value={formData.bonus_practice_goal}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bonus_practice_goal: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonus_employee_discussion">Mitarbeitergespräch</Label>
                <Input
                  id="bonus_employee_discussion"
                  type="number"
                  step="0.1"
                  placeholder="z.B. 5"
                  value={formData.bonus_employee_discussion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bonus_employee_discussion: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-3">
              <Checkbox
                id="has_13th_salary"
                checked={formData.has_13th_salary}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, has_13th_salary: checked as boolean }))}
              />
              <Label htmlFor="has_13th_salary" className="text-sm font-normal cursor-pointer">
                13. Gehalt (Jahresbonus in Höhe eines Monatsgehalts)
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Zusätzliche Informationen zum Vertrag..."
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Dokumente (optional)</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">Dateien hierher ziehen oder klicken zum Hochladen</p>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                Dateien auswählen
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <Label className="text-sm">Hochgeladene Dateien ({uploadedFiles.length})</Label>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Wird erstellt..." : "Vertrag erstellen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { CreateContractDialog }
export default CreateContractDialog
