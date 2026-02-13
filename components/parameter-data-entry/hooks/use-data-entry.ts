"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import type { ParameterValue, Parameter, SortConfig } from "../types"
import { DEFAULT_INTERVAL_BADGE_COLORS } from "../types"
import {
  formatDate, startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths, addMonths,
  startOfQuarter, endOfQuarter,
  getQuarter, setQuarter,
  startOfYear, endOfYear,
  subYears, addYears, getWeek,
} from "../date-utils"

function transformApiValue(v: any, fallbackName?: string, fallbackUserName?: string): ParameterValue {
  return {
    id: v.id,
    parameterId: v.parameter_id,
    parameterName: v.parameter?.name || fallbackName || "",
    value: v.value,
    date: v.recorded_date,
    userId: v.recorded_by,
    userName: v.user?.name || fallbackUserName || "",
    notes: v.notes,
    createdAt: v.created_at,
  }
}

export function useDataEntry() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()

  // Core data
  const [parameterValues, setParameterValues] = useState<ParameterValue[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [practiceCategories, setPracticeCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Date selections
  const [selectedMonth, setSelectedMonth] = useState<Date>(subMonths(new Date(), 1))
  const [currentMonth, setCurrentMonth] = useState<Date>(subMonths(new Date(), 1))
  const [selectedWeek, setSelectedWeek] = useState<Date>(subWeeks(new Date(), 1))
  const [selectedQuarter, setSelectedQuarter] = useState(startOfQuarter(new Date()))
  const [selectedYear, setSelectedYear] = useState(startOfYear(new Date()))

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedInterval, setSelectedInterval] = useState<"all" | "weekly" | "monthly" | "quarterly" | "yearly">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogCategory, setDialogCategory] = useState("all")
  const [weeklyDialogCategory, setWeeklyDialogCategory] = useState("all")

  // Dialog state
  const [isAddValueDialogOpen, setIsAddValueDialogOpen] = useState(false)
  const [isAddWeeklyValueDialogOpen, setIsAddWeeklyValueDialogOpen] = useState(false)
  const [isAddQuarterlyValueDialogOpen, setIsAddQuarterlyValueDialogOpen] = useState(false)
  const [isAddYearlyValueDialogOpen, setIsAddYearlyValueDialogOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isDialogMonthPickerOpen, setIsDialogMonthPickerOpen] = useState(false)
  const [isDialogWeekPickerOpen, setIsDialogWeekPickerOpen] = useState(false)
  const [isDialogQuarterPickerOpen, setIsDialogQuarterPickerOpen] = useState(false)
  const [isDialogYearPickerOpen, setIsDialogYearPickerOpen] = useState(false)

  // Edit
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<ParameterValue | null>(null)
  const [editFormData, setEditFormData] = useState({ value: "", notes: "", date: "" })
  const [isEditDialogDatePickerOpen, setIsEditDialogDatePickerOpen] = useState(false)
  const [isEditDialogMonthPickerOpen, setIsEditDialogMonthPickerOpen] = useState(false)
  const [isEditDialogQuarterPickerOpen, setIsEditDialogQuarterPickerOpen] = useState(false)

  // Duplicate warning
  const [duplicateWarning, setDuplicateWarning] = useState<{ show: boolean; existingValue: ParameterValue | null }>({ show: false, existingValue: null })

  // Form data
  const [newValue, setNewValue] = useState({ parameterId: "", value: "", notes: "" })
  const [newWeeklyValue, setNewWeeklyValue] = useState({ parameterId: "", value: "", notes: "" })
  const [intervalBadgeColors, setIntervalBadgeColors] = useState(DEFAULT_INTERVAL_BADGE_COLORS)

  // Sort
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "createdAt", direction: "desc" })
  const [currentView, setCurrentView] = useState<"edit" | "view">("view")

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        if (prev.direction === "desc") return { key, direction: "asc" }
        if (prev.direction === "asc") return { key, direction: null }
        return { key, direction: "desc" }
      }
      return { key, direction: "desc" }
    })
  }, [])

  // --- Data fetching ---
  useEffect(() => {
    const fetchData = async () => {
      if (!currentPractice?.id) return
      try {
        setIsLoading(true)
        const [catResp, paramsResp, valuesResp] = await Promise.all([
          fetch(`/api/practices/${currentPractice.id}/parameter-groups`).catch(() => null),
          fetch(`/api/practices/${currentPractice.id}/parameters`),
          fetch(`/api/practices/${currentPractice.id}/parameter-values`),
        ])
        if (catResp?.ok) {
          const catData = await catResp.json()
          setPracticeCategories((catData.categories || []).map((c: any) => c.name))
        } else { setPracticeCategories([]) }
        if (paramsResp.ok) { const pd = await paramsResp.json(); setParameters(pd.parameters || []) } else { setParameters([]) }
        if (valuesResp.ok) {
          const vd = await valuesResp.json()
          const arr = Array.isArray(vd) ? vd : vd.values || []
          setParameterValues(arr.map((v: any) => transformApiValue(v)))
        } else { setParameterValues([]) }
      } catch { setParameters([]); setParameterValues([]) }
      finally { setIsLoading(false) }
    }
    fetchData()

    const loadDisplaySettings = async () => {
      if (!currentPractice?.id) return
      try {
        const resp = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (resp.ok) {
          const data = await resp.json()
          if (data.settings?.display_settings?.intervalBadgeColors) {
            setIntervalBadgeColors(data.settings.display_settings.intervalBadgeColors)
          }
        }
      } catch { /* ignore */ }
    }
    loadDisplaySettings()
  }, [currentPractice?.id])

  // --- Derived data ---
  const categories = practiceCategories.length > 0 ? practiceCategories : Array.from(new Set(parameters.map((p) => p.category)))

  const filteredParameters = parameters.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = selectedCategory === "all" || p.category === selectedCategory
    const matchInterval = selectedInterval === "all" || !p.interval || p.interval === selectedInterval
    return matchSearch && matchCat && matchInterval && p.isActive
  })

  const getDialogFilteredParams = (interval: string, category: string) =>
    parameters.filter((p) => (category === "all" || p.category === category) && p.isActive && p.interval === interval)

  const dialogFilteredParameters = getDialogFilteredParams("monthly", dialogCategory)
  const weeklyDialogFilteredParameters = getDialogFilteredParams("weekly", weeklyDialogCategory)
  const quarterlyDialogFilteredParameters = getDialogFilteredParams("quarterly", dialogCategory)
  const yearlyDialogFilteredParameters = getDialogFilteredParams("yearly", dialogCategory)

  const currentMonthEntries = parameterValues.filter((v) => {
    const d = new Date(v.date); const s = startOfMonth(currentMonth); const e = endOfMonth(currentMonth)
    return d >= s && d <= e && v.userId === currentUser?.id
  })

  const recentEntries = parameterValues.filter((v) => v.userId === currentUser?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
  const trackedParametersCount = new Set(currentMonthEntries.map((e) => e.parameterId)).size

  // --- Duplicate checks ---
  const checkDuplicate = (parameterId: string, start: Date, end: Date) =>
    parameterValues.find((v) => { const d = new Date(v.date); return v.parameterId === parameterId && v.userId === currentUser?.id && d >= start && d <= end }) || null

  const checkForDuplicateEntry = (pid: string, month: Date) => checkDuplicate(pid, startOfMonth(month), endOfMonth(month))
  const checkForDuplicateEntryQuarterly = (pid: string, q: Date) => checkDuplicate(pid, startOfQuarter(q), endOfQuarter(q))
  const checkForDuplicateEntryYearly = (pid: string, y: Date) => checkDuplicate(pid, startOfYear(y), endOfYear(y))

  // --- Generic save handler ---
  const saveValue = async (parameterId: string, value: string, date: Date, notes: string) => {
    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter || !currentUser || !currentPractice) {
      alert(t("kpi.errors.missing_data", "Fehlende Daten. Bitte laden Sie die Seite neu."))
      return null
    }
    setIsSaving(true)
    try {
      const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-values`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId, value: parameter.type === "number" ? Number.parseFloat(value) : value,
          date: formatDate(date, "yyyy-MM-dd"), userId: currentUser.id, notes: notes || undefined,
        }),
      })
      if (resp.status === 429) { alert(t("kpi.errors.rate_limit", "Zu viele Anfragen.")); return null }
      if (!resp.ok) throw new Error(await resp.text() || t("kpi.errors.failed_to_save", "Fehler"))
      const data = await resp.json()
      const tv = transformApiValue(data.value, parameter.name, currentUser.name)
      setParameterValues((prev) => [...prev, tv])
      return tv
    } catch (error) {
      alert(t("kpi.errors.failed_to_save", "Fehler beim Speichern."))
      return null
    } finally { setIsSaving(false) }
  }

  // --- Interval-specific add handlers ---
  const handleAddValue = async (forceAdd = false) => {
    if (!forceAdd) {
      const dup = checkForDuplicateEntry(newValue.parameterId, currentMonth)
      if (dup) { setDuplicateWarning({ show: true, existingValue: dup }); return }
    }
    const result = await saveValue(newValue.parameterId, newValue.value, currentMonth, newValue.notes)
    if (result) { setNewValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddValueDialogOpen(false) }
  }

  const handleAddWeeklyValue = async (forceAdd = false) => {
    if (!forceAdd) {
      const dup = checkForDuplicateEntry(newWeeklyValue.parameterId, selectedWeek)
      if (dup) { setDuplicateWarning({ show: true, existingValue: dup }); return }
    }
    const result = await saveValue(newWeeklyValue.parameterId, newWeeklyValue.value, selectedWeek, newWeeklyValue.notes)
    if (result) { setNewWeeklyValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddWeeklyValueDialogOpen(false) }
  }

  const handleAddQuarterlyValue = async (forceAdd = false) => {
    if (!forceAdd) {
      const dup = checkForDuplicateEntryQuarterly(newValue.parameterId, selectedQuarter)
      if (dup) { setDuplicateWarning({ show: true, existingValue: dup }); return }
    }
    const result = await saveValue(newValue.parameterId, newValue.value, selectedQuarter, newValue.notes)
    if (result) { setNewValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddQuarterlyValueDialogOpen(false) }
  }

  const handleAddYearlyValue = async (forceAdd = false) => {
    if (!forceAdd) {
      const dup = checkForDuplicateEntryYearly(newValue.parameterId, selectedYear)
      if (dup) { setDuplicateWarning({ show: true, existingValue: dup }); return }
    }
    const result = await saveValue(newValue.parameterId, newValue.value, selectedYear, newValue.notes)
    if (result) { setNewValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddYearlyValueDialogOpen(false) }
  }

  // --- Update existing (duplicate override) ---
  const handleUpdateExisting = async () => {
    if (!duplicateWarning.existingValue || !currentUser || !currentPractice) return
    const parameter = parameters.find((p) => p.id === newValue.parameterId)
    if (!parameter) return
    try {
      const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${duplicateWarning.existingValue.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: parameter.type === "number" ? Number.parseFloat(newValue.value) : newValue.value, notes: newValue.notes || undefined }),
      })
      if (!resp.ok) throw new Error("Fehler")
      const data = await resp.json()
      setParameterValues((prev) => prev.map((v) => v.id === duplicateWarning.existingValue!.id ? { ...v, value: data.value.value, notes: data.value.notes, createdAt: data.value.updated_at } : v))
      setNewValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddValueDialogOpen(false)
    } catch { alert(t("kpi.errors.failed_to_update", "Fehler beim Aktualisieren.")) }
  }

  const handleUpdateExistingWeekly = async () => {
    if (!duplicateWarning.existingValue || !currentUser || !currentPractice) return
    const parameter = parameters.find((p) => p.id === newWeeklyValue.parameterId)
    if (!parameter) return
    try {
      const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${duplicateWarning.existingValue.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: parameter.type === "number" ? Number.parseFloat(newWeeklyValue.value) : newWeeklyValue.value, notes: newWeeklyValue.notes || undefined }),
      })
      if (!resp.ok) throw new Error("Fehler")
      const data = await resp.json()
      setParameterValues((prev) => prev.map((v) => v.id === duplicateWarning.existingValue!.id ? { ...v, value: data.value.value, notes: data.value.notes, createdAt: data.value.updated_at } : v))
      setNewWeeklyValue({ parameterId: "", value: "", notes: "" }); setDuplicateWarning({ show: false, existingValue: null }); setIsAddWeeklyValueDialogOpen(false)
    } catch { alert(t("kpi.errors.failed_to_update", "Fehler beim Aktualisieren.")) }
  }

  // --- Edit / Delete ---
  const handleEditValue = (value: ParameterValue) => {
    setEditingValue(value); setEditFormData({ value: String(value.value), notes: value.notes || "", date: value.date }); setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingValue || !currentPractice?.id) return
    try {
      const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${editingValue.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editFormData.value, notes: editFormData.notes, date: editFormData.date }),
      })
      if (!resp.ok) throw new Error("Fehler")
      setParameterValues((prev) => prev.map((v) => v.id === editingValue.id ? { ...v, value: editFormData.value, notes: editFormData.notes, date: editFormData.date } : v))
      setIsEditDialogOpen(false); setEditingValue(null)
    } catch { alert(t("kpi.error_updating_value", "Fehler beim Aktualisieren")) }
  }

  const handleDeleteValue = async (valueId: string) => {
    if (!currentPractice?.id) return
    if (!confirm(t("kpi.confirm_delete_value", "Wirklich loeschen?"))) return
    try {
      const resp = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${valueId}`, { method: "DELETE" })
      if (!resp.ok) throw new Error("Fehler")
      setParameterValues((prev) => prev.filter((v) => v.id !== valueId))
    } catch { alert(t("kpi.error_deleting_value", "Fehler beim Loeschen")) }
  }

  // --- Navigation ---
  const handlePreviousMonth = () => setSelectedMonth(subMonths(selectedMonth, 1))
  const handleNextMonth = () => setSelectedMonth(addMonths(selectedMonth, 1))
  const handleCurrentMonth = () => setSelectedMonth(new Date())

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = endOfWeek(date, { weekStartsOn: 1 })
    return `${formatDate(start, "dd.MM")} - ${formatDate(end, "dd.MM.yyyy")}`
  }

  const getLastWeeks = (count = 12) => {
    const weeks: Date[] = []
    for (let i = 0; i < count; i++) weeks.push(subWeeks(new Date(), i))
    return weeks
  }

  const getMonthlyAggregation = (parameterId: string, month: Date) => {
    const monthStart = startOfMonth(month); const monthEnd = endOfMonth(month)
    const monthlyValues = parameterValues.filter((v) => { const d = new Date(v.date); return v.parameterId === parameterId && d >= monthStart && d <= monthEnd })
    if (monthlyValues.length === 0) return null
    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter) return null
    if (parameter.type === "number") {
      const nums = monthlyValues.map((v) => Number(v.value)).filter((v) => !isNaN(v))
      return { count: nums.length, sum: nums.reduce((a, b) => a + b, 0), average: nums.reduce((a, b) => a + b, 0) / nums.length, min: Math.min(...nums), max: Math.max(...nums), values: monthlyValues }
    }
    return { count: monthlyValues.length, values: monthlyValues }
  }

  return {
    // Context
    currentUser, currentPractice, t,
    // Data
    parameterValues, parameters, practiceCategories, isLoading, isSaving,
    // Date selections
    selectedMonth, setSelectedMonth, currentMonth, setCurrentMonth,
    selectedWeek, setSelectedWeek, selectedQuarter, setSelectedQuarter,
    selectedYear, setSelectedYear,
    // Filters
    selectedCategory, setSelectedCategory, selectedInterval, setSelectedInterval,
    searchTerm, setSearchTerm, dialogCategory, setDialogCategory,
    weeklyDialogCategory, setWeeklyDialogCategory, categories,
    filteredParameters, dialogFilteredParameters, weeklyDialogFilteredParameters,
    quarterlyDialogFilteredParameters, yearlyDialogFilteredParameters,
    // Dialogs
    isAddValueDialogOpen, setIsAddValueDialogOpen,
    isAddWeeklyValueDialogOpen, setIsAddWeeklyValueDialogOpen,
    isAddQuarterlyValueDialogOpen, setIsAddQuarterlyValueDialogOpen,
    isAddYearlyValueDialogOpen, setIsAddYearlyValueDialogOpen,
    isMonthPickerOpen, setIsMonthPickerOpen,
    isDialogMonthPickerOpen, setIsDialogMonthPickerOpen,
    isDialogWeekPickerOpen, setIsDialogWeekPickerOpen,
    isDialogQuarterPickerOpen, setIsDialogQuarterPickerOpen,
    isDialogYearPickerOpen, setIsDialogYearPickerOpen,
    // Edit
    isEditDialogOpen, setIsEditDialogOpen, editingValue, editFormData, setEditFormData,
    isEditDialogDatePickerOpen, setIsEditDialogDatePickerOpen,
    isEditDialogMonthPickerOpen, setIsEditDialogMonthPickerOpen,
    isEditDialogQuarterPickerOpen, setIsEditDialogQuarterPickerOpen,
    // Duplicate
    duplicateWarning, setDuplicateWarning,
    // Form data
    newValue, setNewValue, newWeeklyValue, setNewWeeklyValue,
    intervalBadgeColors, sortConfig, handleSort, currentView, setCurrentView,
    // Derived
    currentMonthEntries, recentEntries, trackedParametersCount,
    // Handlers
    handleAddValue, handleAddWeeklyValue, handleAddQuarterlyValue, handleAddYearlyValue,
    handleUpdateExisting, handleUpdateExistingWeekly,
    handleEditValue, handleSaveEdit, handleDeleteValue,
    handlePreviousMonth, handleNextMonth, handleCurrentMonth,
    formatWeekRange, getLastWeeks, getMonthlyAggregation,
    // Date utils (re-exported for JSX)
    formatDate, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, addMonths,
    startOfQuarter, endOfQuarter, getQuarter, setQuarter,
    startOfYear, endOfYear, subYears, addYears, getWeek,
  }
}
