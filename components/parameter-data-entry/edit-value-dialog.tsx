"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import type { Parameter, ParameterValue } from "./types"
import { formatDate, getWeek, getQuarter, startOfWeek, endOfWeek } from "./date-utils"
import { useState } from "react"

interface EditValueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingValue: ParameterValue | null
  editFormData: { value: string; notes: string; date: string }
  setEditFormData: (data: { value: string; notes: string; date: string }) => void
  parameters: Parameter[]
  isSaving: boolean
  onSave: () => void
  t: (key: string, fallback: string) => string
}

export function EditValueDialog({
  open, onOpenChange, editingValue, editFormData, setEditFormData,
  parameters, isSaving, onSave, t,
}: EditValueDialogProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [quarterPickerOpen, setQuarterPickerOpen] = useState(false)

  const param = editingValue ? parameters.find((p) => p.id === editingValue.parameterId) : null

  const renderDateEditor = () => {
    if (!editingValue || !param) return null
    const currentDate = new Date(editFormData.date)

    if (param.interval === "weekly") {
      const ws = startOfWeek(currentDate, { weekStartsOn: 1 })
      const we = endOfWeek(currentDate, { weekStartsOn: 1 })
      return (
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />
              KW {getWeek(currentDate)} - {formatDate(ws, "dd.MM.yyyy")} - {formatDate(we, "dd.MM.yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 text-sm text-muted-foreground border-b">
              {t("kpi.select_date_for_week", "Wahlen Sie ein Datum, um die Woche auszuwahlen")}
            </div>
            <CalendarComponent mode="single" selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  setEditFormData({ ...editFormData, date: startOfWeek(date, { weekStartsOn: 1 }).toISOString() })
                  setDatePickerOpen(false)
                }
              }} />
          </PopoverContent>
        </Popover>
      )
    }

    if (param.interval === "monthly") {
      const cy = currentDate.getFullYear()
      const cm = currentDate.getMonth()
      return (
        <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />{formatDate(currentDate, "MMMM yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => {
                  const d = new Date(editFormData.date); d.setFullYear(cy - 1); setEditFormData({ ...editFormData, date: d.toISOString() })
                }}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-sm font-medium">{cy}</div>
                <Button variant="outline" size="sm" onClick={() => {
                  const d = new Date(editFormData.date); d.setFullYear(cy + 1); setEditFormData({ ...editFormData, date: d.toISOString() })
                }}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => (
                  <Button key={i} variant={i === cm ? "default" : "outline"} size="sm"
                    onClick={() => {
                      setEditFormData({ ...editFormData, date: new Date(cy, i, 1).toISOString() })
                      setMonthPickerOpen(false)
                    }}>
                    {formatDate(new Date(cy, i, 1), "MMM")}
                  </Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    if (param.interval === "quarterly") {
      const cy = currentDate.getFullYear()
      const cq = getQuarter(currentDate)
      return (
        <Popover open={quarterPickerOpen} onOpenChange={setQuarterPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-left font-normal bg-transparent">
              <CalendarIcon className="mr-2 h-4 w-4" />Q{cq} {cy}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => {
                  const d = new Date(editFormData.date); d.setFullYear(cy - 1); setEditFormData({ ...editFormData, date: d.toISOString() })
                }}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="text-sm font-medium">{cy}</div>
                <Button variant="outline" size="sm" onClick={() => {
                  const d = new Date(editFormData.date); d.setFullYear(cy + 1); setEditFormData({ ...editFormData, date: d.toISOString() })
                }}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((q) => (
                  <Button key={q} variant={q === cq ? "default" : "outline"} size="sm"
                    onClick={() => {
                      setEditFormData({ ...editFormData, date: new Date(cy, (q - 1) * 3, 1).toISOString() })
                      setQuarterPickerOpen(false)
                    }}>Q{q}</Button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )
    }

    if (param.interval === "yearly") {
      const cy = currentDate.getFullYear()
      return (
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const d = new Date(editFormData.date); d.setFullYear(cy - 1); setEditFormData({ ...editFormData, date: d.toISOString() })
          }}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-sm font-medium">{cy}</div>
          <Button type="button" variant="outline" size="sm" onClick={() => {
            const d = new Date(editFormData.date); d.setFullYear(cy + 1); setEditFormData({ ...editFormData, date: d.toISOString() })
          }}><ChevronRight className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => {
            const d = new Date(); d.setMonth(0, 1); setEditFormData({ ...editFormData, date: d.toISOString() })
          }}>{t("kpi.current_year", "Aktuelles Jahr")}</Button>
        </div>
      )
    }

    return <div className="text-sm text-muted-foreground">{formatDate(currentDate, "MMMM yyyy")}</div>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("kpi.edit_value", "Wert bearbeiten")}</DialogTitle>
          <DialogDescription>{t("kpi.edit_value_description", "Andern Sie den Wert und die Notizen.")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {editingValue && (
            <div className="p-3 bg-muted rounded-md">
              <div className="font-medium">{editingValue.parameterName}</div>
              <div className="mt-2">{renderDateEditor()}</div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="edit-value">{t("kpi.value", "Wert")}</Label>
            <Input id="edit-value" value={editFormData.value}
              onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
              placeholder={t("kpi.enter_value", "Wert eingeben")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">{t("kpi.notes", "Notizen")}</Label>
            <Textarea id="edit-notes" value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
              placeholder={t("kpi.optional_notes", "Optionale Notizen")} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("kpi.cancel", "Abbrechen")}</Button>
          <Button onClick={onSave} disabled={isSaving}>{t("kpi.save", "Speichern")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
