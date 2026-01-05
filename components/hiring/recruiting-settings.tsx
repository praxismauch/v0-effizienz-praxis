"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Save, Eye, Settings2, ArrowUp, ArrowDown, GripVertical } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { defaultRecruitingFields, type FormField } from "@/lib/recruiting-defaults"

export function RecruitingSettings() {
  const { currentPractice, updatePractice } = usePractice()
  const [fields, setFields] = useState<FormField[]>(defaultRecruitingFields)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedOptionIndex, setDraggedOptionIndex] = useState<number | null>(null)
  const [dragOverOptionIndex, setDragOverOptionIndex] = useState<number | null>(null)

  useEffect(() => {
    const loadFields = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/recruiting-fields`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            // Convert database format to component format
            const loadedFields = data.map((dbField: any) => ({
              id: dbField.id,
              key: dbField.field_key,
              type: dbField.field_type,
              label: dbField.label,
              required: dbField.required,
              enabled: dbField.enabled,
              options: dbField.options,
            }))
            setFields(loadedFields)
          }
        }
      } catch (error) {
        console.error("[v0] Error loading recruiting fields:", error)
      }
    }

    loadFields()
  }, [currentPractice?.id])

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  const handleSave = async () => {
    if (!currentPractice) return

    setLoading(true)
    setSaved(false)

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/recruiting-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      })

      if (!response.ok) throw new Error("Failed to save")

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving recruiting settings:", error)
      alert("Fehler beim Speichern der Einstellungen")
    } finally {
      setLoading(false)
    }
  }

  const handleAddOption = (fieldId: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId) {
          return {
            ...field,
            options: [...(field.options || []), ""], // Single empty string instead of {value, label} object
          }
        }
        return field
      }),
    )
  }

  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId) {
          return {
            ...field,
            options: field.options?.filter((_, i) => i !== optionIndex),
          }
        }
        return field
      }),
    )
  }

  const handleUpdateOption = (fieldId: string, optionIndex: number, key: "value" | "label", value: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          newOptions[optionIndex] = value // Update both value and label to the same text
          return { ...field, options: newOptions }
        }
        return field
      }),
    )
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
  }

  const handleMoveField = (fieldId: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === fieldId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === fields.length - 1) return

    const newFields = [...fields]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]]
    setFields(newFields)
  }

  const handleResetToDefaults = () => {
    if (window.confirm("Möchten Sie wirklich alle Einstellungen auf die Standardwerte zurücksetzen?")) {
      setFields(defaultRecruitingFields)
      setSelectedFieldId(null)
    }
  }

  const handleFieldClick = (fieldId: string) => {
    console.log("[v0] Field clicked:", fieldId)
    console.log("[v0] Current selectedFieldId:", selectedFieldId)
    setSelectedFieldId(fieldId)
    console.log("[v0] After setState - selectedFieldId should now be:", fieldId)
  }

  const renderPreviewField = (field: FormField) => {
    const isSelected = selectedFieldId === field.id

    return (
      <div
        key={field.id}
        className={cn(
          "space-y-2 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50",
          isSelected ? "border-primary bg-primary/5" : "border-border bg-background",
        )}
        onClick={() => handleFieldClick(field.id)}
      >
        <Label className="flex items-center gap-2">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
          {isSelected && <Settings2 className="h-3 w-3 text-primary ml-auto" />}
        </Label>

        {field.type === "text" && <Input placeholder={`${field.label} eingeben...`} disabled />}

        {field.type === "number" && <Input type="number" placeholder="0" disabled />}

        {field.type === "select" && (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Bitte auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {field.options
                ?.filter((option) => {
                  // Filter out empty strings or objects
                  if (typeof option === "string") return option !== ""
                  return option?.label && option.label !== ""
                })
                .map((option, index) => {
                  // Handle both string and {value, label} object formats
                  const optionValue = typeof option === "string" ? option : option.value
                  const optionLabel = typeof option === "string" ? option : option.label

                  return (
                    <SelectItem key={`${optionValue}-${index}`} value={optionValue}>
                      {optionLabel}
                    </SelectItem>
                  )
                })}
            </SelectContent>
          </Select>
        )}

        {field.type === "textarea" && <Textarea placeholder={`${field.label} eingeben...`} rows={3} disabled />}
      </div>
    )
  }

  const handleDragStart = (fieldId: string, index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (fieldId: string, dropIndex: number) => {
    if (draggedIndex === null) return

    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          const [draggedItem] = newOptions.splice(draggedIndex, 1)
          newOptions.splice(dropIndex, 0, draggedItem)
          return { ...field, options: newOptions }
        }
        return field
      }),
    )

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleOptionDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation() // Prevent field drag from triggering
    setDraggedOptionIndex(index)
  }

  const handleOptionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverOptionIndex(index)
  }

  const handleOptionDragLeave = (e: React.DragEvent) => {
    e.stopPropagation()
    setDragOverOptionIndex(null)
  }

  const handleOptionDrop = (e: React.DragEvent, fieldId: string, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    if (draggedOptionIndex === null) return

    setFields(
      fields.map((field) => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options]
          const [draggedItem] = newOptions.splice(draggedOptionIndex, 1)
          newOptions.splice(dropIndex, 0, draggedItem)
          return { ...field, options: newOptions }
        }
        return field
      }),
    )

    setDraggedOptionIndex(null)
    setDragOverOptionIndex(null)
  }

  const handleOptionDragEnd = (e: React.DragEvent) => {
    e.stopPropagation()
    setDraggedOptionIndex(null)
    setDragOverOptionIndex(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <Button variant="outline" onClick={handleResetToDefaults}>
          Auf Standard zurücksetzen
        </Button>
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Speichern..." : "Einstellungen speichern"}
        </Button>
      </div>

      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">Einstellungen erfolgreich gespeichert!</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Live Preview */}
        <Card className="lg:sticky lg:top-4 h-fit">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <CardTitle>Bewerber Formular Einstellungen</CardTitle>
            </div>
            <CardDescription>Klicken Sie auf ein Feld, um es zu bearbeiten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    "space-y-2 p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50",
                    selectedFieldId === field.id ? "border-primary bg-primary/5" : "border-border bg-background",
                  )}
                  onClick={() => handleFieldClick(field.id)}
                >
                  <Label className="flex items-center gap-2">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {selectedFieldId === field.id && <Settings2 className="h-3 w-3 text-primary ml-auto" />}
                  </Label>

                  {field.type === "text" && <Input placeholder={`${field.label} eingeben...`} disabled />}

                  {field.type === "number" && <Input type="number" placeholder="0" disabled />}

                  {field.type === "select" && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Bitte auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options
                          ?.filter((option) => {
                            if (typeof option === "string") return option !== ""
                            return option?.label && option.label !== ""
                          })
                          .map((option, index) => {
                            const optionValue = typeof option === "string" ? option : option.value
                            const optionLabel = typeof option === "string" ? option : option.label

                            return (
                              <SelectItem key={`${optionValue}-${index}`} value={optionValue}>
                                {optionLabel}
                              </SelectItem>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === "textarea" && (
                    <Textarea placeholder={`${field.label} eingeben...`} rows={3} disabled />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Field Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              <CardTitle>Feld-Einstellungen</CardTitle>
            </div>
            <CardDescription>
              {selectedField ? `Bearbeiten: ${selectedField.label}` : "Wählen Sie ein Feld aus der Vorschau"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedField ? (
              <>
                {/* Field Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Feldbezeichnung</Label>
                    <Input
                      value={selectedField.label}
                      onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={selectedField.required}
                        onCheckedChange={(checked) => handleUpdateField(selectedField.id, { required: checked })}
                      />
                      <Label>Pflichtfeld</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveField(selectedField.id, "up")}
                        disabled={fields.findIndex((f) => f.id === selectedField.id) === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveField(selectedField.id, "down")}
                        disabled={fields.findIndex((f) => f.id === selectedField.id) === fields.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      <strong>Feldtyp:</strong> {selectedField.type}
                    </div>
                  </div>
                </div>

                {/* Options for Select Fields */}
                {selectedField.type === "select" && (
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label>Auswahloptionen</Label>
                      <Button size="sm" variant="outline" onClick={() => handleAddOption(selectedField.id)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Option hinzufügen
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedField.options?.map((option, index) => {
                        const optionValue = typeof option === "string" ? option : option.label || ""

                        return (
                          <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleOptionDragStart(e, index)}
                            onDragOver={(e) => handleOptionDragOver(e, index)}
                            onDragLeave={handleOptionDragLeave}
                            onDrop={(e) => handleOptionDrop(e, selectedField.id, index)}
                            onDragEnd={handleOptionDragEnd}
                            className={cn(
                              "flex items-center gap-2 transition-all",
                              draggedOptionIndex === index && "opacity-50",
                              dragOverOptionIndex === index && "border-2 border-primary rounded bg-primary/5 p-1",
                            )}
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing flex-shrink-0" />
                            <Input
                              placeholder="Option eingeben (z.B. Vollzeit)"
                              value={optionValue}
                              onChange={(e) => handleUpdateOption(selectedField.id, index, "label", e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveOption(selectedField.id, index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Klicken Sie auf ein Feld in der Vorschau,</p>
                <p>um es zu bearbeiten</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
