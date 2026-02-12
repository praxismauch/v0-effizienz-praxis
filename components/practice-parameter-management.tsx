"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Database, AlertCircle } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslation } from "@/contexts/translation-context"

interface PracticeParameter {
  id: string
  practice_id: string
  name: string
  description?: string
  category: string
  data_type: "number" | "text" | "date" | "boolean"
  unit?: string
  is_global: boolean
  created_at: string
  updated_at: string
  data_collection_start?: string
}

export function PracticeParameterManagement() {
  const { t } = useTranslation()
  const { currentPractice } = usePractice()
  const [parameters, setParameters] = useState<PracticeParameter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingParameter, setEditingParameter] = useState<PracticeParameter | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Finanzen",
    dataType: "number" as "number" | "text" | "date" | "boolean",
    unit: "",
    dataCollectionStart: new Date().toISOString().split("T")[0], // Format: YYYY-MM-DD
  })

  useEffect(() => {
    if (currentPractice) {
      fetchParameters()
    }
  }, [currentPractice, categoryFilter])

  const fetchParameters = async () => {
    if (!currentPractice) return

    setIsLoading(true)
    setError(null)

    try {
      const url = `/api/practices/${currentPractice.id}/parameters${categoryFilter !== "all" ? `?category=${categoryFilter}` : ""}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error("Failed to fetch parameters")
      }

      const data = await response.json()
      setParameters(data.parameters || [])
    } catch (err) {
      console.error("Error fetching parameters:", err)
      setError(err instanceof Error ? err.message : "Failed to load parameters")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!currentPractice) return

    try {
      const url = editingParameter
        ? `/api/practices/${currentPractice.id}/parameters/${editingParameter.id}`
        : `/api/practices/${currentPractice.id}/parameters`

      const response = await fetch(url, {
        method: editingParameter ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save parameter")
      }

      toast({
        title: editingParameter
          ? t("common.parameter_updated", "Parameter aktualisiert")
          : t("common.parameter_created", "Parameter erstellt"),
        description: editingParameter
          ? "Der Parameter wurde erfolgreich aktualisiert."
          : "Der Parameter wurde erfolgreich erstellt.",
      })

      setIsDialogOpen(false)
      resetForm()
      fetchParameters()
    } catch (err) {
      console.error("Error saving parameter:", err)
      toast({
        title: t("common.error", "Fehler"),
        description:
          err instanceof Error ? err.message : t("common.failed_to_save_parameter", "Parameter konnte nicht gespeichert werden"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentPractice) return
    if (!confirm(t("common.confirm_delete", "Sind Sie sicher, dass Sie diesen Parameter loeschen moechten?"))) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete parameter")
      }

      toast({
        title: t("common.parameter_deleted", "Parameter geloescht"),
        description: t("common.successfully_deleted", "Der Parameter wurde erfolgreich geloescht."),
      })

      fetchParameters()
    } catch (err) {
      console.error("Error deleting parameter:", err)
      toast({
        title: t("common.error", "Fehler"),
        description:
          err instanceof Error ? err.message : t("common.failed_to_delete_parameter", "Parameter konnte nicht geloescht werden"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (param: PracticeParameter) => {
    setEditingParameter(param)
    setFormData({
      name: param.name,
      description: param.description || "",
      category: param.category,
      dataType: param.data_type,
      unit: param.unit || "",
      dataCollectionStart: (param as any).data_collection_start || new Date().toISOString().split("T")[0],
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "Finanzen",
      dataType: "number",
      unit: "",
      dataCollectionStart: new Date().toISOString().split("T")[0],
    })
    setEditingParameter(null)
  }

  const defaultCategories = ["Finanzen", "Behandlung", "Qualität", "Personal", "Sonstiges"]
  const dynamicCategories = Array.from(
    new Set(parameters.map((p) => p.category).filter((cat) => cat && cat.trim() !== "")),
  )
  const allCategories = Array.from(new Set([...defaultCategories, ...dynamicCategories])).sort()

  const filteredParameters = parameters.filter((param) => categoryFilter === "all" || param.category === categoryFilter)

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Finanzen: "bg-green-500",
      Behandlung: "bg-purple-500",
      Qualität: "bg-orange-500",
      Personal: "bg-pink-500",
      Sonstiges: "bg-gray-500",
    }
    return colors[category] || "bg-gray-500"
  }

  if (!currentPractice) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t("kpi.select_practice", "Bitte waehlen Sie eine Praxis aus, um Parameter zu verwalten.")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("kpi.practice_specific", "Praxisspezifische KPIs")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("kpi.custom_parameters_for", "Individuelle Kennzahlen fuer")} {currentPractice.name}
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setIsDialogOpen(true)
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("kpi.add_parameter", "Parameter hinzufuegen")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label>{t("kpi.filter_by_category", "Filtern nach Kategorie:")}</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Parameter werden geladen...</div>
      ) : filteredParameters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("kpi.no_parameters_yet", "Noch keine praxisspezifischen KPIs vorhanden.")}</p>
            <p className="text-sm">
              {t("kpi.click_to_create", "Klicken Sie auf \"Parameter hinzufuegen\", um Ihren ersten individuellen Parameter zu erstellen.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg divide-y">
          {filteredParameters.map((param) => (
            <div
              key={param.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleEdit(param)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{param.name}</p>
                  {param.description && (
                    <p className="text-xs text-muted-foreground truncate">{param.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className={`text-xs ${getCategoryColor(param.category)}`}>{param.category}</Badge>
                  <Badge variant="outline" className="text-xs">{param.data_type}</Badge>
                  {param.unit && <Badge variant="secondary" className="text-xs">{param.unit}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); handleEdit(param) }}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(param.id) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParameter
                ? t("common.edit_parameter", "Parameter bearbeiten")
                : t("common.add_new_parameter", "Neuer Parameter")}
            </DialogTitle>
            <DialogDescription>
              {editingParameter
                ? t("common.update_details", "Aktualisieren Sie die Parameterdetails")
                : t("common.create_new_kpi", "Erstellen Sie einen neuen praxisspezifischen KPI")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("common.parameter_name", "Parametername")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Monatlicher Umsatz"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t("common.description", "Beschreibung")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optionale Beschreibung"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t("common.category", "Kategorie")} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dataType">{t("common.data_type", "Datentyp")} *</Label>
                <Select
                  value={formData.dataType}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, dataType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">{t("common.number", "Zahl")}</SelectItem>
                    <SelectItem value="text">{t("common.text", "Text")}</SelectItem>
                    <SelectItem value="date">{t("common.date", "Datum")}</SelectItem>
                    <SelectItem value="boolean">{t("common.boolean", "Ja/Nein")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="unit">{t("common.unit", "Einheit")}</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="z.B. EUR, Minuten, Anzahl"
              />
            </div>

            <div>
              <Label htmlFor="dataCollectionStart">{t("kpi.data_collection_start", "Beginn der Datensammlung")}</Label>
              <Input
                id="dataCollectionStart"
                type="date"
                value={formData.dataCollectionStart}
                onChange={(e) => setFormData((prev) => ({ ...prev, dataCollectionStart: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                {t("common.cancel", "Abbrechen")}
              </Button>
              <Button type="submit" disabled={loading}>
                {editingParameter ? t("common.update", "Aktualisieren") : t("common.create", "Erstellen")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PracticeParameterManagement
