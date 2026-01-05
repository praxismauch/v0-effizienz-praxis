"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { defaultRecruitingFields, type FormField } from "@/lib/recruiting-defaults"
import { AITextGenerator } from "./ai-text-generator"
import { FormattedTextarea } from "@/components/formatted-textarea"
import { SkillsSelector } from "./skills-selector"

interface JobPosting {
  id: string
  title: string
  department: string
  employment_type: string
  location: string
  salary_min: number
  salary_max: number
  start_month?: number
  start_year?: number
  hours_per_week_min?: number
  hours_per_week_max?: number
  description: string
  requirements: string
  responsibilities: string
  benefits: string
  status: string
  required_skills?: string[]
}

interface EditJobPostingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  posting: JobPosting
  onSuccess: () => void
}

export function EditJobPostingDialog({ open, onOpenChange, posting, onSuccess }: EditJobPostingDialogProps) {
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [fieldSettings, setFieldSettings] = useState<FormField[]>(defaultRecruitingFields)
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    employment_type: "full-time",
    location: "",
    salary_min: "",
    salary_max: "",
    start_month: "",
    start_year: "",
    hours_per_week_min: "",
    hours_per_week_max: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    status: "draft",
    required_skills: [] as string[],
  })

  useEffect(() => {
    if (currentPractice?.settings?.recruitingFormFields) {
      setFieldSettings(currentPractice.settings.recruitingFormFields)
    } else {
      setFieldSettings(defaultRecruitingFields)
    }
  }, [currentPractice])

  const getFieldSetting = (fieldId: string) => {
    const field = fieldSettings.find((f) => f.id === fieldId)
    return (
      field ||
      defaultRecruitingFields.find((f) => f.id === fieldId) || {
        id: fieldId,
        label: fieldId,
        type: "text",
        required: false,
      }
    )
  }

  useEffect(() => {
    if (posting) {
      setFormData({
        title: posting.title || "",
        department: posting.department || "",
        employment_type: posting.employment_type || "full-time",
        location: posting.location || "",
        salary_min: posting.salary_min?.toString() || "",
        salary_max: posting.salary_max?.toString() || "",
        start_month: posting.start_month?.toString() || "",
        start_year: posting.start_year?.toString() || "",
        hours_per_week_min: posting.hours_per_week_min?.toString() || "",
        hours_per_week_max: posting.hours_per_week_max?.toString() || "",
        description: posting.description || "",
        requirements: posting.requirements || "",
        responsibilities: posting.responsibilities || "",
        benefits: posting.benefits || "",
        status: posting.status || "draft",
        required_skills: posting.required_skills || [],
      })
    }
  }, [posting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/hiring/job-postings/${posting.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salary_min: formData.salary_min ? Number.parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? Number.parseInt(formData.salary_max) : null,
          start_month: formData.start_month ? Number.parseInt(formData.start_month) : null,
          start_year: formData.start_year ? Number.parseInt(formData.start_year) : null,
          hours_per_week_min: formData.hours_per_week_min ? Number.parseFloat(formData.hours_per_week_min) : null,
          hours_per_week_max: formData.hours_per_week_max ? Number.parseFloat(formData.hours_per_week_max) : null,
          required_skills: formData.required_skills,
        }),
      })

      if (response.ok) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("[v0] Error updating job posting:", error)
    } finally {
      setLoading(false)
    }
  }

  const months = [
    { value: "1", label: "Januar" },
    { value: "2", label: "Februar" },
    { value: "3", label: "März" },
    { value: "4", label: "April" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Dezember" },
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear + i)

  const titleField = getFieldSetting("title")
  const departmentField = getFieldSetting("department")
  const employmentTypeField = getFieldSetting("employment_type")
  const locationField = getFieldSetting("location")
  const salaryMinField = getFieldSetting("salary_min")
  const salaryMaxField = getFieldSetting("salary_max")
  const startMonthField = getFieldSetting("start_month")
  const startYearField = getFieldSetting("start_year")
  const hoursMinField = getFieldSetting("hours_per_week_min")
  const hoursMaxField = getFieldSetting("hours_per_week_max")
  const descriptionField = getFieldSetting("description")
  const responsibilitiesField = getFieldSetting("responsibilities")
  const benefitsField = getFieldSetting("benefits")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("hiring.editJobPostingDialog.title", "Stellenausschreibung bearbeiten")}</DialogTitle>
          <DialogDescription>
            {t("hiring.editJobPostingDialog.description", "Aktualisieren Sie die Details der Stellenausschreibung")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="status">{t("hiring.editJobPostingDialog.status", "Status")}</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t("hiring.editJobPostingDialog.statusDraft", "Entwurf")}</SelectItem>
                <SelectItem value="published">
                  {t("hiring.editJobPostingDialog.statusPublished", "Veröffentlicht")}
                </SelectItem>
                <SelectItem value="closed">{t("hiring.editJobPostingDialog.statusClosed", "Geschlossen")}</SelectItem>
                <SelectItem value="filled">{t("hiring.editJobPostingDialog.statusFilled", "Besetzt")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">
              {titleField.label} {titleField.required && "*"}
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required={titleField.required}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">
                {departmentField.label} {departmentField.required && "*"}
              </Label>
              {departmentField.type === "select" ? (
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                  required={departmentField.required}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentField.options
                      ?.filter((opt) => opt.value !== "")
                      .map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required={departmentField.required}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">
                {employmentTypeField.label} {employmentTypeField.required && "*"}
              </Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                required={employmentTypeField.required}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypeField.options
                    ?.filter((opt) => opt.value !== "")
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">
              {locationField.label} {locationField.required && "*"}
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              required={locationField.required}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_month">
                {startMonthField.label} {startMonthField.required && "*"}
              </Label>
              <Select
                value={formData.start_month}
                onValueChange={(value) => setFormData({ ...formData, start_month: value })}
                required={startMonthField.required}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Monat wählen" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_year">
                {startYearField.label} {startYearField.required && "*"}
              </Label>
              <Select
                value={formData.start_year}
                onValueChange={(value) => setFormData({ ...formData, start_year: value })}
                required={startYearField.required}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Jahr wählen" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours_per_week_min">
                {hoursMinField.label} {hoursMinField.required && "*"}
              </Label>
              <Input
                id="hours_per_week_min"
                type="number"
                step="0.5"
                min="0"
                max="168"
                value={formData.hours_per_week_min}
                onChange={(e) => setFormData({ ...formData, hours_per_week_min: e.target.value })}
                placeholder="z.B. 20"
                required={hoursMinField.required}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours_per_week_max">
                {hoursMaxField.label} {hoursMaxField.required && "*"}
              </Label>
              <Input
                id="hours_per_week_max"
                type="number"
                step="0.5"
                min="0"
                max="168"
                value={formData.hours_per_week_max}
                onChange={(e) => setFormData({ ...formData, hours_per_week_max: e.target.value })}
                placeholder="z.B. 40"
                required={hoursMaxField.required}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_min">
                {salaryMinField.label} {salaryMinField.required && "*"}
              </Label>
              <Input
                id="salary_min"
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                required={salaryMinField.required}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary_max">
                {salaryMaxField.label} {salaryMaxField.required && "*"}
              </Label>
              <Input
                id="salary_max"
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                required={salaryMaxField.required}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="description">
                {descriptionField.label} {descriptionField.required && "*"}
              </Label>
              <AITextGenerator
                onInsert={(text) => setFormData({ ...formData, description: text })}
                fieldLabel="Stellenbeschreibung"
                context={`Position: ${formData.title}, Abteilung: ${formData.department}, Typ: ${formData.employment_type}`}
              />
            </div>
            <FormattedTextarea
              id="description"
              value={formData.description}
              onChange={(text) => setFormData({ ...formData, description: text })}
              rows={4}
              required={descriptionField.required}
            />
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <SkillsSelector
              selectedSkillIds={formData.required_skills}
              onSelectionChange={(skillIds) => setFormData({ ...formData, required_skills: skillIds })}
              placeholder="Erforderliche Skills auswählen..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="responsibilities">
                {responsibilitiesField.label} {responsibilitiesField.required && "*"}
              </Label>
              <AITextGenerator
                onInsert={(text) => setFormData({ ...formData, responsibilities: text })}
                fieldLabel="Aufgaben"
                context={`Position: ${formData.title}, Abteilung: ${formData.department}, Typ: ${formData.employment_type}`}
              />
            </div>
            <FormattedTextarea
              id="responsibilities"
              value={formData.responsibilities}
              onChange={(text) => setFormData({ ...formData, responsibilities: text })}
              rows={3}
              required={responsibilitiesField.required}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="benefits">
                {benefitsField.label} {benefitsField.required && "*"}
              </Label>
              <AITextGenerator
                onInsert={(text) => setFormData({ ...formData, benefits: text })}
                fieldLabel="Benefits"
                context={`Position: ${formData.title}, Abteilung: ${formData.department}, Typ: ${formData.employment_type}`}
              />
            </div>
            <FormattedTextarea
              id="benefits"
              value={formData.benefits}
              onChange={(text) => setFormData({ ...formData, benefits: text })}
              rows={3}
              required={benefitsField.required}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t("common.saving", "Saving...") : t("common.save", "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
