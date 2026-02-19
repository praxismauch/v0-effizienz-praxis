"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpDown, Pencil, Trash2, TrendingUp } from "lucide-react"
import type { Parameter, ParameterValue, SortConfig } from "./types"
import { formatDate, getWeek, getQuarter } from "./date-utils"

const intervalBadgeColors: Record<string, string> = {
  weekly: "#2563eb",
  monthly: "#16a34a",
  quarterly: "#d97706",
  yearly: "#9333ea",
}

interface DataTableProps {
  parameterValues: ParameterValue[]
  parameters: Parameter[]
  isLoading: boolean
  searchTerm: string
  selectedCategory: string
  selectedInterval: string
  sortConfig: SortConfig
  onSort: (key: string) => void
  onEditValue: (value: ParameterValue) => void
  onDeleteValue: (valueId: string) => void
  t: (key: string, fallback: string) => string
}

export function DataTable({
  parameterValues, parameters, isLoading,
  searchTerm, selectedCategory, selectedInterval,
  sortConfig, onSort, onEditValue, onDeleteValue, t,
}: DataTableProps) {
  const SortIcon = ({ columnKey }: { columnKey: string }) => (
    <ArrowUpDown className={`ml-1 h-3 w-3 ${sortConfig.key === columnKey && sortConfig.direction ? "text-primary" : "text-muted-foreground/40"}`} />
  )

  const filteredValues = parameterValues.filter((value) => {
    const parameter = parameters.find((p) => p.id === value.parameterId)
    if (!parameter) return false
    const matchesSearch = parameter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      value.userName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || parameter.category === selectedCategory
    const matchesInterval = selectedInterval === "all" || !parameter.interval || parameter.interval === selectedInterval
    return matchesSearch && matchesCategory && matchesInterval
  })

  const sortedValues = [...filteredValues].sort((a, b) => {
    if (!sortConfig.direction) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    const direction = sortConfig.direction === "asc" ? 1 : -1
    switch (sortConfig.key) {
      case "parameterName": return direction * a.parameterName.localeCompare(b.parameterName)
      case "value":
        const aVal = typeof a.value === "number" ? a.value : Number.parseFloat(String(a.value)) || 0
        const bVal = typeof b.value === "number" ? b.value : Number.parseFloat(String(b.value)) || 0
        return direction * (aVal - bVal)
      case "date": return direction * (new Date(a.date).getTime() - new Date(b.date).getTime())
      case "userName": return direction * a.userName.localeCompare(b.userName)
      case "createdAt": return direction * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      default: return 0
    }
  })

  const renderDateCell = (value: ParameterValue) => {
    const parameter = parameters.find((p) => p.id === value.parameterId)
    const interval = parameter?.interval || "monthly"
    const date = new Date(value.date)

    if (selectedInterval === "all") {
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm">
            {interval === "weekly" ? `KW ${getWeek(date)} - ${formatDate(date, "dd.MM.yyyy")}` :
             interval === "quarterly" ? `Q${getQuarter(date)} ${formatDate(date, "yyyy")}` :
             interval === "yearly" ? formatDate(date, "yyyy") :
             formatDate(date, "MMMM yyyy")}
          </span>
          <Badge variant="default" className="text-xs w-fit"
            style={{ backgroundColor: intervalBadgeColors[interval] || intervalBadgeColors.monthly, color: "#ffffff" }}>
            {interval === "weekly" ? t("kpi.interval_weekly", "Wochentlich") :
             interval === "quarterly" ? t("kpi.interval_quarterly", "Vierteljahrlich") :
             interval === "yearly" ? t("kpi.interval_yearly", "Jahrlich") :
             t("kpi.interval_monthly", "Monatlich")}
          </Badge>
        </div>
      )
    }

    if (selectedInterval === "weekly") return `KW ${getWeek(date)} - ${formatDate(date, "dd.MM.yyyy")}`
    if (selectedInterval === "quarterly") return `Q${getQuarter(date)} ${formatDate(date, "yyyy")}`
    if (selectedInterval === "yearly") return formatDate(date, "yyyy")
    return formatDate(date, "MMMM yyyy")
  }

  return (
    <CardContent className="pt-6">
      <div className="rounded-md border">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => onSort("parameterName")}>
                  <div className="flex items-center">{t("kpi.parameter_name", "Parameter")}<SortIcon columnKey="parameterName" /></div>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => onSort("value")}>
                  <div className="flex items-center">{t("kpi.value", "Wert")}<SortIcon columnKey="value" /></div>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => onSort("date")}>
                  <div className="flex items-center">
                    {selectedInterval === "all" ? t("kpi.interval", "Intervall") :
                     selectedInterval === "weekly" ? t("kpi.week", "Woche") :
                     selectedInterval === "quarterly" ? t("kpi.quarter", "Quartal") :
                     selectedInterval === "yearly" ? t("kpi.year", "Jahr") :
                     t("kpi.month", "Monat")}
                    <SortIcon columnKey="date" />
                  </div>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => onSort("userName")}>
                  <div className="flex items-center">{t("kpi.entered_by", "Erfasst von")}<SortIcon columnKey="userName" /></div>
                </TableHead>
                <TableHead>{t("kpi.notes", "Notizen")}</TableHead>
                <TableHead className="cursor-pointer select-none hover:bg-muted/50" onClick={() => onSort("createdAt")}>
                  <div className="flex items-center">{t("kpi.created", "Erstellt")}<SortIcon columnKey="createdAt" /></div>
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
              ) : sortedValues.map((value) => {
                const parameter = parameters.find((p) => p.id === value.parameterId)
                return (
                  <TableRow key={value.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{value.parameterName}</div>
                        {parameter && <Badge variant="outline" className="text-xs">{parameter.category}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {typeof value.value === "boolean" ? (value.value ? "Yes" : "No") : value.value}
                        </span>
                        {parameter?.unit && <span className="text-sm text-muted-foreground">{parameter.unit}</span>}
                      </div>
                    </TableCell>
                    <TableCell>{renderDateCell(value)}</TableCell>
                    <TableCell>{value.userName}</TableCell>
                    <TableCell>
                      {value.notes ? <span className="text-sm">{value.notes}</span> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(new Date(value.createdAt), "dd.MM.yy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => onEditValue(value)} className="h-8 w-8 p-0" title={t("kpi.edit", "Bearbeiten")}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDeleteValue(value.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive" title={t("kpi.delete", "Löschen")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      {!isLoading && sortedValues.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("kpi.no_values", "Keine Parameterwerte")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("kpi.start_entering", "Beginnen Sie mit der Eingabe von Parameterwerten")}
          </p>
        </div>
      )}
    </CardContent>
  )
}
