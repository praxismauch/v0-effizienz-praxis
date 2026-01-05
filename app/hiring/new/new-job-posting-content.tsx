"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AITextGenerator } from "@/components/hiring/ai-text-generator"
import { FormattedTextarea } from "@/components/formatted-textarea"
import { defaultRecruitingFields, type FormField } from "@/lib/recruiting-defaults"
import { ArrowLeft } from "lucide-react"
import { AppLayout } from "@/components/app-layout"

export default function NewJobPostingContent() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/hiring/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          practice_id: currentPractice?.id,
          created_by: currentUser?.id,
          salary_min: formData.salary_min ? Number.parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? Number.parseInt(formData.salary_max) : null,
          start_month: formData.start_month ? Number.parseInt(formData.start_month) : null,
          start_year: formData.start_year ? Number.parseInt(formData.start_year) : null,
          hours_per_week_min: formData.hours_per_week_min ? Number.parseFloat(formData.hours_per_week_min) : null,
          hours_per_week_max: formData.hours_per_week_max ? Number.parseFloat(formData.hours_per_week_max) : null,
        }),
      })

      if (response.ok) {
        router.push("/hiring?subTab=draft")
      }
    } catch (error) {
      console.error("Error creating job posting:", error)
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
  const descriptionField = getFieldSetting("description")
  const requirementsField = getFieldSetting("requirements")
  const responsibilitiesField = getFieldSetting("responsibilities")
  const benefitsField = getFieldSetting("benefits")

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/hiring")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Neue Stellenausschreibung</h1>
            <p className="text-muted-foreground mt-2">Erstellen Sie eine neue Stellenausschreibung für Ihre Praxis</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stellendetails</CardTitle>
            <CardDescription>Geben Sie die Details der neuen Position ein</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {titleField.label} {titleField.required && "*"}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Medizinische Fachangestellte (m/w/d)"
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
                        <SelectValue placeholder="Wählen..." />
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
                      placeholder="z.B. Allgemeinmedizin"
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
                      {employmentTypeField.options?.map((option) => (
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
                  placeholder="z.B. München"
                  required={locationField.required}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_month">Startmonat</Label>
                  <Select
                    value={formData.start_month}
                    onValueChange={(value) => setFormData({ ...formData, start_month: value })}
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
                  <Label htmlFor="start_year">Startjahr</Label>
                  <Select
                    value={formData.start_year}
                    onValueChange={(value) => setFormData({ ...formData, start_year: value })}
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
                  <Label htmlFor="hours_per_week_min">Stunden pro Woche (von)</Label>
                  <Input
                    id="hours_per_week_min"
                    type="number"
                    step="0.5"
                    min="0"
                    max="168"
                    value={formData.hours_per_week_min}
                    onChange={(e) => setFormData({ ...formData, hours_per_week_min: e.target.value })}
                    placeholder="z.B. 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hours_per_week_max">Stunden pro Woche (bis)</Label>
                  <Input
                    id="hours_per_week_max"
                    type="number"
                    step="0.5"
                    min="0"
                    max="168"
                    value={formData.hours_per_week_max}
                    onChange={(e) => setFormData({ ...formData, hours_per_week_max: e.target.value })}
                    placeholder="z.B. 40"
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
                    placeholder="z.B. 35000"
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
                    placeholder="z.B. 45000"
                    required={salaryMaxField.required}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
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
                  placeholder="Beschreiben Sie die Position..."
                  rows={6}
                  required={descriptionField.required}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="requirements">
                    {requirementsField.label} {requirementsField.required && "*"}
                  </Label>
                  <AITextGenerator
                    onInsert={(text) => setFormData({ ...formData, requirements: text })}
                    fieldLabel="Anforderungen"
                    context={`Position: ${formData.title}, Abteilung: ${formData.department}, Typ: ${formData.employment_type}`}
                  />
                </div>
                <FormattedTextarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(text) => setFormData({ ...formData, requirements: text })}
                  placeholder="Welche Qualifikationen werden benötigt?"
                  rows={4}
                  required={requirementsField.required}
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
                  placeholder="Was sind die Hauptaufgaben?"
                  rows={4}
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
                  placeholder="Welche Vorteile bieten Sie?"
                  rows={4}
                  required={benefitsField.required}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/hiring")}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Erstellen..." : "Stellenausschreibung erstellen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
