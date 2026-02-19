"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { AlertCircle, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import type { Parameter, ParameterValue } from "./types"
import {
  formatDate, getWeek, getQuarter, setQuarter,
  startOfWeek, endOfWeek, startOfYear,
  subMonths, addMonths, subWeeks, subYears, addYears,
} from "./date-utils"

interface EntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  interval: "monthly" | "weekly" | "quarterly" | "yearly"
  parameters: Parameter[]
  categories: string[]
  isSaving: boolean
  duplicateWarning: { show: boolean; existingValue: ParameterValue | null }
  setDuplicateWarning: (w: { show: boolean; existingValue: ParameterValue | null }) => void
  onAddValue: (parameterId: string, value: string, notes: string, force: boolean) => void
  onUpdateExisting: () => void
  renderValueInput: (param: Parameter) => React.ReactNode
  t: (key: string, fallback: string) => string
  // Period state for monthly
  currentMonth?: Date
  setCurrentMonth?: (d: Date) => void
  // Period state for weekly
  selectedWeek?: Date
  setSelectedWeek?: (d: Date) => void
  // Period state for quarterly
  selectedQuarter?: Date
  setSelectedQuarter?: (d: Date) => void
  // Period state for yearly
  selectedYear?: Date
  setSelectedYear?: (d: Date) => void
}

export function EntryDialog({
  open, onOpenChange, title, interval,
  parameters, categories, isSaving,
  duplicateWarning, setDuplicateWarning,
  onAddValue, onUpdateExisting, renderValueInput, t,
  currentMonth, setCurrentMonth,
  selectedWeek, setSelectedWeek,
  selectedQuarter, setSelectedQuarter,
  selectedYear, setSelectedYear,
}: EntryDialogProps) {
  const [dialogCategory, setDialogCategory] = useState("all")
  const [parameterId, setParameterId] = useState("")
  const [value, setValue] = useState("")
  const [notes, setNotes] = useState("")
  const [periodPickerOpen, setPeriodPickerOpen] = useState(false)

  const filteredParameters = parameters.filter((p) => {
    const matchesInterval = p.interval === interval || (!p.interval && interval === "monthly")
    const matchesCategory = dialogCategory === "all" || p.category === dialogCategory
    return matchesInterval && matchesCategory
  })

  const selectedParam = parameters.find((p) => p.id === parameterId)

  const handleSubmit = (force: boolean) => {
    onAddValue(parameterId, value, notes, force)
  }

  const handleClose = () => {
    setParameterId("")
    setValue("")
    setNotes("")
    setDialogCategory("all")
    onOpenChange(false)
  }

  const renderPeriodPicker = () => {
    if (interval === "monthly" && currentMonth && setCurrentMonth) {
      return (
        <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-auto py-1 px-2 font-semibold bg-transparent">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {formatDate(currentMonth, "MMMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold">{formatDate(currentMonth, "MMMM yyyy")}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => {
                  const month = new Date(currentMonth.getFullYear(), i, 1)
                  return (
                    <Button key={i} variant={currentMonth.getMonth() === i ? "default" : "outline"} size="sm"
                      onClick={() => { setCurrentMonth(month); setPeriodPickerOpen(false) }}>
                      {formatDate(month, "MMM")}
                    </Button>
                  )
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    if (interval === "weekly" && selectedWeek && setSelectedWeek) {
      const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })
      return (
        <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="font-semibold">KW {getWeek(selectedWeek)}</span>
              <span className="mx-2">-</span>
              <span>{formatDate(weekStart, "dd.MM")} - {formatDate(weekEnd, "dd.MM.yyyy")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <CalendarComponent mode="single" selected={selectedWeek}
              onSelect={(date) => {
                if (date) { setSelectedWeek(startOfWeek(date, { weekStartsOn: 1 })); setPeriodPickerOpen(false) }
              }}
              className="rounded-md border" />
          </PopoverContent>
        </Popover>
      )
    }

    if (interval === "quarterly" && selectedQuarter && setSelectedQuarter) {
      return (
        <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-auto py-1 px-2 font-semibold bg-transparent">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {formatDate(selectedQuarter, "QQQ yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuarter(subYears(selectedQuarter, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold text-sm">{formatDate(selectedQuarter, "yyyy")}</div>
                <Button variant="outline" size="sm" onClick={() => setSelectedQuarter(addYears(selectedQuarter, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((q) => (
                  <Button key={q} variant={getQuarter(selectedQuarter) === q ? "default" : "outline"} size="sm"
                    onClick={() => { setSelectedQuarter(setQuarter(startOfYear(selectedQuarter), q)); setPeriodPickerOpen(false) }}>
                    Q{q}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    if (interval === "yearly" && selectedYear && setSelectedYear) {
      return (
        <Popover open={periodPickerOpen} onOpenChange={setPeriodPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-auto py-1 px-2 font-semibold bg-transparent">
              <CalendarIcon className="mr-2 h-3 w-3" />
              {formatDate(selectedYear, "yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedYear(subYears(selectedYear, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold text-sm">{formatDate(selectedYear, "yyyy")}</div>
                <Button variant="outline" size="sm" onClick={() => setSelectedYear(addYears(selectedYear, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="w-full bg-transparent"
                onClick={() => { setSelectedYear(startOfYear(new Date())); setPeriodPickerOpen(false) }}>
                {t("kpi.current_year", "Aktuelles Jahr")}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="flex items-center gap-1 flex-wrap">
            <span>{interval === "weekly"
              ? t("kpi.select_week_and_enter_values", "Wählen Sie eine Kalenderwoche")
              : t("kpi.enter_value_for", "Wert eingeben für")}</span>
            {renderPeriodPicker()}
          </DialogDescription>
        </DialogHeader>

        {duplicateWarning.show && duplicateWarning.existingValue && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("kpi.duplicate_entry_warning", "Ein Wert existiert bereits für diesen Parameter")}
              <div className="mt-2 p-2 bg-background rounded border">
                <div className="font-medium">
                  {t("kpi.current_value", "Aktueller Wert:")} {String(duplicateWarning.existingValue.value)}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("kpi.category", "Kategorie")}</Label>
            <Select value={dialogCategory} onValueChange={(v) => {
              setDialogCategory(v)
              if (parameterId) {
                const p = parameters.find((x) => x.id === parameterId)
                if (p && v !== "all" && p.category !== v) setParameterId("")
              }
            }}>
              <SelectTrigger><SelectValue placeholder={t("kpi.choose_category", "Kategorie wahlen")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                {categories.filter((c) => c?.trim()).map((c, i) => (
                  <SelectItem key={`${c}-${i}`} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("kpi.parameter", "Parameter")}</Label>
            <Select value={parameterId} onValueChange={(v) => {
              setParameterId(v)
              setDuplicateWarning({ show: false, existingValue: null })
            }}>
              <SelectTrigger><SelectValue placeholder={t("kpi.select_parameter", "Parameter auswählen")} /></SelectTrigger>
              <SelectContent>
                {filteredParameters.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    {t("kpi.no_parameters", "Keine Parameter verfügbar")}
                  </div>
                ) : filteredParameters.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      <Badge variant="outline" className="text-xs">{p.category}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {parameterId && selectedParam && (
            <>
              <div className="space-y-2">
                <Label>{t("kpi.value", "Wert")}</Label>
                {renderValueInput(selectedParam)}
              </div>
              <div className="space-y-2">
                <Label>{t("kpi.notes_optional", "Notizen (Optional)")}</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("kpi.add_notes", "Notizen hinzufuegen...")} rows={3} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {duplicateWarning.show ? (
            <>
              <Button variant="outline" onClick={() => setDuplicateWarning({ show: false, existingValue: null })}>
                {t("kpi.cancel", "Abbrechen")}
              </Button>
              <Button variant="secondary" onClick={onUpdateExisting}>
                {t("kpi.update_existing", "Bestehenden Wert aktualisieren")}
              </Button>
              <Button onClick={() => handleSubmit(true)}>
                {t("kpi.add_new_entry", "Neuen Eintrag hinzufuegen")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                {t("kpi.cancel", "Abbrechen")}
              </Button>
              <Button onClick={() => handleSubmit(false)} disabled={!parameterId || !value || isSaving}>
                {title}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
