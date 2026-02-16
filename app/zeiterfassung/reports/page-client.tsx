"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RefreshCw, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-layout"
import { format } from "date-fns"
import { toast } from "sonner"

import type { MonthlyTimeReport } from "./report-types"
import { MONTHS, YEARS, CURRENT_YEAR, formatMinutes } from "./report-types"
import { ReportsTable } from "./reports-table"
import { ReportDetailDialog } from "./report-detail-dialog"
import { GenerateReportDialog } from "./generate-report-dialog"

export default function TimeReportsPageClient() {
  const { user, practiceId } = useUser()
  const [reports, setReports] = useState<MonthlyTimeReport[]>([])
  const [filteredReports, setFilteredReports] = useState<MonthlyTimeReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>(CURRENT_YEAR.toString())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedUserId, setSelectedUserId] = useState<string>("all")
  const [selectedReport, setSelectedReport] = useState<MonthlyTimeReport | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])

  const loadTeamMembers = async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/team`)
      const data = await response.json()
      if (data.teamMembers) {
        const members = data.teamMembers.map((member: any) => ({
          id: member.user_id,
          name: `${member.first_name} ${member.last_name}`,
        }))
        setTeamMembers(members)
      }
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }

  const loadReports = async () => {
    if (!practiceId) return
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedYear !== "all") params.append("year", selectedYear)
      if (selectedMonth !== "all") params.append("month", selectedMonth)
      if (selectedUserId !== "all") params.append("user_id", selectedUserId)

      const response = await fetch(`/api/practices/${practiceId}/zeiterfassung/reports?${params}`)
      const data = await response.json()

      if (data.error) {
        toast.error("Fehler beim Laden der Reports", { description: data.error })
        return
      }

      setReports(data.data || [])
      setFilteredReports(data.data || [])

      const uniqueMembers = Array.from(
        new Map(
          data.data
            .filter((r: MonthlyTimeReport) => r.team_members)
            .map((r: MonthlyTimeReport) => [
              r.user_id,
              {
                id: r.user_id,
                name: `${r.team_members?.first_name} ${r.team_members?.last_name}`,
              },
            ]),
        ).values(),
      )

      if (uniqueMembers.length > 0) {
        setTeamMembers(uniqueMembers)
      } else if (teamMembers.length === 0) {
        await loadTeamMembers()
      }
    } catch (error) {
      console.error("Fehler beim Laden der Reports:", error)
      toast.error("Fehler beim Laden der Reports")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [practiceId, selectedYear, selectedMonth, selectedUserId])

  const exportAsCSV = (report: MonthlyTimeReport) => {
    const headers = ["Datum", "Start", "Ende", "Brutto", "Pause", "Netto", "Ort", "Status"]
    const rows =
      report.report_data?.daily_breakdown?.map((day) => [
        day.date,
        day.start_time ? format(new Date(day.start_time), "HH:mm") : "",
        day.end_time ? format(new Date(day.end_time), "HH:mm") : "",
        formatMinutes(day.gross_minutes),
        formatMinutes(day.break_minutes),
        formatMinutes(day.net_minutes),
        day.work_location,
        day.plausibility_status,
      ]) || []

    const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `zeiterfassung_${report.year}-${String(report.month).padStart(2, "0")}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exportiert")
  }

  const handleSelectReport = (report: MonthlyTimeReport) => {
    setSelectedReport(report)
    setShowDetailDialog(true)
  }

  const handleResetFilters = () => {
    setSelectedYear(CURRENT_YEAR.toString())
    setSelectedMonth("all")
    setSelectedUserId("all")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6">
      <PageHeader
        title="Zeiterfassungs-Reports"
        subtitle="Monatliche Auswertungen und Export"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadReports}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Report generieren
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Reports nach Zeitraum und Mitarbeiter filtern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jahr</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jahre</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Monat</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Monate</SelectItem>
                  {MONTHS.map((month, idx) => (
                    <SelectItem key={idx} value={(idx + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <ReportsTable
        reports={filteredReports}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onSelectReport={handleSelectReport}
        onExportCSV={exportAsCSV}
        onResetFilters={handleResetFilters}
      />

      {/* Dialogs */}
      <GenerateReportDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        practiceId={practiceId}
        teamMembers={teamMembers}
        onSuccess={loadReports}
      />

      <ReportDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        report={selectedReport}
        practiceId={practiceId}
        onExportCSV={exportAsCSV}
      />
    </div>
  )
}
