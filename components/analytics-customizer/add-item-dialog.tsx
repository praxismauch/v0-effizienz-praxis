"use client"

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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import { chartTypeIcons, getChartTypeLabel, categoryLabels, categoryColors } from "./types"
import type { Parameter } from "@/types/parameter"

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItemId: string | null
  newItemTitle: string
  setNewItemTitle: (value: string) => void
  newItemDescription: string
  setNewItemDescription: (value: string) => void
  newItemCategory: "overview" | "performance" | "charts"
  setNewItemCategory: (value: "overview" | "performance" | "charts") => void
  newItemChartType: "area" | "line" | "pie" | "bar"
  setNewItemChartType: (value: "area" | "line" | "pie" | "bar") => void
  selectedParameters: string[]
  setSelectedParameters: (value: string[]) => void
  parameterFilter: "all" | "weekly" | "monthly" | "quarterly" | "yearly"
  setParameterFilter: (value: "all" | "weekly" | "monthly" | "quarterly" | "yearly") => void
  filteredAvailableParameters: Parameter[]
  isLoadingParameters: boolean
  onSave: () => void
  onClose: () => void
}

export function AddItemDialog({
  open,
  onOpenChange,
  editingItemId,
  newItemTitle,
  setNewItemTitle,
  newItemDescription,
  setNewItemDescription,
  newItemCategory,
  setNewItemCategory,
  newItemChartType,
  setNewItemChartType,
  selectedParameters,
  setSelectedParameters,
  parameterFilter,
  setParameterFilter,
  filteredAvailableParameters,
  isLoadingParameters,
  onSave,
  onClose,
}: AddItemDialogProps) {
  const { t } = useTranslation()

  const handleToggleParameter = (parameterId: string) => {
    setSelectedParameters(
      selectedParameters.includes(parameterId)
        ? selectedParameters.filter((id) => id !== parameterId)
        : [...selectedParameters, parameterId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItemId
              ? t("analytics.customizer.editItem", "Element bearbeiten")
              : t("analytics.customizer.addItem", "Neues Element hinzufügen")}
          </DialogTitle>
          <DialogDescription>
            {t("analytics.customizer.addItemDescription", "Erstellen Sie ein benutzerdefiniertes Diagramm")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("analytics.customizer.itemTitle", "Titel")}</Label>
            <Input
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder={t("analytics.customizer.itemTitlePlaceholder", "z.B. Umsatzentwicklung")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("analytics.customizer.itemDescription", "Beschreibung")}</Label>
            <Textarea
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              placeholder={t("analytics.customizer.itemDescriptionPlaceholder", "Kurze Beschreibung des Diagramms")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("analytics.customizer.category", "Kategorie")}</Label>
              <Select value={newItemCategory} onValueChange={(v) => setNewItemCategory(v as typeof newItemCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">{categoryLabels.overview}</SelectItem>
                  <SelectItem value="performance">{categoryLabels.performance}</SelectItem>
                  <SelectItem value="charts">{categoryLabels.charts}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("analytics.customizer.chartType", "Diagrammtyp")}</Label>
              <Select value={newItemChartType} onValueChange={(v) => setNewItemChartType(v as typeof newItemChartType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["bar", "line", "area", "pie"] as const).map((type) => {
                    const Icon = chartTypeIcons[type]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {getChartTypeLabel(type)}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("analytics.customizer.parameters", "Parameter")}</Label>
              <Select value={parameterFilter} onValueChange={(v) => setParameterFilter(v as typeof parameterFilter)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Quartalsweise</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoadingParameters ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {filteredAvailableParameters.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {t("analytics.customizer.noParameters", "Keine Parameter verfügbar")}
                  </p>
                ) : (
                  filteredAvailableParameters.map((param) => (
                    <div key={param.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={param.id}
                        checked={selectedParameters.includes(param.id)}
                        onCheckedChange={() => handleToggleParameter(param.id)}
                      />
                      <label htmlFor={param.id} className="text-sm flex-1 cursor-pointer">
                        {param.name}
                      </label>
                      <Badge variant="outline" className="text-xs">
                        {param.interval}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel", "Abbrechen")}
          </Button>
          <Button onClick={onSave} disabled={!newItemTitle.trim()}>
            {editingItemId
              ? t("common.save", "Speichern")
              : t("analytics.customizer.addItem", "Hinzufügen")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
