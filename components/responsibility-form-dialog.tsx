"use client"

import type React from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { usePractice } from "@/contexts/practice-context"
import { useEffect, useState } from "react"
import { Sparkles, Loader2, ChevronDown, X, Upload } from "lucide-react"
import { formatGermanNumber, parseGermanNumber } from "@/lib/utils/number-format"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface ResponsibilityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    description: string
    optimization_suggestions: string
    group_name: string
    responsible_user_id: string | null
    deputy_user_id: string | null
    team_member_ids: string[]
    suggested_hours_per_week: number | null
    estimated_time_amount: number | null
    estimated_time_period: string | null
    cannot_complete_during_consultation: boolean
    calculate_time_automatically: boolean
    attachments?: File[]
    link_url?: string
    link_title?: string
  }
  setFormData: (data: any) => void
  hoursDisplayValue: string
  setHoursDisplayValue: (value: string) => void
  onSave: (e: React.FormEvent) => void
  editing: boolean
}

function ResponsibilityFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  hoursDisplayValue,
  setHoursDisplayValue,
  onSave,
  editing,
}: ResponsibilityFormDialogProps) {
  const { currentPractice } = usePractice()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [orgaCategories, setOrgaCategories] = useState<
    Array<{ id: string; name: string; color: string; display_order: number }>
  >([])
  const [isGeneratingOptimization, setIsGeneratingOptimization] = useState(false)
  const [timeAmountDisplay, setTimeAmountDisplay] = useState("")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [pastedFiles, setPastedFiles] = useState<Array<{ name: string; url: string; type: string; size: number }>>([])

  useEffect(() => {
    if (open && formData.calculate_time_automatically) {
      const shouldCalculate = formData.calculate_time_automatically
      if (shouldCalculate && formData.estimated_time_amount && formData.estimated_time_period) {
        const amount = formData.estimated_time_amount
        const period = formData.estimated_time_period
        let hoursPerWeek = 0

        switch (period) {
          case "Monat":
            hoursPerWeek = amount / 4.33
            break
          case "Quartal":
            hoursPerWeek = amount / 13
            break
          case "Jahr":
            hoursPerWeek = amount / 52
            break
        }

        const roundedHours = Math.round(hoursPerWeek * 10) / 10
        setHoursDisplayValue(formatGermanNumber(roundedHours))
      }
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeAmountDisplay(formatGermanNumber(formData.estimated_time_amount))
    }
  }, [open])

  useEffect(() => {
    if (formData.calculate_time_automatically && formData.estimated_time_amount && formData.estimated_time_period) {
      const amount = formData.estimated_time_amount
      const period = formData.estimated_time_period
      let hoursPerWeek = 0

      switch (period) {
        case "Monat":
          hoursPerWeek = amount / 4.33
          break
        case "Quartal":
          hoursPerWeek = amount / 13
          break
        case "Jahr":
          hoursPerWeek = amount / 52
          break
      }

      const roundedHours = Math.round(hoursPerWeek * 10) / 10
      setHoursDisplayValue(formatGermanNumber(roundedHours))
      setFormData((prev: typeof formData) => ({
        ...prev,
        suggested_hours_per_week: roundedHours,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.calculate_time_automatically,
    formData.estimated_time_amount,
    formData.estimated_time_period,
    setHoursDisplayValue,
  ])

  useEffect(() => {
    if (currentPractice?.id && open) {
      console.log("[v0] Fetching team members and orga categories for practice:", currentPractice.id)

      fetch(`/api/practices/${currentPractice.id}/team-members`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          // Data is an array directly, not wrapped in an object
          setTeamMembers(Array.isArray(data) ? data : [])
        })
        .catch((error) => {
          console.error("[v0] Error fetching team members:", error)
          setTeamMembers([])
        })

      fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          const categories = (data.categories || []).sort(
            (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0),
          )
          const seen = new Set<string>()
          const uniqueCategories = categories.filter((cat: any) => {
            const key = cat.name?.toLowerCase()?.trim()
            if (key && !seen.has(key)) {
              seen.add(key)
              return true
            }
            return false
          })
          console.log("[v0] Loaded orga categories:", uniqueCategories.length)
          setOrgaCategories(uniqueCategories)
        })
        .catch((error) => {
          console.error("[v0] Error fetching orga categories:", error)
          setOrgaCategories([])
        })
    }
  }, [currentPractice?.id, open])

  const handleGenerateOptimization = async () => {
    if (!formData.name.trim()) {
      alert("Bitte geben Sie zuerst einen Namen für die Zuständigkeit ein.")
      return
    }

    setIsGeneratingOptimization(true)
    try {
      console.log("[v0] Calling AI optimize API with data:", {
        name: formData.name,
        description: formData.description,
        group_name: formData.group_name,
        suggested_hours_per_week: formData.suggested_hours_per_week,
        estimated_time_amount: formData.estimated_time_amount,
        estimated_time_period: formData.estimated_time_period,
        cannot_complete_during_consultation: formData.cannot_complete_during_consultation,
        practice_id: currentPractice?.id,
      })

      const response = await fetch("/api/responsibilities/ai-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          group_name: formData.group_name,
          suggested_hours_per_week: formData.suggested_hours_per_week,
          estimated_time_amount: formData.estimated_time_amount,
          estimated_time_period: formData.estimated_time_period,
          cannot_complete_during_consultation: formData.cannot_complete_during_consultation,
          practice_id: currentPractice?.id,
        }),
      })

      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.details || errorData.error || "Fehler beim Generieren der Vorschläge")
      }

      const data = await response.json()
      console.log("[v0] AI suggestions received, length:", data.suggestions?.length || 0)

      setFormData({
        ...formData,
        optimization_suggestions: data.suggestions,
      })
    } catch (error) {
      console.error("[v0] Error generating optimization:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      alert(`Fehler beim Generieren der Optimierungsvorschläge:\n${errorMessage}\n\nBitte versuchen Sie es erneut.`)
    } finally {
      setIsGeneratingOptimization(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const fileArray = Array.from(files)
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), ...fileArray],
      })
    }
  }

  const removeFile = (index: number) => {
    const newAttachments = [...(formData.attachments || [])]
    newAttachments.splice(index, 1)
    setFormData({
      ...formData,
      attachments: newAttachments,
    })
  }

  const handleDescriptionPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items || !currentPractice?.id) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file") {
        const file = item.getAsFile()
        if (file) {
          files.push(file)
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      await uploadFiles(files)
    }
  }

  const handleDescriptionDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDescriptionDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0 && currentPractice?.id) {
      await uploadFiles(files)
    }
  }

  const uploadFiles = async (files: File[]) => {
    setUploadingFiles(true)
    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`/api/practices/${currentPractice!.id}/responsibilities/upload-file`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return await response.json()
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const newPastedFiles = uploadedFiles.map((result) => ({
        name: result.fileName,
        url: result.url,
        type: result.fileType,
        size: result.fileSize,
      }))

      setPastedFiles([...pastedFiles, ...newPastedFiles])

      // Also add to attachments array
      const fileObjects = files.map(
        (file, index) =>
          ({
            name: uploadedFiles[index].fileName,
            size: file.size,
            type: file.type,
          }) as File,
      )
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), ...fileObjects],
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      alert("Fehler beim Hochladen der Dateien. Bitte versuchen Sie es erneut.")
    } finally {
      setUploadingFiles(false)
    }
  }

  const removePastedFile = (index: number) => {
    const newPastedFiles = [...pastedFiles]
    newPastedFiles.splice(index, 1)
    setPastedFiles(newPastedFiles)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Zuständigkeit bearbeiten" : "Neue Zuständigkeit"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Bearbeiten Sie die Details dieser Zuständigkeit und speichern Sie die Änderungen."
              : "Erstellen Sie eine neue Zuständigkeit mit allen erforderlichen Informationen."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <Label htmlFor="name">Name der Zuständigkeit*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Patientenaufnahme"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              onPaste={handleDescriptionPaste}
              onDragOver={handleDescriptionDragOver}
              onDrop={handleDescriptionDrop}
              placeholder="Detaillierte Beschreibung der Aufgaben und Verantwortlichkeiten"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Tipp: Drücken Sie Strg+V zum Einfügen oder ziehen Sie Dateien hierher
            </p>
            {pastedFiles.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {pastedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.type.startsWith("image/") ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                        <img
                          src={file.url || "/placeholder.svg"}
                          alt={file.name}
                          className="object-cover w-full h-full"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removePastedFile(index)}
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md border">
                        <span className="text-xs truncate flex-1">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePastedFile(index)}
                          className="h-6 w-6 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {uploadingFiles && (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dateien werden hochgeladen...</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="optimization_suggestions">Wie können wir dies optimieren?</Label>
            <div className="mt-2 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateOptimization}
                disabled={isGeneratingOptimization || !formData.name.trim()}
                className="w-full gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isGeneratingOptimization ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">Generiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">KI-Vorschläge generieren</span>
                  </>
                )}
              </Button>
              <Textarea
                id="optimization_suggestions"
                value={formData.optimization_suggestions}
                onChange={(e) => setFormData({ ...formData, optimization_suggestions: e.target.value })}
                placeholder="Ideen und Vorschläge zur Optimierung dieser Zuständigkeit"
                rows={5}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="group_name">Kategorie</Label>
            <Select
              value={formData.group_name || "none"}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  group_name: value === "none" ? "" : value,
                })
              }
            >
              <SelectTrigger id="group_name">
                <SelectValue placeholder="Keine Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Kategorie</SelectItem>
                {orgaCategories.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    Erstellen Sie Kategorien in den Einstellungen
                  </div>
                ) : (
                  orgaCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {orgaCategories.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Keine Kategorien verfügbar. Bitte erstellen Sie Kategorien in den Einstellungen.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="responsible_user_id">Hauptverantwortlicher</Label>
              <Select
                value={formData.responsible_user_id || "unassigned"}
                onValueChange={(value) =>
                  setFormData({ ...formData, responsible_user_id: value === "unassigned" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {teamMembers.filter(isActiveMember).map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deputy_user_id">Stellvertreter</Label>
              <Select
                value={formData.deputy_user_id || "unassigned"}
                onValueChange={(value) =>
                  setFormData({ ...formData, deputy_user_id: value === "unassigned" ? null : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wählen Sie eine Person" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                  {teamMembers
                    .filter((m) => m.id !== formData.responsible_user_id && isActiveMember(m))
                    .map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="calculate_time_automatically"
              checked={formData.calculate_time_automatically}
              onCheckedChange={(checked) => setFormData({ ...formData, calculate_time_automatically: !!checked })}
            />
            <Label htmlFor="calculate_time_automatically" className="cursor-pointer">
              Zeitaufwand Berechnen
            </Label>
          </div>

          <div>
            <Label htmlFor="suggested_hours_per_week">Geschätzter Zeitaufwand (Std./Woche)</Label>
            {formData.calculate_time_automatically ? (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 mt-2">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">Berechneter Zeitaufwand</div>
                  <div className="text-3xl font-semibold text-blue-600">{hoursDisplayValue || "0"}h</div>
                </div>
              </div>
            ) : (
              <Input
                id="suggested_hours_per_week"
                type="text"
                value={hoursDisplayValue}
                onChange={(e) => {
                  const inputValue = e.target.value
                  setHoursDisplayValue(inputValue)
                  const val = parseGermanNumber(inputValue)
                  setFormData({
                    ...formData,
                    suggested_hours_per_week: val,
                  })
                }}
                placeholder="z.B. 5 oder 2,5"
              />
            )}
            {formData.calculate_time_automatically && (
              <p className="text-xs text-muted-foreground mt-1">
                Wird automatisch basierend auf Anzahl und Zeitraum berechnet
              </p>
            )}
          </div>

          <div>
            <Label>Zeitaufwand Berechnung</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_time_amount" className="text-sm text-muted-foreground">
                  Anzahl Stunden pro
                </Label>
                <Input
                  id="estimated_time_amount"
                  type="text"
                  value={timeAmountDisplay}
                  onChange={(e) => {
                    const inputValue = e.target.value
                    console.log("[v0] Input onChange - Raw value:", inputValue)
                    setTimeAmountDisplay(inputValue)
                    const val = parseGermanNumber(inputValue)
                    console.log("[v0] Input onChange - Parsed value:", val)

                    const hasValue = val !== null && val > 0

                    setFormData({
                      ...formData,
                      estimated_time_amount: val,
                      calculate_time_automatically: hasValue ? true : formData.calculate_time_automatically,
                    })
                  }}
                  onBlur={(e) => {
                    const val = parseGermanNumber(e.target.value)
                    console.log("[v0] Input onBlur - Parsed value:", val)
                    if (val !== null && val > 0) {
                      setTimeAmountDisplay(formatGermanNumber(val))
                    }
                  }}
                  placeholder="z.B. 2 oder 2,5"
                />
              </div>

              <div>
                <Label htmlFor="estimated_time_period" className="text-sm text-muted-foreground">
                  Zeitraum
                </Label>
                <Select
                  value={formData.estimated_time_period || "unselected"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      estimated_time_period: value === "unselected" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unselected">Nicht ausgewählt</SelectItem>
                    <SelectItem value="Monat">pro Monat</SelectItem>
                    <SelectItem value="Quartal">pro Quartal</SelectItem>
                    <SelectItem value="Jahr">pro Jahr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="cannot_complete_during_consultation"
              checked={formData.cannot_complete_during_consultation}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, cannot_complete_during_consultation: !!checked })
              }
            />
            <Label htmlFor="cannot_complete_during_consultation" className="cursor-pointer">
              Kann nicht während Sprechstunde erledigt werden
            </Label>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between hover:bg-muted/50 bg-transparent"
              >
                <span className="font-medium">Erweiterte Einstellungen</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${advancedOpen ? "transform rotate-180" : ""}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <div>
                <Label htmlFor="attachments">Anhänge</Label>
                <Input id="attachments" type="file" multiple onChange={handleFileUpload} className="mt-1" />
                {formData.attachments && formData.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="link_url">Link-URL</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url || ""}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://beispiel.de"
                />
              </div>

              <div>
                <Label htmlFor="link_title">Link-Titel</Label>
                <Input
                  id="link_title"
                  type="text"
                  value={formData.link_title || ""}
                  onChange={(e) => setFormData({ ...formData, link_title: e.target.value })}
                  placeholder="z.B. Weitere Informationen"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">{editing ? "Aktualisieren" : "Erstellen"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ResponsibilityFormDialog
