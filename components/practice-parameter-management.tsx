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
          ? t("common.parameter_updated", "Parameter Updated")
          : t("common.parameter_created", "Parameter Created"),
        description: `Successfully ${editingParameter ? t("common.updated", "updated") : t("common.created", "created")} the parameter.`,
      })

      setIsDialogOpen(false)
      resetForm()
      fetchParameters()
    } catch (err) {
      console.error("Error saving parameter:", err)
      toast({
        title: t("common.error", "Error"),
        description:
          err instanceof Error ? err.message : t("common.failed_to_save_parameter", "Failed to save parameter"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentPractice) return
    if (!confirm(t("common.confirm_delete", "Are you sure you want to delete this parameter?"))) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameters/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete parameter")
      }

      toast({
        title: t("common.parameter_deleted", "Parameter Deleted"),
        description: t("common.successfully_deleted", "Successfully deleted the parameter."),
      })

      fetchParameters()
    } catch (err) {
      console.error("Error deleting parameter:", err)
      toast({
        title: t("common.error", "Error"),
        description:
          err instanceof Error ? err.message : t("common.failed_to_delete_parameter", "Failed to delete parameter"),
        variant: "destructive",
      })
    }
  }

  const handleEdit = (param: PracticeParameter) => {
    console.log("[v0] handleEdit called with param:", param)
    console.log("[v0] data_collection_start value:", (param as any).data_collection_start)
    setEditingParameter(param)
    setFormData({
      name: param.name,
      description: param.description || "",
      category: param.category,
      dataType: param.data_type,
      unit: param.unit || "",
      dataCollectionStart: (param as any).data_collection_start || new Date().toISOString().split("T")[0],
    })
    console.log(
      "[v0] formData.dataCollectionStart set to:",
      (param as any).data_collection_start || new Date().toISOString().split("T")[0],
    )
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
          {t("kpi.select_practice", "Please select a practice to manage parameters.")}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("kpi.practice_specific", "Practice-Specific KPIs")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("kpi.custom_parameters_for", "Custom parameters for")} {currentPractice.name}
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
          {t("kpi.add_parameter", "Add Parameter")}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Label>{t("kpi.filter_by_category", "Filter by Category:")}</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("kpi.all_categories", "All Categories")}</SelectItem>
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
        <div className="text-center py-8 text-muted-foreground">Loading parameters...</div>
      ) : filteredParameters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t("kpi.no_parameters_yet", "No practice-specific KPIs yet.")}</p>
            <p className="text-sm">
              {t("kpi.click_to_create", 'Click "Add Parameter" to create your first custom parameter.')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredParameters.map((param) => (
            <Card key={param.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle
                      className="text-base cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleEdit(param)}
                    >
                      {param.name}
                    </CardTitle>
                    {param.description && <CardDescription className="text-sm">{param.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(param)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(param.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryColor(param.category)}>{param.category}</Badge>
                  <Badge variant="outline">{param.data_type}</Badge>
                  {param.unit && <Badge variant="secondary">{param.unit}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParameter
                ? t("common.edit_parameter", "Edit Parameter")
                : t("common.add_new_parameter", "Add New Parameter")}
            </DialogTitle>
            <DialogDescription>
              {editingParameter
                ? t("common.update_details", "Update the parameter details")
                : t("common.create_new_kpi", "Create a new practice-specific KPI")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("common.parameter_name", "Parameter Name")} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Monthly Revenue"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">{t("common.description", "Description")}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">{t("common.category", "Category")} *</Label>
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
                <Label htmlFor="dataType">{t("common.data_type", "Data Type")} *</Label>
                <Select
                  value={formData.dataType}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, dataType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">{t("common.number", "Number")}</SelectItem>
                    <SelectItem value="text">{t("common.text", "Text")}</SelectItem>
                    <SelectItem value="date">{t("common.date", "Date")}</SelectItem>
                    <SelectItem value="boolean">{t("common.boolean", "Boolean")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="unit">{t("common.unit", "Unit")}</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., EUR, Minutes, Count"
              />
            </div>

            <div>
              <Label htmlFor="dataCollectionStart">{t("kpi.data_collection_start", "Beginn der Datensammlung")}</Label>
              {console.log("[v0] Rendering dataCollectionStart field with value:", formData.dataCollectionStart)}
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
                {t("common.cancel", "Cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {editingParameter ? t("common.update", "Update") : t("common.create", "Create")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PracticeParameterManagement
