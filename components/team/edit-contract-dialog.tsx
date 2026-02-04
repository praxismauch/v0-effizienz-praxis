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
import { Upload, X, FileText, Trash2, Download, Eye, Calculator, Palmtree, Sun, Coins, Plus } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

interface AdditionalPayment {
  id: string
  name: string
  amount: number | string
  frequency: "monthly" | "yearly" | "one-time"
}

interface Contract {
  id: string
  team_member_id: string
  contract_type: string
  start_date: string
  end_date: string | null
  hours_per_week: number | null
  salary: number | null
  salary_currency: string
  bonus_personal_goal: number | null
  bonus_practice_goal: number | null
  bonus_employee_discussion: number | null
  notes: string | null
  is_active: boolean
  has_13th_salary?: boolean
  vacation_bonus?: number | null
  additional_payments?: AdditionalPayment[]
  holiday_days_fulltime?: number
  working_days_fulltime?: number
}

interface EditContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: Contract
  memberName: string
  onContractUpdated: (contract: Contract) => void
}

function EditContractDialog({ open, onOpenChange, contract, memberName, onContractUpdated }: EditContractDialogProps) {
  const { currentPractice } = usePractice()
  const [loading, setLoading] = useState(false)
  const [isInfinite, setIsInfinite] = useState(!contract.end_date)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [existingFiles, setExistingFiles] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<any | null>(null)
  const [additionalPayments, setAdditionalPayments] = useState<AdditionalPayment[]>(
    contract.additional_payments?.map(p => ({
      ...p,
      amount: p.amount?.toString() || ""
    })) || []
  )
  const [formData, setFormData] = useState({
    contract_type: contract.contract_type,
    start_date: contract.start_date,
    end_date: contract.end_date || "",
    hours_per_week: contract.hours_per_week?.toString() || "",
    salary: contract.salary?.toString() || "",
    salary_currency: contract.salary_currency,
    bonus_personal_goal: contract.bonus_personal_goal?.toString() || "",
    bonus_practice_goal: contract.bonus_practice_goal?.toString() || "",
    bonus_employee_discussion: contract.bonus_employee_discussion?.toString() || "",
    notes: contract.notes || "",
    has_13th_salary: contract.has_13th_salary || false,
    vacation_bonus: contract.vacation_bonus?.toString() || "",
    holiday_days_fulltime: contract.holiday_days_fulltime?.toString() || "30",
    working_days_fulltime: contract.working_days_fulltime?.toString() || "5",
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
    if (open && currentPractice?.id) {
      loadExistingFiles()
    }
  }, [open, currentPractice?.id, contract.id])

  const loadExistingFiles = async () => {
    if (!currentPractice?.id) return
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/contracts/${contract.id}/files`)
      if (res.ok) {
        const files = await res.json()
        setExistingFiles(files)
      }
    } catch (error) {
      console.error("Error loading contract files:", error)
    }
  }

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

  const deleteExistingFile = async (fileId: string) => {
    if (!currentPractice?.id) return
    try {
      const res = await fetch(`/api/practices/${currentPractice.id}/contracts/${contract.id}/files/${fileId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setExistingFiles((prev) => prev.filter((f) => f.id !== fileId))
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
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
      const res = await fetch(`/api/practices/${currentPractice.id}/contracts/${contract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          end_date: isInfinite ? null : formData.end_date || null,
          hours_per_week: formData.hours_per_week ? Number.parseFloat(formData.hours_per_week) : null,
          salary: formData.salary ? Number.parseFloat(formData.salary) : null,
          bonus_personal_goal: formData.bonus_personal_goal ? Number.parseFloat(formData.bonus_personal_goal) : null,
          bonus_practice_goal: formData.bonus_practice_goal ? Number.parseFloat(formData.bonus_practice_goal) : null,
          bonus_employee_discussion: formData.bonus_employee_discussion
            ? Number.parseFloat(formData.bonus_employee_discussion)
            : null,
          has_13th_salary: formData.has_13th_salary,
          vacation_bonus: formData.vacation_bonus ? Number.parseFloat(formData.vacation_bonus) : null,
          additional_payments: additionalPayments.length > 0 
            ? additionalPayments.map(p => ({
                id: p.id,
                name: p.name,
                amount: Number.parseFloat(p.amount as string) || 0,
                frequency: p.frequency
              }))
            : null,
          holiday_days_fulltime: formData.holiday_days_fulltime ? Number.parseInt(formData.holiday_days_fulltime) : 30,
          working_days_fulltime: formData.working_days_fulltime ? Number.parseInt(formData.working_days_fulltime) : 5,
        }),
      })

      if (res.ok) {
        const updatedContract = await res.json()

        // Upload new files using server-side API
        if (uploadedFiles.length > 0) {
          for (const file of uploadedFiles) {
            try {
              console.log("[v0] Uploading file:", file.name, file.type, file.size)
              
              // Upload file via unified server-side API
              const uploadFormData = new FormData()
              uploadFormData.append("file", file)
              uploadFormData.append("type", "general")
              uploadFormData.append("practiceId", currentPractice.id)
              
              const uploadRes = await fetch("/api/upload/unified", {
                method: "POST",
                body: uploadFormData,
              })
              
              console.log("[v0] Upload response status:", uploadRes.status)
              
              if (!uploadRes.ok) {
                const errorText = await uploadRes.text()
                console.error("[v0] File upload failed:", errorText)
                toast({
                  title: "Datei-Upload fehlgeschlagen",
                  description: errorText || "Unbekannter Fehler beim Hochladen",
                  variant: "destructive",
                })
                continue
              }
              
              const blob = await uploadRes.json()
              console.log("[v0] Upload successful:", blob)

              const fileRes = await fetch(`/api/practices/${currentPractice.id}/contracts/${contract.id}/files`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  file_name: blob.fileName || file.name,
                  file_url: blob.url,
                  file_size: blob.fileSize || file.size,
                  file_type: blob.fileType || file.type,
                }),
              })
              
              if (!fileRes.ok) {
                console.error("[v0] Failed to save file record:", await fileRes.text())
              }
            } catch (uploadError) {
              console.error("[v0] Upload exception:", uploadError)
              toast({
                title: "Upload-Fehler",
                description: "Ein Fehler ist beim Hochladen aufgetreten",
                variant: "destructive",
              })
            }
          }
        }

        onContractUpdated(updatedContract)
        setUploadedFiles([])
      }
    } catch (error) {
      console.error("Error updating contract:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vertrag bearbeiten für {memberName}</DialogTitle>
          <DialogDescription>Bearbeiten Sie die Vertragsdetails</DialogDescription>
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
              <Label htmlFor="salary">Gehalt (monatlich)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                placeholder="z.B. 3500.00"
                value={formData.salary}
                onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
              />
              {formData.salary && formData.hours_per_week && (
                <p className="text-xs text-muted-foreground">
                  Stundenlohn: {((Number(formData.salary) / (Number(formData.hours_per_week) * 4.33)).toFixed(2))} {formData.salary_currency}/h
                </p>
              )}
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

          {/* Urlaubsgeld & Zusatzzahlungen - Collapsed Section */}
          <details className="border rounded-lg">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Urlaubsgeld & Zusatzzahlungen
              {(formData.vacation_bonus || additionalPayments.length > 0) && (
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
                  {[formData.vacation_bonus && "Urlaubsgeld", additionalPayments.length > 0 && `${additionalPayments.length} Zusatzzahlung(en)`].filter(Boolean).join(", ")}
                </span>
              )}
            </summary>
            <div className="px-4 pb-4 space-y-4 border-t pt-4">
              {/* Urlaubsgeld */}
              <div className="space-y-2">
                <Label htmlFor="vacation_bonus_edit" className="text-sm flex items-center gap-2">
                  <Sun className="h-4 w-4 text-orange-500" />
                  Urlaubsgeld (jährlich)
                </Label>
                <Input
                  id="vacation_bonus_edit"
                  type="number"
                  step="0.01"
                  placeholder="z.B. 500.00"
                  value={formData.vacation_bonus}
                  onChange={(e) => setFormData((prev) => ({ ...prev, vacation_bonus: e.target.value }))}
                />
              </div>

              {/* Zusatzzahlungen */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Coins className="h-4 w-4 text-purple-500" />
                    Zusatzzahlungen
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalPayments((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), name: "", amount: "", frequency: "monthly" }
                    ])}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
                
                {additionalPayments.length > 0 && (
                  <div className="space-y-2">
                    {additionalPayments.map((payment, index) => (
                      <div key={payment.id} className="flex gap-2 items-center">
                        <Input
                          placeholder="Name"
                          value={payment.name}
                          onChange={(e) => {
                            const updated = [...additionalPayments]
                            updated[index].name = e.target.value
                            setAdditionalPayments(updated)
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Betrag"
                          value={payment.amount}
                          onChange={(e) => {
                            const updated = [...additionalPayments]
                            updated[index].amount = e.target.value
                            setAdditionalPayments(updated)
                          }}
                          className="w-24"
                        />
                        <Select
                          value={payment.frequency}
                          onValueChange={(value: "monthly" | "yearly" | "one-time") => {
                            const updated = [...additionalPayments]
                            updated[index].frequency = value
                            setAdditionalPayments(updated)
                          }}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                            <SelectItem value="yearly">Jährlich</SelectItem>
                            <SelectItem value="one-time">Einmalig</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setAdditionalPayments((prev) => prev.filter((_, i) => i !== index))}
                          className="text-destructive hover:text-destructive h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </details>

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
            <Label>Dokumente</Label>

            {/* Existing files */}
            {existingFiles.length > 0 && (
              <div className="space-y-2 mb-3">
                <Label className="text-sm text-muted-foreground">Vorhandene Dokumente</Label>
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewFile(file)}
                        title="Vorschau"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.file_url, "_blank")}
                        title="Herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteExistingFile(file.id)}
                        className="text-destructive hover:text-destructive"
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Neue Dateien hierher ziehen oder klicken zum Hochladen
              </p>
              <Input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-edit"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload-edit")?.click()}
              >
                Dateien auswählen
              </Button>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-3">
                <Label className="text-sm">Neue Dateien ({uploadedFiles.length})</Label>
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
              {loading ? "Wird gespeichert..." : "Änderungen speichern"}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* File preview dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewFile?.file_name}</DialogTitle>
          </DialogHeader>
          {previewFile?.file_type?.includes("image") ? (
            <img
              src={previewFile?.file_url || "/placeholder.svg"}
              alt={previewFile?.file_name}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
            />
          ) : previewFile?.file_type?.includes("pdf") ? (
            <iframe src={previewFile?.file_url} title={previewFile?.file_name} className="w-full h-[70vh]" />
          ) : (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Vorschau nicht verfügbar</p>
              <Button className="mt-4" onClick={() => window.open(previewFile?.file_url, "_blank")}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

export { EditContractDialog }
export default EditContractDialog
