"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Calendar, Filter, Plus, Search, TrendingUp } from "lucide-react"
import { useDataEntry } from "./hooks/use-data-entry"
import { DataTable } from "./data-table"
import { EntryDialog } from "./entry-dialog"
import { EditValueDialog } from "./edit-value-dialog"
import { formatDate, subWeeks, startOfWeek, endOfWeek } from "./date-utils"
import type { ParameterValue } from "./types"

interface ParameterDataEntryProps {
  currentPractice: { id: string } | null
  currentUser: { id: string; name: string } | null
  t: (key: string, fallback: string) => string
}

const intervalBadgeColors: Record<string, string> = {
  weekly: "#2563eb",
  monthly: "#16a34a",
  quarterly: "#d97706",
  yearly: "#9333ea",
}

export function ParameterDataEntry({ currentPractice, currentUser, t }: ParameterDataEntryProps) {
  const data = useDataEntry({ currentPractice, currentUser, t })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedInterval, setSelectedInterval] = useState("all")
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" | null }>({ key: "", direction: null })

  // Dialog open states
  const [isMonthlyDialogOpen, setIsMonthlyDialogOpen] = useState(false)
  const [isWeeklyDialogOpen, setIsWeeklyDialogOpen] = useState(false)
  const [isQuarterlyDialogOpen, setIsQuarterlyDialogOpen] = useState(false)
  const [isYearlyDialogOpen, setIsYearlyDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Edit state
  const [editingValue, setEditingValue] = useState<ParameterValue | null>(null)
  const [editFormData, setEditFormData] = useState({ value: "", notes: "", date: "" })

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key ? (prev.direction === "asc" ? "desc" : prev.direction === "desc" ? null : "asc") : "asc",
    }))
  }

  const handleEditValue = (value: ParameterValue) => {
    setEditingValue(value)
    setEditFormData({ value: String(value.value), notes: value.notes || "", date: value.date })
    setIsEditDialogOpen(true)
  }

  const currentMonthEntries = data.parameterValues.filter((v) => {
    const d = new Date(v.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const lastWeekEntries = data.parameterValues.filter((v) => {
    const d = new Date(v.date)
    const lw = subWeeks(new Date(), 1)
    return d >= startOfWeek(lw, { weekStartsOn: 1 }) && d <= endOfWeek(lw, { weekStartsOn: 1 })
  })

  const trackedCount = new Set(currentMonthEntries.map((e) => e.parameterId)).size

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">{t("analytics.kpi_management.title", "Kennzahlen")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("analytics.kpi_management.description", "Hier konnen Sie Ihre Kennzahlen fur die Auswertung eingeben")}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("kpi.monthly_entries", "Monatseintraege")}</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentMonthEntries.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {t("kpi.for", "Fuer")} {formatDate(data.currentMonth, "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("kpi.weekly_entries", "Wocheneintraege")}</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{lastWeekEntries.length}</div>
                  <p className="text-xs text-muted-foreground">{t("kpi.last_week", "Letzte Woche")}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{t("kpi.parameters_tracked", "Verfolgte Parameter")}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{trackedCount}</div>
                  <p className="text-xs text-muted-foreground">{t("kpi.out_of", "Von")} {data.parameters.length} {t("kpi.total", "gesamt")}</p>
                </CardContent>
              </Card>
            </div>

            {/* Parameters Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t("kpi.parameters", "Praxisparameter")}</CardTitle>
                <CardDescription>{t("kpi.parameters.description", "Parameter fuer Auswertung von Kennzahlen")}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Add Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  {(["weekly", "monthly", "quarterly", "yearly"] as const).map((interval) => (
                    <Button key={interval}
                      onClick={() => {
                        if (interval === "weekly") setIsWeeklyDialogOpen(true)
                        else if (interval === "monthly") setIsMonthlyDialogOpen(true)
                        else if (interval === "quarterly") setIsQuarterlyDialogOpen(true)
                        else setIsYearlyDialogOpen(true)
                      }}
                      style={{ backgroundColor: intervalBadgeColors[interval], color: "white" }}
                      className="hover:opacity-90" disabled={data.isSaving}>
                      <Plus className="h-4 w-4 mr-2" />
                      {interval === "weekly" ? t("kpi.add_weekly_value", "Wochendaten") :
                       interval === "monthly" ? t("kpi.add_value", "Monatsdaten") :
                       interval === "quarterly" ? t("kpi.add_quarterly_value", "Quartalsdaten") :
                       t("kpi.add_yearly_value", "Jahresdaten")}
                    </Button>
                  ))}
                </div>

                {/* Interval Filter Tabs */}
                <Tabs value={selectedInterval} onValueChange={setSelectedInterval} className="mb-6">
                  <TabsList className="w-full grid grid-cols-5 h-11">
                    <TabsTrigger value="all">{t("kpi.all_intervals", "Alle")}</TabsTrigger>
                    <TabsTrigger value="yearly">{t("kpi.yearly", "Jahr")}</TabsTrigger>
                    <TabsTrigger value="quarterly">{t("kpi.quarterly", "Quartal")}</TabsTrigger>
                    <TabsTrigger value="monthly">{t("kpi.monthly", "Monat")}</TabsTrigger>
                    <TabsTrigger value="weekly">{t("kpi.weekly", "Woche")}</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search + Category Filter */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("kpi.search_parameters", "Parameter suchen...")}
                      value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder={t("kpi.choose_category", "Kategorie wahlen")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("kpi.all_categories", "Alle Kategorien")}</SelectItem>
                      {data.categories.filter((c) => c?.trim()).map((c, i) => (
                        <SelectItem key={`${c}-${i}`} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Table */}
                <DataTable
                  parameterValues={data.parameterValues}
                  parameters={data.parameters}
                  isLoading={data.isLoading}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  selectedInterval={selectedInterval}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onEditValue={handleEditValue}
                  onDeleteValue={data.handleDeleteValue}
                  t={t}
                />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Entry Dialogs */}
      <EntryDialog open={isMonthlyDialogOpen} onOpenChange={setIsMonthlyDialogOpen}
        title={t("kpi.add_value", "Monatsdaten")} interval="monthly"
        parameters={data.parameters} categories={data.categories}
        isSaving={data.isSaving} duplicateWarning={data.duplicateWarning}
        setDuplicateWarning={data.setDuplicateWarning}
        onAddValue={data.handleAddValue} onUpdateExisting={data.handleUpdateExisting}
        renderValueInput={data.renderValueInput} t={t}
        currentMonth={data.currentMonth} setCurrentMonth={data.setCurrentMonth} />

      <EntryDialog open={isWeeklyDialogOpen} onOpenChange={setIsWeeklyDialogOpen}
        title={t("kpi.add_weekly_value", "Wochendaten")} interval="weekly"
        parameters={data.parameters} categories={data.categories}
        isSaving={data.isSaving} duplicateWarning={data.duplicateWarning}
        setDuplicateWarning={data.setDuplicateWarning}
        onAddValue={data.handleAddWeeklyValue} onUpdateExisting={data.handleUpdateExistingWeekly}
        renderValueInput={data.renderWeeklyValueInput} t={t}
        selectedWeek={data.selectedWeek} setSelectedWeek={data.setSelectedWeek} />

      <EntryDialog open={isQuarterlyDialogOpen} onOpenChange={setIsQuarterlyDialogOpen}
        title={t("kpi.add_quarterly_value", "Quartalsdaten")} interval="quarterly"
        parameters={data.parameters} categories={data.categories}
        isSaving={data.isSaving} duplicateWarning={data.duplicateWarning}
        setDuplicateWarning={data.setDuplicateWarning}
        onAddValue={data.handleAddQuarterlyValue} onUpdateExisting={data.handleUpdateExisting}
        renderValueInput={data.renderQuarterlyValueInput} t={t}
        selectedQuarter={data.selectedQuarter} setSelectedQuarter={data.setSelectedQuarter} />

      <EntryDialog open={isYearlyDialogOpen} onOpenChange={setIsYearlyDialogOpen}
        title={t("kpi.add_yearly_value", "Jahresdaten")} interval="yearly"
        parameters={data.parameters} categories={data.categories}
        isSaving={data.isSaving} duplicateWarning={data.duplicateWarning}
        setDuplicateWarning={data.setDuplicateWarning}
        onAddValue={data.handleAddYearlyValue} onUpdateExisting={data.handleUpdateExisting}
        renderValueInput={data.renderYearlyValueInput} t={t}
        selectedYear={data.selectedYear} setSelectedYear={data.setSelectedYear} />

      {/* Edit Dialog */}
      <EditValueDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}
        editingValue={editingValue} editFormData={editFormData} setEditFormData={setEditFormData}
        parameters={data.parameters} isSaving={data.isSaving}
        onSave={() => data.handleSaveEdit(editingValue, editFormData, () => { setIsEditDialogOpen(false); setEditingValue(null) })}
        t={t} />
    </div>
  )
}

export default ParameterDataEntry
