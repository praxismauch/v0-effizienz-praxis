"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Download } from "lucide-react"
import { format } from "date-fns"
import { type TeamMemberOvertime, formatOvertimeMinutes, formatHours } from "./overtime-utils"
import { OvertimeSummaryCards } from "./overtime-summary-cards"
import { OvertimeTable } from "./overtime-table"

interface UeberstundenTabProps {
  practiceId: string
  isLoading?: boolean
}

export default function UeberstundenTab({ practiceId, isLoading = false }: UeberstundenTabProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberOvertime[]>([])
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "total" | "week" | "month">("total")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "all">("all")

  // Fetch team members overtime data
  useState(() => {
    if (!practiceId) return
    const fetchOvertimeData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/practices/${practiceId}/overtime`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      } catch (error) {
        console.error("Error fetching overtime data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchOvertimeData()
  }, [practiceId])

  const sortedMembers = useMemo(() => {
    const sorted = [...teamMembers]
    sorted.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string
      switch (sortBy) {
        case "name":
          aValue = `${a.last_name} ${a.first_name}`.toLowerCase()
          bValue = `${b.last_name} ${b.first_name}`.toLowerCase()
          break
        case "total":
          aValue = a.overtime_total_minutes
          bValue = b.overtime_total_minutes
          break
        case "week":
          aValue = a.overtime_this_week_minutes
          bValue = b.overtime_this_week_minutes
          break
        case "month":
          aValue = a.overtime_this_month_minutes
          bValue = b.overtime_this_month_minutes
          break
        default:
          aValue = a.overtime_total_minutes
          bValue = b.overtime_total_minutes
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })
    return sorted
  }, [teamMembers, sortBy, sortOrder])

  const totals = useMemo(() => ({
    total: sortedMembers.reduce((sum, m) => sum + m.overtime_total_minutes, 0),
    week: sortedMembers.reduce((sum, m) => sum + m.overtime_this_week_minutes, 0),
    month: sortedMembers.reduce((sum, m) => sum + m.overtime_this_month_minutes, 0),
  }), [sortedMembers])

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  const handleExport = () => {
    if (!sortedMembers || sortedMembers.length === 0) return
    const headers = ["Name", "E-Mail", "Gesamt Überstunden", "Diese Woche", "Dieser Monat", "Soll Std/Woche", "Ist Std diese Woche", "Ist Std dieser Monat"]
    const rows = sortedMembers.map((m) => [
      `${m.first_name} ${m.last_name}`, m.email,
      formatOvertimeMinutes(m.overtime_total_minutes), formatOvertimeMinutes(m.overtime_this_week_minutes),
      formatOvertimeMinutes(m.overtime_this_month_minutes), String(m.planned_hours_per_week || "0"),
      formatHours(m.actual_hours_this_week), formatHours(m.actual_hours_this_month),
    ])
    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", `ueberstunden_${format(new Date(), "yyyy-MM-dd")}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Überstunden-Übersicht
            </CardTitle>
            <CardDescription>Überstundenstand aller Teammitglieder</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as typeof selectedPeriod)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Gesamt</SelectItem>
                <SelectItem value="month">Dieser Monat</SelectItem>
                <SelectItem value="week">Diese Woche</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <OvertimeSummaryCards totals={totals} />
        <OvertimeTable
          members={sortedMembers}
          loading={loading || isLoading}
          selectedPeriod={selectedPeriod}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </CardContent>
    </Card>
  )
}
