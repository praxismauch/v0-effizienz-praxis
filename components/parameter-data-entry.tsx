"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar" // Changed import name
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import {
  Plus,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  CalendarIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
// REMOVED: import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, addMonths, startOfQuarter, getQuarter, setQuarter, startOfYear, subYears, addYears, endOfYear, endOfQuarter, getWeek } from "date-fns"
// REMOVED: import { de } from "date-fns/locale"

// ADDED: Native date utility functions
const formatDate = (date: Date, format: string) => {
  if (format === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0]
  }
  if (format === "dd.MM") {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(date)
  }
  if (format === "dd.MM.yyyy") {
    return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
  }
  if (format === "QQQ yyyy") {
    const quarter = Math.floor(date.getMonth() / 3) + 1
    return `Q${quarter} ${date.getFullYear()}`
  }
  return date.toLocaleDateString("de-DE")
}

const startOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const d = new Date(date)
  const day = d.getDay()
  // Adjust to make Monday the start of the week (0 for Sunday, 1 for Monday, etc.)
  // If day is 0 (Sunday), diff should be 1 to make it Monday. If day is 1 (Monday), diff should be 0.
  // The formula (day === 0 ? 6 : day - 1) makes Sunday = 6, Monday = 0, etc.
  // We want Monday to be 0, so we subtract that from the current day.
  const dayOfWeek = options?.weekStartsOn === 1 ? (day === 0 ? 6 : day - 1) : day // Default to Sunday as 0
  const diff = dayOfWeek // Monday is day 1, Sunday is day 0
  d.setDate(d.getDate() - dayOfWeek) // Set to start of week
  d.setHours(0, 0, 0, 0)
  return d
}

const endOfWeek = (date: Date, options?: { weekStartsOn?: number }) => {
  const start = startOfWeek(date, options)
  const dayOfWeek = options?.weekStartsOn === 1 ? 6 : 6 // Sunday is day 6 if Monday is start of week
  start.setDate(start.getDate() + dayOfWeek)
  start.setHours(23, 59, 59, 999)
  return start
}

const subWeeks = (date: Date, weeks: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() - weeks * 7)
  return d
}

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

const subMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

const addMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

const startOfQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3, 1)
}

const endOfQuarter = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3)
  return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
}

const getQuarter = (date: Date) => {
  return Math.floor(date.getMonth() / 3) + 1
}

const setQuarter = (date: Date, quarter: number) => {
  const d = new Date(date)
  d.setMonth((quarter - 1) * 3)
  return d
}

const startOfYear = (date: Date) => {
  return new Date(date.getFullYear(), 0, 1)
}

const endOfYear = (date: Date) => {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

const subYears = (date: Date, years: number) => {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() - years)
  return d
}

const addYears = (date: Date, years: number) => {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

const getWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // Calculate full weeks to nearest Thursday
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

interface ParameterValue {
  id: string
  parameterId: string
  parameterName: string
  value: string | number | boolean
  date: string
  userId: string
  userName: string
  notes?: string
  createdAt: string
}

interface Parameter {
  id: string
  name: string
  description: string
  type: "number" | "text" | "boolean" | "date" | "select"
  category: string
  unit?: string
  options?: string[]
  isActive: boolean
  interval?: "weekly" | "monthly" | "quarterly" | "yearly"
}

export function ParameterDataEntry() {
  const router = useRouter()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const [parameterValues, setParameterValues] = useState<ParameterValue[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [practiceCategories, setPracticeCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false) // ADDED: State for save loading indicator
  const [selectedMonth, setSelectedMonth] = useState<Date>(subMonths(new Date(), 1))
  const [currentMonth, setCurrentMonth] = useState<Date>(subMonths(new Date(), 1))
  const [selectedWeek, setSelectedWeek] = useState<Date>(subWeeks(new Date(), 1))
  // CHANGE: Add state for quarter selection
  const [selectedQuarter, setSelectedQuarter] = useState(startOfQuarter(new Date()))
  const [selectedYear, setSelectedYear] = useState(startOfYear(new Date()))
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedInterval, setSelectedInterval] = useState<"all" | "weekly" | "monthly" | "quarterly" | "yearly">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddValueDialogOpen, setIsAddValueDialogOpen] = useState(false)
  const [isAddWeeklyValueDialogOpen, setIsAddWeeklyValueDialogOpen] = useState(false)
  // CHANGE: Added state for quarterly and yearly dialogs
  const [isAddQuarterlyValueDialogOpen, setIsAddQuarterlyValueDialogOpen] = useState(false)
  const [isAddYearlyValueDialogOpen, setIsAddYearlyValueDialogOpen] = useState(false)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [isDialogMonthPickerOpen, setIsDialogMonthPickerOpen] = useState(false)
  const [isDialogWeekPickerOpen, setIsDialogWeekPickerOpen] = useState(false)
  // CHANGE: Add state for quarter picker
  const [isDialogQuarterPickerOpen, setIsDialogQuarterPickerOpen] = useState(false)
  const [isDialogYearPickerOpen, setIsDialogYearPickerOpen] = useState(false)
  const [dialogCategory, setDialogCategory] = useState<string>("all") // Changed from dialogCategoryFilter
  const [weeklyDialogCategory, setWeeklyDialogCategory] = useState<string>("all") // Changed from weeklyDialogCategoryFilter
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean
    existingValue: ParameterValue | null
  }>({ show: false, existingValue: null })

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingValue, setEditingValue] = useState<ParameterValue | null>(null)
  const [editFormData, setEditFormData] = useState({
    value: "",
    notes: "",
    date: "", // Added date field
  })

  // CHANGE: Add state for edit dialog date pickers
  const [isEditDialogDatePickerOpen, setIsEditDialogDatePickerOpen] = useState(false)
  const [isEditDialogMonthPickerOpen, setIsEditDialogMonthPickerOpen] = useState(false)
  const [isEditDialogQuarterPickerOpen, setIsEditDialogQuarterPickerOpen] = useState(false)

  const [newValue, setNewValue] = useState({
    parameterId: "",
    value: "",
    notes: "",
  })

  const [newWeeklyValue, setNewWeeklyValue] = useState({
    parameterId: "",
    value: "",
    notes: "",
  })

  const [intervalBadgeColors, setIntervalBadgeColors] = useState({
    weekly: "#3b82f6",
    monthly: "#f97316",
    quarterly: "#a855f7",
    yearly: "#22c55e",
  })

  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: "asc" | "desc" | null
  }>({
    key: "createdAt",
    direction: "desc",
  })

  const handleSort = useCallback((key: string) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        // Toggle through: desc -> asc -> null -> desc
        if (prevConfig.direction === "desc") {
          return { key, direction: "asc" }
        } else if (prevConfig.direction === "asc") {
          return { key, direction: null }
        } else {
          return { key, direction: "desc" }
        }
      } else {
        return { key, direction: "desc" }
      }
    })
  }, [])

  const SortIcon = useCallback(
    ({ columnKey }: { columnKey: string }) => {
      if (sortConfig.key !== columnKey) {
        return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      }
      if (sortConfig.direction === "desc") {
        return <ArrowDown className="ml-2 h-4 w-4" />
      }
      if (sortConfig.direction === "asc") {
        return <ArrowUp className="ml-2 h-4 w-4" />
      }
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    },
    [sortConfig],
  )

  useEffect(() => {
    const fetchData = async () => {
      if (!currentPractice?.id) return

      try {
        setIsLoading(true)

        try {
          const categoriesResponse = await fetch(`/api/practices/${currentPractice.id}/parameter-groups`)
          if (categoriesResponse.ok) {
            const categoriesData = await categoriesResponse.json()
            const categoryNames = (categoriesData.categories || []).map((cat: any) => cat.name)
            setPracticeCategories(categoryNames)
            console.log("[v0] Loaded categories:", categoryNames.length)
          } else {
            console.error("[v0] Failed to fetch categories:", categoriesResponse.status)
            setPracticeCategories([])
          }
        } catch (categoryError) {
          console.error("[v0] Error fetching categories:", categoryError)
          setPracticeCategories([])
        }

        const paramsResponse = await fetch(`/api/practices/${currentPractice.id}/parameters`)
        if (paramsResponse.ok) {
          const paramsData = await paramsResponse.json()
          setParameters(paramsData.parameters || [])
        } else {
          console.error("[v0] Failed to fetch parameters:", paramsResponse.status)
          setParameters([])
        }

        const valuesResponse = await fetch(`/api/practices/${currentPractice.id}/parameter-values`)
        if (valuesResponse.ok) {
          const valuesData = await valuesResponse.json()

          const valuesArray = Array.isArray(valuesData) ? valuesData : valuesData.values || []

          const transformedValues = valuesArray.map((v: any) => ({
            id: v.id,
            parameterId: v.parameter_id,
            parameterName: v.parameter?.name || "",
            value: v.value,
            date: v.recorded_date,
            userId: v.recorded_by,
            userName: v.user?.name || "",
            notes: v.notes,
            createdAt: v.created_at,
          }))

          setParameterValues(transformedValues)
        } else {
          console.error("[v0] Failed to fetch parameter values:", valuesResponse.status)
          setParameterValues([])
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        setParameters([])
        setParameterValues([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    const loadDisplaySettings = async () => {
      if (!currentPractice?.id) return

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (response.ok) {
          const data = await response.json()

          if (data.settings?.display_settings?.intervalBadgeColors) {
            setIntervalBadgeColors(data.settings.display_settings.intervalBadgeColors)
            console.log(
              "[v0] Loaded interval badge colors from settings:",
              data.settings.display_settings.intervalBadgeColors,
            )
          } else {
            // Fallback to localStorage
            try {
              const savedSettings = localStorage.getItem("displaySettings")
              if (savedSettings) {
                const parsed = JSON.parse(savedSettings)
                if (parsed.intervalBadgeColors) {
                  setIntervalBadgeColors(parsed.intervalBadgeColors)
                  console.log("[v0] Loaded interval badge colors from localStorage")
                }
              }
            } catch (parseError) {
              console.error("[v0] Failed to parse display settings from localStorage:", parseError)
              // Clear corrupted data
              localStorage.removeItem("displaySettings")
            }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load display settings:", error)
      }
    }

    loadDisplaySettings()
  }, [currentPractice?.id])

  const categories =
    practiceCategories.length > 0 ? practiceCategories : Array.from(new Set(parameters.map((p) => p.category)))
  const filteredParameters = parameters.filter((param) => {
    const matchesSearch =
      param.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      param.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || param.category === selectedCategory
    const matchesInterval = selectedInterval === "all" || !param.interval || param.interval === selectedInterval
    return matchesSearch && matchesCategory && matchesInterval && param.isActive
  })

  const dialogFilteredParameters = parameters.filter((param) => {
    const matchesCategory = dialogCategory === "all" || param.category === dialogCategory // Use dialogCategory
    const isMonthly = param.interval === "monthly"
    return matchesCategory && param.isActive && isMonthly
  })

  const weeklyDialogFilteredParameters = parameters.filter((param) => {
    const matchesCategory = weeklyDialogCategory === "all" || param.category === weeklyDialogCategory // Use weeklyDialogCategory
    const isWeekly = param.interval === "weekly"
    return matchesCategory && param.isActive && isWeekly
  })

  // CHANGE: Add filters for quarterly and yearly dialogs
  const quarterlyDialogFilteredParameters = parameters.filter((param) => {
    const matchesCategory = dialogCategory === "all" || param.category === dialogCategory
    const isQuarterly = param.interval === "quarterly"
    return matchesCategory && param.isActive && isQuarterly
  })

  const yearlyDialogFilteredParameters = parameters.filter((param) => {
    const matchesCategory = dialogCategory === "all" || param.category === dialogCategory
    const isYearly = param.interval === "yearly"
    return matchesCategory && param.isActive && isYearly
  })

  const todaysEntries = parameterValues.filter(
    (value) => value.date === formatDate(new Date(), "yyyy-MM-dd") && value.userId === currentUser?.id,
  )

  const selectedMonthEntries = parameterValues.filter((value) => {
    const valueDate = new Date(value.date)
    const monthStart = startOfMonth(selectedMonth)
    const monthEnd = endOfMonth(selectedMonth)
    return valueDate >= monthStart && valueDate <= monthEnd && value.userId === currentUser?.id
  })

  const currentMonthEntries = parameterValues.filter((value) => {
    const valueDate = new Date(value.date)
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    return valueDate >= monthStart && valueDate <= monthEnd && value.userId === currentUser?.id
  })

  const recentEntries = parameterValues
    .filter((value) => value.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  const getMonthlyAggregation = (parameterId: string, month: Date) => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    const monthlyValues = parameterValues.filter((value) => {
      const valueDate = new Date(value.date)
      return value.parameterId === parameterId && valueDate >= monthStart && valueDate <= monthEnd
    })

    if (monthlyValues.length === 0) return null

    const parameter = parameters.find((p) => p.id === parameterId)
    if (!parameter) return null

    if (parameter.type === "number") {
      const numericValues = monthlyValues.map((v) => Number(v.value)).filter((v) => !isNaN(v))
      const sum = numericValues.reduce((acc, val) => acc + val, 0)
      const avg = sum / numericValues.length
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)

      return {
        count: numericValues.length,
        sum: sum,
        average: avg,
        min: min,
        max: max,
        values: monthlyValues,
      }
    }

    return {
      count: monthlyValues.length,
      values: monthlyValues,
    }
  }

  const checkForDuplicateEntry = (parameterId: string, month: Date): ParameterValue | null => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)

    const existingEntry = parameterValues.find((value) => {
      const valueDate = new Date(value.date)
      return (
        value.parameterId === parameterId &&
        value.userId === currentUser?.id &&
        valueDate >= monthStart &&
        valueDate <= monthEnd
      )
    })

    return existingEntry || null
  }

  // CHANGE: Add duplicate check for quarterly and yearly
  const checkForDuplicateEntryQuarterly = (parameterId: string, quarter: Date): ParameterValue | null => {
    const quarterStart = startOfQuarter(quarter)
    const quarterEnd = endOfQuarter(quarter) // Corrected: endOfQuarter is imported

    const existingEntry = parameterValues.find((value) => {
      const valueDate = new Date(value.date)
      return (
        value.parameterId === parameterId &&
        value.userId === currentUser?.id &&
        valueDate >= quarterStart &&
        valueDate <= quarterEnd
      )
    })

    return existingEntry || null
  }

  const checkForDuplicateEntryYearly = (parameterId: string, year: Date): ParameterValue | null => {
    const yearStart = startOfYear(year)
    const yearEnd = endOfYear(year) // Corrected: endOfYear is imported

    const existingEntry = parameterValues.find((value) => {
      const valueDate = new Date(value.date)
      return (
        value.parameterId === parameterId &&
        value.userId === currentUser?.id &&
        valueDate >= yearStart &&
        valueDate <= yearEnd
      )
    })

    return existingEntry || null
  }

  const handleAddValue = async (forceAdd = false) => {
    const parameter = parameters.find((p) => p.id === newValue.parameterId)
    if (!parameter || !currentUser || !currentPractice) {
      console.error("[v0] Missing required data:", {
        hasParameter: !!parameter,
        hasUser: !!currentUser,
        hasPractice: !!currentPractice,
      })
      alert(t("kpi.errors.missing_data", "Fehlende Daten. Bitte laden Sie die Seite neu."))
      return
    }

    const entryDate = currentMonth

    if (!forceAdd) {
      const existingEntry = checkForDuplicateEntry(newValue.parameterId, entryDate)
      if (existingEntry) {
        setDuplicateWarning({ show: true, existingValue: existingEntry })
        return
      }
    }

    setIsSaving(true)

    try {
      console.log("[v0] Saving parameter value:", {
        practiceId: currentPractice.id,
        parameterId: newValue.parameterId,
        value: newValue.value,
        userId: currentUser.id,
      })

      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId: newValue.parameterId,
          value: parameter.type === "number" ? Number.parseFloat(newValue.value) : newValue.value,
          date: formatDate(entryDate, "yyyy-MM-dd"),
          userId: currentUser.id,
          notes: newValue.notes || undefined,
        }),
      })

      if (response.status === 429) {
        console.error("[v0] Rate limit hit when saving parameter value")
        alert(
          t("kpi.errors.rate_limit", "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut."),
        )
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response:", response.status, errorText)
        throw new Error(errorText || t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts"))
      }

      const data = await response.json()
      console.log("[v0] Parameter value saved successfully:", data)

      const transformedValue: ParameterValue = {
        id: data.value.id,
        parameterId: data.value.parameter_id,
        parameterName: data.value.parameter?.name || parameter.name,
        value: data.value.value,
        date: data.value.recorded_date,
        userId: data.value.recorded_by,
        userName: data.value.user?.name || currentUser.name,
        notes: data.value.notes,
        createdAt: data.value.created_at,
      }

      setParameterValues([...parameterValues, transformedValue])
      setNewValue({ parameterId: "", value: "", notes: "" })
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding parameter value:", error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts")
      alert(
        errorMessage.includes("Too Many")
          ? t("kpi.errors.rate_limit", "Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.")
          : t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts. Bitte versuchen Sie es erneut."),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddWeeklyValue = async (forceAdd = false) => {
    const parameter = parameters.find((p) => p.id === newWeeklyValue.parameterId)
    if (!parameter || !currentUser || !currentPractice) return

    const entryDate = selectedWeek // Changed from currentMonth to selectedWeek

    if (!forceAdd) {
      const existingEntry = checkForDuplicateEntry(newWeeklyValue.parameterId, entryDate)
      if (existingEntry) {
        setDuplicateWarning({ show: true, existingValue: existingEntry })
        return
      }
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId: newWeeklyValue.parameterId,
          value: parameter.type === "number" ? Number.parseFloat(newWeeklyValue.value) : newWeeklyValue.value,
          date: formatDate(entryDate, "yyyy-MM-dd"), // Changed from currentMonth to selectedWeek
          userId: currentUser.id,
          notes: newWeeklyValue.notes || undefined,
        }),
      })

      if (!response.ok) throw new Error(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts"))

      const data = await response.json()

      const transformedValue: ParameterValue = {
        id: data.value.id,
        parameterId: data.value.parameter_id,
        parameterName: data.value.parameter?.name || parameter.name,
        value: data.value.value,
        date: data.value.recorded_date,
        userId: data.value.recorded_by,
        userName: data.value.user?.name || currentUser.name,
        notes: data.value.notes,
        createdAt: data.value.created_at,
      }

      setParameterValues([...parameterValues, transformedValue])
      setNewWeeklyValue({ parameterId: "", value: "", notes: "" })
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddWeeklyValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding weekly parameter value:", error)
      alert(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts. Bitte versuchen Sie es erneut."))
    }
  }

  // CHANGE: Add handlers for quarterly and yearly data entry
  const handleAddQuarterlyValue = async (forceAdd = false) => {
    const parameter = parameters.find((p) => p.id === newValue.parameterId) // Assuming newValue is used for quarterly too, adjust if separate state is needed
    if (!parameter || !currentUser || !currentPractice) return

    const entryDate = selectedQuarter // Use start of current quarter for simplicity, or allow selection

    if (!forceAdd) {
      const existingEntry = checkForDuplicateEntryQuarterly(newValue.parameterId, entryDate)
      if (existingEntry) {
        setDuplicateWarning({ show: true, existingValue: existingEntry })
        return
      }
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId: newValue.parameterId,
          value: parameter.type === "number" ? Number.parseFloat(newValue.value) : newValue.value,
          date: formatDate(entryDate, "yyyy-MM-dd"),
          userId: currentUser.id,
          notes: newValue.notes || undefined,
        }),
      })

      if (!response.ok) throw new Error(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts"))

      const data = await response.json()

      const transformedValue: ParameterValue = {
        id: data.value.id,
        parameterId: data.value.parameter_id,
        parameterName: data.value.parameter?.name || parameter.name,
        value: data.value.value,
        date: data.value.recorded_date,
        userId: data.value.recorded_by,
        userName: data.value.user?.name || currentUser.name,
        notes: data.value.notes,
        createdAt: data.value.created_at,
      }

      setParameterValues([...parameterValues, transformedValue])
      setNewValue({ parameterId: "", value: "", notes: "" }) // Reset form
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddQuarterlyValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding quarterly parameter value:", error)
      alert(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts. Bitte versuchen Sie es erneut."))
    }
  }

  const handleAddYearlyValue = async (forceAdd = false) => {
    const parameter = parameters.find((p) => p.id === newValue.parameterId) // Assuming newValue is used for yearly too, adjust if separate state is needed
    if (!parameter || !currentUser || !currentPractice) return

    const entryDate = selectedYear // Use start of current year for simplicity, or allow selection

    if (!forceAdd) {
      const existingEntry = checkForDuplicateEntryYearly(newValue.parameterId, entryDate)
      if (existingEntry) {
        setDuplicateWarning({ show: true, existingValue: existingEntry })
        return
      }
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterId: newValue.parameterId,
          value: parameter.type === "number" ? Number.parseFloat(newValue.value) : newValue.value,
          date: formatDate(entryDate, "yyyy-MM-dd"),
          userId: currentUser.id,
          notes: newValue.notes || undefined,
        }),
      })

      if (!response.ok) throw new Error(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts"))

      const data = await response.json()

      const transformedValue: ParameterValue = {
        id: data.value.id,
        parameterId: data.value.parameter_id,
        parameterName: data.value.parameter?.name || parameter.name,
        value: data.value.value,
        date: data.value.recorded_date,
        userId: data.value.recorded_by,
        userName: data.value.user?.name || currentUser.name,
        notes: data.value.notes,
        createdAt: data.value.created_at,
      }

      setParameterValues([...parameterValues, transformedValue])
      setNewValue({ parameterId: "", value: "", notes: "" }) // Reset form
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddYearlyValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding yearly parameter value:", error)
      alert(t("kpi.errors.failed_to_save", "Fehler beim Speichern des Parameterwerts. Bitte versuchen Sie es erneut."))
    }
  }

  const handleUpdateExistingWeekly = async () => {
    if (!duplicateWarning.existingValue || !currentUser || !currentPractice) return

    const parameter = parameters.find((p) => p.id === newWeeklyValue.parameterId)
    if (!parameter) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/parameter-values/${duplicateWarning.existingValue.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: parameter.type === "number" ? Number.parseFloat(newWeeklyValue.value) : newWeeklyValue.value,
            notes: newWeeklyValue.notes || undefined,
          }),
        },
      )

      if (!response.ok)
        throw new Error(t("kpi.errors.failed_to_update", "Fehler beim Aktualisieren des Parameterwerts"))

      const data = await response.json()

      const updatedValues = parameterValues.map((value) => {
        if (value.id === duplicateWarning.existingValue!.id) {
          return {
            ...value,
            value: data.value.value,
            notes: data.value.notes,
            createdAt: data.value.updated_at,
          }
        }
        return value
      })

      setParameterValues(updatedValues)
      setNewWeeklyValue({ parameterId: "", value: "", notes: "" })
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddWeeklyValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error updating weekly parameter value:", error)
      alert(
        t(
          "kpi.errors.failed_to_update",
          "Fehler beim Aktualisieren des Parameterwerts. Bitte versuchen Sie es erneut.",
        ),
      )
    }
  }

  const handlePreviousMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1))
  }

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date())
  }

  const renderValueInput = (parameter: Parameter) => {
    switch (parameter.type) {
      case "number":
        return (
          <Input
            type="number"
            value={newValue.value}
            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
            placeholder={`${t("kpi.enter_value", "Wert eingeben")} ${parameter.unit || ""}`}
          />
        )
      case "text":
        return (
          <Input
            value={newValue.value}
            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
            placeholder={t("kpi.placeholders.enter_text", "Textwert eingeben")}
          />
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={newValue.value === "true"}
              onCheckedChange={(checked) => setNewValue({ ...newValue, value: checked.toString() })}
            />
            <Label>{newValue.value === "true" ? t("kpi.boolean.yes", "Ja") : t("kpi.boolean.no", "Nein")}</Label>
          </div>
        )
      case "select":
        return (
          <Select value={newValue.value} onValueChange={(value) => setNewValue({ ...newValue, value })}>
            <SelectTrigger>
              <SelectValue placeholder={t("kpi.placeholders.select_option", "Option wählen")} />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "date":
        return (
          <Input
            type="date"
            value={newValue.value}
            onChange={(e) => setNewValue({ ...newValue, value: e.target.value })}
            className="w-full"
          />
        )
      default:
        return null
    }
  }

  const renderWeeklyValueInput = (parameter: Parameter) => {
    switch (parameter.type) {
      case "number":
        return (
          <Input
            type="number"
            value={newWeeklyValue.value}
            onChange={(e) => setNewWeeklyValue({ ...newWeeklyValue, value: e.target.value })}
            placeholder={`${t("kpi.enter_value", "Wert eingeben")} ${parameter.unit || ""}`}
          />
        )
      case "text":
        return (
          <Input
            value={newWeeklyValue.value}
            onChange={(e) => setNewWeeklyValue({ ...newWeeklyValue, value: e.target.value })}
            placeholder={t("kpi.placeholders.enter_text", "Textwert eingeben")}
          />
        )
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={newWeeklyValue.value === "true"}
              onCheckedChange={(checked) => setNewWeeklyValue({ ...newWeeklyValue, value: checked.toString() })}
            />
            <Label>{newWeeklyValue.value === "true" ? t("kpi.boolean.yes", "Ja") : t("kpi.boolean.no", "Nein")}</Label>
          </div>
        )
      case "select":
        return (
          <Select
            value={newWeeklyValue.value}
            onValueChange={(value) => setNewWeeklyValue({ ...newWeeklyValue, value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("kpi.placeholders.select_option", "Option wählen")} />
            </SelectTrigger>
            <SelectContent>
              {parameter.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "date":
        return (
          <Input
            type="date"
            value={newWeeklyValue.value}
            onChange={(e) => setNewWeeklyValue({ ...newWeeklyValue, value: e.target.value })}
            className="w-full"
          />
        )
      default:
        return null
    }
  }

  // CHANGE: Render input for quarterly and yearly data
  const renderQuarterlyValueInput = (parameter: Parameter) => {
    // This can reuse the logic for monthly or have specific adjustments if needed
    return renderValueInput(parameter) // Reusing monthly input for now
  }

  const renderYearlyValueInput = (parameter: Parameter) => {
    // This can reuse the logic for monthly or have specific adjustments if needed
    return renderValueInput(parameter) // Reusing monthly input for now
  }

  const handleUpdateExisting = async () => {
    if (!duplicateWarning.existingValue || !currentUser || !currentPractice) return

    const parameter = parameters.find((p) => p.id === newValue.parameterId)
    if (!parameter) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/parameter-values/${duplicateWarning.existingValue.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: parameter.type === "number" ? Number.parseFloat(newValue.value) : newValue.value,
            notes: newValue.notes || undefined,
          }),
        },
      )

      if (!response.ok)
        throw new Error(t("kpi.errors.failed_to_update", "Fehler beim Aktualisieren des Parameterwerts"))

      const data = await response.json()

      const updatedValues = parameterValues.map((value) => {
        if (value.id === duplicateWarning.existingValue!.id) {
          return {
            ...value,
            value: data.value.value,
            notes: data.value.notes,
            createdAt: data.value.updated_at,
          }
        }
        return value
      })

      setParameterValues(updatedValues)
      setNewValue({ parameterId: "", value: "", notes: "" })
      setDuplicateWarning({ show: false, existingValue: null })
      setIsAddValueDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error updating parameter value:", error)
      alert(
        t(
          "kpi.errors.failed_to_update",
          "Fehler beim Aktualisieren des Parameterwerts. Bitte versuchen Sie es erneut.",
        ),
      )
    }
  }

  const formatWeekRange = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }) // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 }) // Sunday
    return `${formatDate(start, "dd.MM")} - ${formatDate(end, "dd.MM.yyyy")}`
  }

  const getLastWeeks = (count = 12) => {
    const weeks = []
    for (let i = 0; i < count; i++) {
      weeks.push(subWeeks(new Date(), i))
    }
    return weeks
  }

  const handleEditValue = (value: ParameterValue) => {
    setEditingValue(value)
    setEditFormData({
      value: String(value.value),
      notes: value.notes || "",
      date: value.date, // Initialize with current date
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingValue || !currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${editingValue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: editFormData.value,
          notes: editFormData.notes,
          date: editFormData.date, // Include date in update
        }),
      })

      if (!response.ok) throw new Error("Fehler beim Aktualisieren des Parameterwerts")

      const data = await response.json()

      setParameterValues((prev) =>
        prev.map((v) =>
          v.id === editingValue.id
            ? {
                ...v,
                value: editFormData.value,
                notes: editFormData.notes,
                date: editFormData.date, // Update date in local state
              }
            : v,
        ),
      )

      setIsEditDialogOpen(false)
      setEditingValue(null)
    } catch (error) {
      console.error("[v0] Error updating parameter value:", error)
      alert(t("kpi.error_updating_value", "Fehler beim Aktualisieren des Parameterwerts"))
    }
  }

  const handleDeleteValue = async (valueId: string) => {
    if (!currentPractice?.id) return

    const confirmed = confirm(t("kpi.confirm_delete_value", "Möchten Sie diesen Parameterwert wirklich löschen?"))
    if (!confirmed) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/parameter-values/${valueId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Fehler beim Löschen des Parameterwerts")

      setParameterValues((prev) => prev.filter((v) => v.id !== valueId))
    } catch (error) {
      console.error("[v0] Error deleting parameter value:", error)
      alert(t("kpi.error_deleting_value", "Fehler beim Löschen des Parameterwerts"))
    }
  }

  const trackedParametersCount = new Set(currentMonthEntries.map((e) => e.parameterId)).size

  // Dummy state for currentView, assuming it's defined elsewhere
  const [currentView, setCurrentView] = useState<"edit" | "view">("view")

  return (
    <div className="space-y-6">
      {/* Removed the initial div wrapper and h3/p tags to integrate with Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{t("analytics.kpi_management.title", "Kennzahlen")}</h3>
              <p className="text-sm text-muted-foreground">
                {t(
                  "analytics.kpi_management.description",
                  "Hier können Sie Ihre Kennzahlen für die Auswertung eingeben",
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("kpi.monthly_entries", "Monatseinträge")}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMonthEntries.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {t("kpi.for", "Für")} {formatDate(currentMonth, "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("kpi.weekly_entries", "Wocheneinträge")}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      parameterValues.filter((v) => {
                        const valueDate = new Date(v.date)
                        const lastWeek = subWeeks(new Date(), 1)
                        const weekStart = startOfWeek(lastWeek, { weekStartsOn: 1 })
                        const weekEnd = endOfWeek(lastWeek, { weekStartsOn: 1 })
                        return valueDate >= weekStart && valueDate <= weekEnd
                      }).length
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">{t("kpi.last_week", "Letzte Woche")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t("kpi.parameters_tracked", "Verfolgte Parameter")}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trackedParametersCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {t("kpi.out_of", "Von")} {parameters.length} {t("kpi.total", "gesamt")}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t("kpi.parameters", "Praxisparameter")}</CardTitle>
                <CardDescription>
                  {t("kpi.parameters.description", "Parameter für Auswertung von Kennzahlen")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    onClick={() => setIsAddValueDialogOpen(true)}
                    variant="default"
                    style={{
                      backgroundColor: intervalBadgeColors.monthly,
                      color: "white",
                    }}
                    className="hover:opacity-90"
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("kpi.add_value", "Monatsdaten")}
                  </Button>
                  <Button
                    onClick={() => setIsAddWeeklyValueDialogOpen(true)}
                    variant="default"
                    style={{
                      backgroundColor: intervalBadgeColors.weekly,
                      color: "white",
                    }}
                    className="hover:opacity-90"
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("kpi.add_weekly_value", "Wochendaten")}
                  </Button>
                  <Button
                    onClick={() => setIsAddQuarterlyValueDialogOpen(true)}
                    variant="default"
                    style={{
                      backgroundColor: intervalBadgeColors.quarterly,
                      color: "white",
                    }}
                    className="hover:opacity-90"
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("kpi.add_quarterly_value", "Quartalsdaten")}
                  </Button>
                  <Button
                    onClick={() => setIsAddYearlyValueDialogOpen(true)}
                    variant="default"
                    style={{
                      backgroundColor: intervalBadgeColors.yearly,
                      color: "white",
                    }}
                    className="hover:opacity-90"
                    disabled={isSaving}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {t("kpi.add_yearly_value", "Jahresdaten")}
                  </Button>
                </div>

                <Tabs value={selectedInterval} onValueChange={setSelectedInterval} className="mb-6">
                  <TabsList className="w-full grid grid-cols-5 h-11">
                    <TabsTrigger value="all">{t("kpi.all_intervals", "Alle")}</TabsTrigger>
                    <TabsTrigger value="yearly">{t("kpi.yearly", "Jahr")}</TabsTrigger>
                    <TabsTrigger value="quarterly">{t("kpi.quarterly", "Quartal")}</TabsTrigger>
                    <TabsTrigger value="monthly">{t("kpi.monthly", "Monat")}</TabsTrigger>
                    <TabsTrigger value="weekly">{t("kpi.weekly", "Woche")}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("kpi.search_parameters", "Parameter suchen...")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t("kpi.choose_category", "Kategorie wählen")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                      {categories
                        .filter((cat) => cat && cat.trim() !== "")
                        .map((category, index) => (
                          <SelectItem key={`${category}-${index}`} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Table */}
                {currentView === "view" && (
                  <CardContent className="pt-6">
                    <div className="rounded-md border">
                      <div className="max-h-[600px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("parameterName")}
                              >
                                <div className="flex items-center">
                                  {t("kpi.parameter_name", "Parameter")}
                                  <SortIcon columnKey="parameterName" />
                                </div>
                              </TableHead>
                              <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("value")}
                              >
                                <div className="flex items-center">
                                  {t("kpi.value", "Wert")}
                                  <SortIcon columnKey="value" />
                                </div>
                              </TableHead>
                              <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("date")}
                              >
                                <div className="flex items-center">
                                  {selectedInterval === "all"
                                    ? t("kpi.interval", "Intervall")
                                    : selectedInterval === "weekly"
                                      ? t("kpi.week", "Woche")
                                      : selectedInterval === "quarterly"
                                        ? t("kpi.quarter", "Quartal")
                                        : selectedInterval === "yearly"
                                          ? t("kpi.year", "Jahr")
                                          : t("kpi.month", "Monat")}
                                  <SortIcon columnKey="date" />
                                </div>
                              </TableHead>
                              <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("userName")}
                              >
                                <div className="flex items-center">
                                  {t("kpi.entered_by", "Erfasst von")}
                                  <SortIcon columnKey="userName" />
                                </div>
                              </TableHead>
                              <TableHead>{t("kpi.notes", "Notizen")}</TableHead>
                              <TableHead
                                className="cursor-pointer select-none hover:bg-muted/50"
                                onClick={() => handleSort("createdAt")}
                              >
                                <div className="flex items-center">
                                  {t("kpi.created", "Erstellt")}
                                  <SortIcon columnKey="createdAt" />
                                </div>
                              </TableHead>
                              <TableHead className="text-right">{t("kpi.actions", "Aktionen")}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isLoading ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">
                                  {t("kpi.loading_parameters", "Lade Parameterwerte...")}
                                </TableCell>
                              </TableRow>
                            ) : (
                              parameterValues
                                .filter((value) => {
                                  const parameter = parameters.find((p) => p.id === value.parameterId)
                                  if (!parameter) return false

                                  const valueDate = new Date(value.date)

                                  const isInSelectedPeriod = true

                                  const matchesSearch =
                                    parameter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    value.userName.toLowerCase().includes(searchTerm.toLowerCase())
                                  const matchesCategory =
                                    selectedCategory === "all" || parameter.category === selectedCategory
                                  const matchesInterval =
                                    selectedInterval === "all" ||
                                    !parameter.interval ||
                                    parameter.interval === selectedInterval

                                  return isInSelectedPeriod && matchesSearch && matchesCategory && matchesInterval
                                })
                                .sort((a, b) => {
                                  if (!sortConfig.direction) {
                                    // No sorting, use default created date desc
                                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                  }

                                  const direction = sortConfig.direction === "asc" ? 1 : -1

                                  switch (sortConfig.key) {
                                    case "parameterName":
                                      return direction * a.parameterName.localeCompare(b.parameterName)
                                    case "value":
                                      const aVal =
                                        typeof a.value === "number" ? a.value : Number.parseFloat(String(a.value)) || 0
                                      const bVal =
                                        typeof b.value === "number" ? b.value : Number.parseFloat(String(b.value)) || 0
                                      return direction * (aVal - bVal)
                                    case "date":
                                      return direction * (new Date(a.date).getTime() - new Date(b.date).getTime())
                                    case "userName":
                                      return direction * a.userName.localeCompare(b.userName)
                                    case "createdAt":
                                      return (
                                        direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                      )
                                    default:
                                      return 0
                                  }
                                })
                                .map((value) => {
                                  const parameter = parameters.find((p) => p.id === value.parameterId)
                                  return (
                                    <TableRow key={value.id}>
                                      <TableCell>
                                        <div>
                                          <div className="font-medium">{value.parameterName}</div>
                                          {parameter && (
                                            <Badge variant="outline" className="text-xs">
                                              {parameter.category}
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">
                                            {typeof value.value === "boolean"
                                              ? value.value
                                                ? "Yes"
                                                : "No"
                                              : value.value}
                                          </span>
                                          {parameter?.unit && (
                                            <span className="text-sm text-muted-foreground">{parameter.unit}</span>
                                          )}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {selectedInterval === "all" ? (
                                          <div className="flex flex-col gap-1">
                                            <span className="text-sm">
                                              {parameter?.interval === "weekly"
                                                ? `KW ${getWeek(new Date(value.date))} - ${formatDate(new Date(value.date), "dd.MM.yyyy")}`
                                                : parameter?.interval === "quarterly"
                                                  ? `Q${getQuarter(new Date(value.date))} ${formatDate(new Date(value.date), "yyyy")}`
                                                  : parameter?.interval === "yearly"
                                                    ? formatDate(new Date(value.date), "yyyy")
                                                    : formatDate(new Date(value.date), "MMMM yyyy")}
                                            </span>
                                            {parameter?.interval === "weekly" && (
                                              <Badge
                                                variant="default"
                                                className="text-xs w-fit"
                                                style={{
                                                  backgroundColor: intervalBadgeColors.weekly,
                                                  color: "#ffffff",
                                                }}
                                              >
                                                {t("kpi.interval_weekly", "Wöchentlich")}
                                              </Badge>
                                            )}
                                            {parameter?.interval === "monthly" && (
                                              <Badge
                                                variant="default"
                                                className="text-xs w-fit"
                                                style={{
                                                  backgroundColor: intervalBadgeColors.monthly,
                                                  color: "#ffffff",
                                                }}
                                              >
                                                {t("kpi.interval_monthly", "Monatlich")}
                                              </Badge>
                                            )}
                                            {parameter?.interval === "quarterly" && (
                                              <Badge
                                                variant="default"
                                                className="text-xs w-fit"
                                                style={{
                                                  backgroundColor: intervalBadgeColors.quarterly,
                                                  color: "#ffffff",
                                                }}
                                              >
                                                {t("kpi.interval_quarterly", "Vierteljährlich")}
                                              </Badge>
                                            )}
                                            {parameter?.interval === "yearly" && (
                                              <Badge
                                                variant="default"
                                                className="text-xs w-fit"
                                                style={{
                                                  backgroundColor: intervalBadgeColors.yearly,
                                                  color: "#ffffff",
                                                }}
                                              >
                                                {t("kpi.interval_yearly", "Jährlich")}
                                              </Badge>
                                            )}
                                            {!parameter?.interval && (
                                              <Badge
                                                variant="default"
                                                className="text-xs w-fit"
                                                style={{
                                                  backgroundColor: intervalBadgeColors.monthly,
                                                  color: "#ffffff",
                                                }}
                                              >
                                                {t("kpi.interval_monthly", "Monatlich")}
                                              </Badge>
                                            )}
                                          </div>
                                        ) : selectedInterval === "weekly" ? (
                                          `KW ${getWeek(new Date(value.date))} - ${formatDate(new Date(value.date), "dd.MM.yyyy")}`
                                        ) : selectedInterval === "quarterly" ? (
                                          `Q${getQuarter(new Date(value.date))} ${formatDate(new Date(value.date), "yyyy")}`
                                        ) : selectedInterval === "yearly" ? (
                                          formatDate(new Date(value.date), "yyyy")
                                        ) : (
                                          formatDate(new Date(value.date), "MMMM yyyy")
                                        )}
                                      </TableCell>
                                      <TableCell>{value.userName}</TableCell>
                                      <TableCell>
                                        {value.notes ? (
                                          <span className="text-sm">{value.notes}</span>
                                        ) : (
                                          <span className="text-muted-foreground">-</span>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(new Date(value.createdAt), "dd.MM.yy")}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditValue(value)}
                                            className="h-8 w-8 p-0"
                                            title={t("kpi.edit", "Bearbeiten")}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteValue(value.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                            title={t("kpi.delete", "Löschen")}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )
                                })
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </CardContent>
                )}

                {!isLoading && currentMonthEntries.length === 0 && (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{t("kpi.no_values", "Keine Parameterwerte")}</h3>
                    <p className="text-muted-foreground mb-4">
                      {t(
                        "kpi.start_entering",
                        "Beginnen Sie mit der Eingabe von Parameterwerten, um Ihre Praxiskennzahlen zu verfolgen",
                      )}
                    </p>
                    <Button onClick={() => setIsAddValueDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t("kpi.add_first_value", "Ersten Wert hinzufügen")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Monthly data entry dialog - existing */}
      <Dialog open={isAddValueDialogOpen} onOpenChange={setIsAddValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("kpi.add_value", "KPI-Wert hinzufügen")}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 flex-wrap">
              <span>{t("kpi.enter_value_for", "Wert eingeben für")}</span>
              <Popover open={isDialogMonthPickerOpen} onOpenChange={setIsDialogMonthPickerOpen}>
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
                        const isSelected = currentMonth.getMonth() === i
                        return (
                          <Button
                            key={i}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setCurrentMonth(month)
                              setIsDialogMonthPickerOpen(false)
                            }}
                          >
                            {formatDate(month, "MMM")}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </DialogDescription>
          </DialogHeader>

          {duplicateWarning.show && duplicateWarning.existingValue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("kpi.duplicate_entry_warning", "Ein Wert existiert bereits für diesen Parameter in")}{" "}
                {formatDate(currentMonth, "MMMM yyyy")}:
                <div className="mt-2 p-2 bg-background rounded border">
                  <div className="font-medium">
                    {t("kpi.current_value", "Aktueller Wert:")} {String(duplicateWarning.existingValue.value)}
                  </div>
                  {duplicateWarning.existingValue.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("kpi.notes", "Notizen:")} {duplicateWarning.existingValue.notes}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-category">{t("kpi.category", "Category")}</Label>
              <Select
                value={dialogCategory} // Use setDialogCategory
                onValueChange={(value) => {
                  setDialogCategory(value) // Use setDialogCategory
                  if (newValue.parameterId) {
                    const selectedParam = parameters.find((p) => p.id === newValue.parameterId)
                    if (selectedParam && value !== "all" && selectedParam.category !== value) {
                      setNewValue({ ...newValue, parameterId: "" })
                    }
                  }
                }}
              >
                <SelectTrigger id="dialog-category">
                  <SelectValue placeholder={t("kpi.choose_category", "Kategorie wählen")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                  {categories
                    .filter((cat) => cat && cat.trim() !== "")
                    .map((category, index) => (
                      <SelectItem key={`dialog-${category}-${index}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parameter">{t("kpi.parameter", "Parameter")}</Label>
              <Select
                value={newValue.parameterId}
                onValueChange={(value) => {
                  setNewValue({ ...newValue, parameterId: value })
                  setDuplicateWarning({ show: false, existingValue: null })
                }}
              >
                <SelectTrigger id="parameter">
                  <SelectValue placeholder={t("kpi.select_parameter", "Parameter auswählen")} />
                </SelectTrigger>
                <SelectContent>
                  {dialogFilteredParameters.map((param) => (
                    <SelectItem key={param.id} value={param.id}>
                      <div className="flex items-center gap-2">
                        <span>{param.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {param.category}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newValue.parameterId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="value">{t("kpi.value", "Wert")}</Label>
                  {renderValueInput(parameters.find((p) => p.id === newValue.parameterId)!)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("kpi.notes_optional", "Notizen (Optional)")}</Label>
                  <Textarea
                    id="notes"
                    value={newValue.notes}
                    onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}
                    placeholder={t("kpi.add_notes", "Fügen Sie hier weitere Notizen hinzu...")}
                    rows={3}
                  />
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
                <Button variant="secondary" onClick={handleUpdateExisting}>
                  {t("kpi.update_existing", "Bestehenden Wert aktualisieren")}
                </Button>
                <Button onClick={() => handleAddValue(true)}>
                  {t("kpi.add_new_entry", "Neuen Eintrag hinzufügen")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAddValueDialogOpen(false)}>
                  {t("kpi.cancel", "Abbrechen")}
                </Button>
                <Button
                  onClick={() => handleAddValue(false)}
                  disabled={!newValue.parameterId || !newValue.value || isSaving}
                >
                  {t("kpi.add_value", "Wert hinzufügen")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddWeeklyValueDialogOpen} onOpenChange={setIsAddWeeklyValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("kpi.add_weekly_value", "Wochendaten")}</DialogTitle>
            <DialogDescription>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  {t("kpi.select_week_and_enter_values", "Wählen Sie eine Kalenderwoche und geben Sie die Werte ein")}
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">{t("kpi.calendar_week", "Kalenderwoche")}</Label>
                  <Popover open={isDialogWeekPickerOpen} onOpenChange={setIsDialogWeekPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start font-normal bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="font-semibold">KW {getWeek(selectedWeek)}</span>
                        <span className="mx-2">•</span>
                        <span>{formatWeekRange(selectedWeek)}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="start">
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-center mb-2">
                          {t("kpi.select_week_by_date", "Wählen Sie ein Datum, um die Woche auszuwählen")}
                        </div>
                        <CalendarComponent
                          mode="single"
                          selected={selectedWeek}
                          onSelect={(date) => {
                            if (date) {
                              // Calculate the start of the week (Monday) for the selected date
                              const weekStart = startOfWeek(date, { weekStartsOn: 1 })
                              setSelectedWeek(weekStart)
                              setIsDialogWeekPickerOpen(false)
                            }
                          }}
                          // REMOVED: locale={de} because 'de' is not defined
                          className="rounded-md border"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>

          {duplicateWarning.show && duplicateWarning.existingValue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("kpi.duplicate_entry_warning", "Ein Wert existiert bereits für diesen Parameter in")}{" "}
                {formatWeekRange(selectedWeek)}:
                <div className="mt-2 p-2 bg-background rounded border">
                  <div className="font-medium">
                    {t("kpi.current_value", "Aktueller Wert:")} {String(duplicateWarning.existingValue.value)}
                  </div>
                  {duplicateWarning.existingValue.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("kpi.notes", "Notizen:")} {duplicateWarning.existingValue.notes}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weekly-dialog-category">{t("kpi.category", "Category")}</Label>
              <Select
                value={weeklyDialogCategory}
                onValueChange={(value) => {
                  setWeeklyDialogCategory(value) // Use setWeeklyDialogCategory
                  if (newWeeklyValue.parameterId) {
                    const selectedParam = parameters.find((p) => p.id === newWeeklyValue.parameterId)
                    if (selectedParam && value !== "all" && selectedParam.category !== value) {
                      setNewWeeklyValue({ ...newWeeklyValue, parameterId: "" })
                    }
                  }
                }}
              >
                <SelectTrigger id="weekly-dialog-category">
                  <SelectValue placeholder={t("kpi.choose_category", "Kategorie wählen")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                  {categories
                    .filter((cat) => cat && cat.trim() !== "")
                    .map((category, index) => (
                      <SelectItem key={`weekly-${category}-${index}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weekly-parameter">{t("kpi.parameter", "Parameter")}</Label>
              <Select
                value={newWeeklyValue.parameterId}
                onValueChange={(value) => {
                  setNewWeeklyValue({ ...newWeeklyValue, parameterId: value })
                  setDuplicateWarning({ show: false, existingValue: null })
                }}
              >
                <SelectTrigger id="weekly-parameter">
                  <SelectValue placeholder={t("kpi.select_weekly_parameter", "Wochenparameter auswählen")} />
                </SelectTrigger>
                <SelectContent>
                  {weeklyDialogFilteredParameters.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("kpi.no_weekly_parameters", "Keine Wochenparameter verfügbar")}
                    </div>
                  ) : (
                    weeklyDialogFilteredParameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        <div className="flex items-center gap-2">
                          <span>{param.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {param.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {newWeeklyValue.parameterId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="weekly-value">{t("kpi.value", "Wert")}</Label>
                  {renderWeeklyValueInput(parameters.find((p) => p.id === newWeeklyValue.parameterId)!)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weekly-notes">{t("kpi.notes_optional", "Notizen (Optional)")}</Label>
                  <Textarea
                    id="weekly-notes"
                    value={newWeeklyValue.notes}
                    onChange={(e) => setNewWeeklyValue({ ...newWeeklyValue, notes: e.target.value })}
                    placeholder={t("kpi.add_notes", "Fügen Sie hier weitere Notizen hinzu...")}
                    rows={3}
                  />
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
                <Button variant="secondary" onClick={handleUpdateExistingWeekly}>
                  {t("kpi.update_existing", "Bestehenden Wert aktualisieren")}
                </Button>
                <Button onClick={() => handleAddWeeklyValue(true)}>
                  {t("kpi.add_new_entry", "Neuen Eintrag hinzufügen")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAddWeeklyValueDialogOpen(false)}>
                  {t("kpi.cancel", "Abbrechen")}
                </Button>
                <Button
                  onClick={() => handleAddWeeklyValue(false)}
                  disabled={!newWeeklyValue.parameterId || !newWeeklyValue.value || isSaving}
                >
                  {t("kpi.add_weekly_value", "Wochendaten")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHANGE: Add quarterly dialog with quarter selection UI */}
      <Dialog open={isAddQuarterlyValueDialogOpen} onOpenChange={setIsAddQuarterlyValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("kpi.add_quarterly_value", "Quartalsdaten")}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 flex-wrap">
              <span>{t("kpi.enter_quarterly_value_for", "Geben Sie einen Quartalswert ein für")}</span>
              <Popover open={isDialogQuarterPickerOpen} onOpenChange={setIsDialogQuarterPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-auto py-1 px-2 font-semibold bg-transparent">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {formatDate(selectedQuarter, "QQQ yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    {/* Year navigation */}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuarter(subYears(selectedQuarter, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold text-sm">{formatDate(selectedQuarter, "yyyy")}</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedQuarter(addYears(selectedQuarter, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Quarter selection buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].map((quarter) => {
                        const quarterDate = setQuarter(startOfYear(selectedQuarter), quarter)
                        const isSelected = getQuarter(selectedQuarter) === quarter
                        return (
                          <Button
                            key={quarter}
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedQuarter(quarterDate)
                              setIsDialogQuarterPickerOpen(false)
                            }}
                          >
                            Q{quarter}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </DialogDescription>
          </DialogHeader>

          {duplicateWarning.show && duplicateWarning.existingValue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("kpi.duplicate_entry_warning", "Ein Wert existiert bereits für diesen Parameter in")}{" "}
                {formatDate(selectedQuarter, "QQQ yyyy")}:
                <div className="mt-2 p-2 bg-background rounded border">
                  <div className="font-medium">
                    {t("kpi.current_value", "Aktueller Wert:")} {String(duplicateWarning.existingValue.value)}
                  </div>
                  {duplicateWarning.existingValue.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("kpi.notes", "Notizen:")} {duplicateWarning.existingValue.notes}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quarterly-dialog-category">{t("kpi.category", "Category")}</Label>
              <Select
                value={dialogCategory} // Reusing dialogCategory for simplicity
                onValueChange={(value) => {
                  setDialogCategory(value)
                  if (newValue.parameterId) {
                    const selectedParam = parameters.find((p) => p.id === newValue.parameterId)
                    if (selectedParam && value !== "all" && selectedParam.category !== value) {
                      setNewValue({ ...newValue, parameterId: "" })
                    }
                  }
                }}
              >
                <SelectTrigger id="quarterly-dialog-category">
                  <SelectValue placeholder={t("kpi.choose_category", "Kategorie wählen")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                  {categories
                    .filter((cat) => cat && cat.trim() !== "")
                    .map((category, index) => (
                      <SelectItem key={`quarterly-dialog-${category}-${index}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quarterly-parameter">{t("kpi.parameter", "Parameter")}</Label>
              <Select
                value={newValue.parameterId} // Reusing newValue state
                onValueChange={(value) => {
                  setNewValue({ ...newValue, parameterId: value })
                  setDuplicateWarning({ show: false, existingValue: null })
                }}
              >
                <SelectTrigger id="quarterly-parameter">
                  <SelectValue placeholder={t("kpi.select_quarterly_parameter", "Quartalsparameter auswählen")} />
                </SelectTrigger>
                <SelectContent>
                  {quarterlyDialogFilteredParameters.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("kpi.no_quarterly_parameters", "Keine Quartalsparameter verfügbar")}
                    </div>
                  ) : (
                    quarterlyDialogFilteredParameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        <div className="flex items-center gap-2">
                          <span>{param.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {param.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {newValue.parameterId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quarterly-value">{t("kpi.value", "Wert")}</Label>
                  {renderQuarterlyValueInput(parameters.find((p) => p.id === newValue.parameterId)!)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quarterly-notes">{t("kpi.notes_optional", "Notizen (Optional)")}</Label>
                  <Textarea
                    id="quarterly-notes"
                    value={newValue.notes} // Reusing newValue state
                    onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}
                    placeholder={t("kpi.add_notes", "Fügen Sie hier weitere Notizen hinzu...")}
                    rows={3}
                  />
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
                <Button variant="secondary" onClick={() => handleUpdateExisting()}>
                  {t("kpi.update_existing", "Bestehenden Wert aktualisieren")}
                </Button>
                <Button onClick={() => handleAddQuarterlyValue(true)}>
                  {t("kpi.add_new_entry", "Neuen Eintrag hinzufügen")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAddQuarterlyValueDialogOpen(false)}>
                  {t("kpi.cancel", "Abbrechen")}
                </Button>
                <Button
                  onClick={() => handleAddQuarterlyValue(false)}
                  disabled={!newValue.parameterId || !newValue.value || isSaving}
                >
                  {t("kpi.add_quarterly_value", "Quartalsdaten")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CHANGE: Add yearly dialog */}
      <Dialog open={isAddYearlyValueDialogOpen} onOpenChange={setIsAddYearlyValueDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("kpi.add_yearly_value", "Jahresdaten")}</DialogTitle>
            <DialogDescription className="flex items-center gap-1 flex-wrap">
              <span>{t("kpi.enter_yearly_value_for", "Geben Sie einen Jahreswert ein für")}</span>
              <Popover open={isDialogYearPickerOpen} onOpenChange={setIsDialogYearPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-auto py-1 px-2 font-semibold bg-transparent">
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {formatDate(selectedYear, "yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="start">
                  <div className="space-y-4">
                    {/* Year navigation */}
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedYear(subYears(selectedYear, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="font-semibold text-sm">{formatDate(selectedYear, "yyyy")}</div>
                      <Button variant="outline" size="sm" onClick={() => setSelectedYear(addYears(selectedYear, 1))}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-transparent"
                      onClick={() => {
                        setSelectedYear(startOfYear(new Date()))
                        setIsDialogYearPickerOpen(false)
                      }}
                    >
                      {t("kpi.current_year", "Aktuelles Jahr")}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </DialogDescription>
          </DialogHeader>

          {duplicateWarning.show && duplicateWarning.existingValue && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t("kpi.duplicate_entry_warning", "Ein Wert existiert bereits für diesen Parameter in")}{" "}
                {formatDate(selectedYear, "yyyy")}:
                <div className="mt-2 p-2 bg-background rounded border">
                  <div className="font-medium">
                    {t("kpi.current_value", "Aktueller Wert:")} {String(duplicateWarning.existingValue.value)}
                  </div>
                  {duplicateWarning.existingValue.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("kpi.notes", "Notizen:")} {duplicateWarning.existingValue.notes}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="yearly-dialog-category">{t("kpi.category", "Category")}</Label>
              <Select
                value={dialogCategory} // Reusing dialogCategory for simplicity
                onValueChange={(value) => {
                  setDialogCategory(value)
                  if (newValue.parameterId) {
                    const selectedParam = parameters.find((p) => p.id === newValue.parameterId)
                    if (selectedParam && value !== "all" && selectedParam.category !== value) {
                      setNewValue({ ...newValue, parameterId: "" })
                    }
                  }
                }}
              >
                <SelectTrigger id="yearly-dialog-category">
                  <SelectValue placeholder={t("kpi.choose_category", "Kategorie wählen")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                  {categories
                    .filter((cat) => cat && cat.trim() !== "")
                    .map((category, index) => (
                      <SelectItem key={`yearly-dialog-${category}-${index}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearly-parameter">{t("kpi.parameter", "Parameter")}</Label>
              <Select
                value={newValue.parameterId} // Reusing newValue state
                onValueChange={(value) => {
                  setNewValue({ ...newValue, parameterId: value })
                  setDuplicateWarning({ show: false, existingValue: null })
                }}
              >
                <SelectTrigger id="yearly-parameter">
                  <SelectValue placeholder={t("kpi.select_yearly_parameter", "Jahrespraxisparameter auswählen")} />
                </SelectTrigger>
                <SelectContent>
                  {yearlyDialogFilteredParameters.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("kpi.no_yearly_parameters", "Keine Jahrespraxisparameter verfügbar")}
                    </div>
                  ) : (
                    yearlyDialogFilteredParameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        <div className="flex items-center gap-2">
                          <span>{param.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {param.category}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {newValue.parameterId && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="yearly-value">{t("kpi.value", "Wert")}</Label>
                  {renderYearlyValueInput(parameters.find((p) => p.id === newValue.parameterId)!)}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="yearly-notes">{t("kpi.notes_optional", "Notizen (Optional)")}</Label>
                  <Textarea
                    id="yearly-notes"
                    value={newValue.notes} // Reusing newValue state
                    onChange={(e) => setNewValue({ ...newValue, notes: e.target.value })}
                    placeholder={t("kpi.add_notes", "Fügen Sie hier weitere Notizen hinzu...")}
                    rows={3}
                  />
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
                <Button variant="secondary" onClick={() => handleUpdateExisting()}>
                  {t("kpi.update_existing", "Bestehenden Wert aktualisieren")}
                </Button>
                <Button onClick={() => handleAddYearlyValue(true)}>
                  {t("kpi.add_new_entry", "Neuen Eintrag hinzufügen")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsAddYearlyValueDialogOpen(false)}>
                  {t("kpi.cancel", "Abbrechen")}
                </Button>
                <Button
                  onClick={() => handleAddYearlyValue(false)}
                  disabled={!newValue.parameterId || !newValue.value || isSaving}
                >
                  {t("kpi.add_yearly_value", "Jahresdaten")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("kpi.edit_value", "Wert bearbeiten")}</DialogTitle>
            <DialogDescription>
              {t("kpi.edit_value_description", "Ändern Sie den Wert und die Notizen für diesen Parameter.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingValue && (
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{editingValue.parameterName}</div>
                {(() => {
                  const param = parameters.find((p) => p.id === editingValue.parameterId)
                  if (param?.interval === "weekly") {
                    const currentDate = new Date(editFormData.date)
                    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
                    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
                    const weekNumber = getWeek(currentDate)

                    return (
                      <div className="mt-2">
                        <Popover open={isEditDialogDatePickerOpen} onOpenChange={setIsEditDialogDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              KW {weekNumber} • {formatDate(weekStart, "dd.MM.yyyy")} -{" "}
                              {formatDate(weekEnd, "dd.MM.yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-3 text-sm text-muted-foreground border-b">
                              {t("kpi.select_date_for_week", "Wählen Sie ein Datum, um die Woche auszuwählen")}
                            </div>
                            <CalendarComponent
                              mode="single"
                              selected={currentDate}
                              onSelect={(date) => {
                                if (date) {
                                  // Calculate the start of the week for the selected date
                                  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
                                  setEditFormData({ ...editFormData, date: weekStart.toISOString() })
                                  setIsEditDialogDatePickerOpen(false)
                                }
                              }}
                              // REMOVED: locale={de} because 'de' is not defined
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )
                  } else if (param?.interval === "monthly") {
                    const currentDate = new Date(editFormData.date)
                    const currentMonth = currentDate.getMonth()
                    const currentYear = currentDate.getFullYear()
                    return (
                      <div className="mt-2">
                        <Popover open={isEditDialogMonthPickerOpen} onOpenChange={setIsEditDialogMonthPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formatDate(currentDate, "MMMM yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4" align="start">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newDate = new Date(editFormData.date)
                                    newDate.setFullYear(currentYear - 1)
                                    setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                  }}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium">{currentYear}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newDate = new Date(editFormData.date)
                                    newDate.setFullYear(currentYear + 1)
                                    setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {Array.from({ length: 12 }, (_, i) => {
                                  const monthDate = new Date(currentYear, i, 1)
                                  const isSelected = i === currentMonth
                                  return (
                                    <Button
                                      key={i}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        const newDate = new Date(currentYear, i, 1)
                                        setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                        setIsEditDialogMonthPickerOpen(false)
                                      }}
                                    >
                                      {formatDate(monthDate, "MMM")}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )
                  } else if (param?.interval === "quarterly") {
                    const currentDate = new Date(editFormData.date)
                    const currentYear = currentDate.getFullYear()
                    const currentQuarter = getQuarter(currentDate)
                    return (
                      <div className="mt-2">
                        <Popover open={isEditDialogQuarterPickerOpen} onOpenChange={setIsEditDialogQuarterPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full justify-start text-left font-normal bg-transparent"
                            >
                              <CalendarIcon className="mr-4 w-4" />Q{currentQuarter} {currentYear}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-4" align="start">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newDate = new Date(editFormData.date)
                                    newDate.setFullYear(currentYear - 1)
                                    setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                  }}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium">{currentYear}</div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newDate = new Date(editFormData.date)
                                    newDate.setFullYear(currentYear + 1)
                                    setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {[1, 2, 3, 4].map((quarter) => {
                                  const isSelected = quarter === currentQuarter
                                  return (
                                    <Button
                                      key={quarter}
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => {
                                        const monthIndex = (quarter - 1) * 3
                                        const newDate = new Date(currentYear, monthIndex, 1)
                                        setEditFormData({ ...editFormData, date: newDate.toISOString() })
                                        setIsEditDialogQuarterPickerOpen(false)
                                      }}
                                    >
                                      Q{quarter}
                                    </Button>
                                  )
                                })}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )
                  } else if (param?.interval === "yearly") {
                    const currentYear = new Date(editFormData.date).getFullYear()
                    return (
                      <div className="mt-2 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(editFormData.date)
                            newDate.setFullYear(currentYear - 1)
                            setEditFormData({ ...editFormData, date: newDate.toISOString() })
                          }}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium">{currentYear}</div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date(editFormData.date)
                            newDate.setFullYear(currentYear + 1)
                            setEditFormData({ ...editFormData, date: newDate.toISOString() })
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newDate = new Date()
                            newDate.setMonth(0, 1) // January 1st
                            setEditFormData({ ...editFormData, date: newDate.toISOString() })
                          }}
                        >
                          {t("kpi.current_year", "Aktuelles Jahr")}
                        </Button>
                      </div>
                    )
                  } else {
                    return (
                      <div className="text-sm text-muted-foreground">
                        {formatDate(new Date(editFormData.date), "MMMM yyyy")}
                      </div>
                    )
                  }
                })()}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-value">{t("kpi.value", "Wert")}</Label>
              <Input
                id="edit-value"
                value={editFormData.value}
                onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })}
                placeholder={t("kpi.enter_value", "Wert eingeben")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">{t("kpi.notes", "Notizen")}</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder={t("kpi.optional_notes", "Optionale Notizen")}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t("kpi.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {t("kpi.save", "Speichern")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ParameterDataEntry
