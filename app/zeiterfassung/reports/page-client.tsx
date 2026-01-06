"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Download, Home, AlertTriangle, Loader2, RefreshCw, Plus } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface MonthlyTimeReport {
  id: string
  practice_id: number
  user_id: string
  year: number
  month: number
  total_work_days: number
  total_gross_minutes: number
  total_break_minutes: number
  total_net_minutes: number
  overtime_minutes: number
  undertime_minutes: number
  homeoffice_days: number
  sick_days: number
  vacation_days: number
  training_days: number
  corrections_count: number
  plausibility_warnings: number
  report_data: {
    daily_breakdown?: Array<{
      date: string
      start_time: string
      end_time: string
      gross_minutes: number
      break_minutes: number
      net_minutes: number
      work_location: string
      plausibility_status: string
    }>
  }
  generated_at: string
  team_members?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
}

const MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

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
  const [generateUserId, setGenerateUserId] = useState<string>("")
  const [generateYear, setGenerateYear] = useState<string>(CURRENT_YEAR.toString())
  const [generateMonth, setGenerateMonth] = useState<string>((new Date().getMonth() + 1).toString())
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string }>>([])

  const loadTeamMembers = async () => {
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/team`)
      const data = await response.json()

      if (data.data) {
        const members = data.data.map((member: any) => ({
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

  const formatMinutes = (minutes: number) => {
    const h = Math.floor(Math.abs(minutes) / 60)
    const m = Math.abs(minutes) % 60
    const sign = minutes < 0 ? "-" : ""
    return `${sign}${h}h ${m}min`
  }

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

  const exportAsPDF = async (report: MonthlyTimeReport) => {
    setIsExportingPDF(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/zeiterfassung/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report }),
      })

      if (!response.ok) {
        throw new Error("PDF-Export fehlgeschlagen")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `zeiterfassung_${report.year}-${String(report.month).padStart(2, "0")}_${report.team_members?.last_name}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("PDF erfolgreich exportiert")
    } catch (error) {
      console.error("PDF Export error:", error)
      toast.error("PDF-Export fehlgeschlagen")
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!generateUserId || !generateYear || !generateMonth) {
      toast.error("Bitte alle Felder ausfüllen")
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/zeiterfassung/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: generateUserId,
          year: Number.parseInt(generateYear),
          month: Number.parseInt(generateMonth),
        }),
      })

      const data = await response.json()

      if (data.error) {
        toast.error("Fehler beim Generieren des Reports", { description: data.error })
        return
      }

      toast.success("Report erfolgreich generiert")
      setShowGenerateDialog(false)
      setGenerateUserId("")
      loadReports()
    } catch (error) {
      console.error("Generate report error:", error)
      toast.error("Fehler beim Generieren des Reports")
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Zeiterfassungs-Reports</h1>
          <p className="text-muted-foreground">Monatliche Auswertungen und Export</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReports}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => setShowGenerateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Report generieren
          </Button>
        </div>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Reports ({filteredReports.length})</CardTitle>
          <CardDescription>
            {selectedYear !== "all" && `${selectedYear} • `}
            {selectedMonth !== "all" && `${MONTHS[Number.parseInt(selectedMonth) - 1]} • `}
            Klicken Sie auf einen Report für Details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Mitarbeiter</TableHead>
                      <TableHead className="min-w-[120px]">Zeitraum</TableHead>
                      <TableHead className="text-right min-w-[90px]">Arbeitstage</TableHead>
                      <TableHead className="text-right min-w-[90px]">Arbeitszeit</TableHead>
                      <TableHead className="text-right min-w-[120px]">Über-/Unterstunden</TableHead>
                      <TableHead className="text-center min-w-[90px]">Homeoffice</TableHead>
                      <TableHead className="text-center min-w-[70px]">Status</TableHead>
                      <TableHead className="min-w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowDetailDialog(true)
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={report.team_members?.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>
                                {report.team_members?.first_name?.[0]}
                                {report.team_members?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {report.team_members?.first_name} {report.team_members?.last_name}
                              </div>
                              <div className="text-xs text-muted-foreground">{report.team_members?.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {MONTHS[report.month - 1]} {report.year}
                        </TableCell>
                        <TableCell className="text-right font-mono">{report.total_work_days}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatMinutes(report.total_net_minutes)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={report.overtime_minutes >= 0 ? "default" : "destructive"}
                            className={cn("font-mono", report.overtime_minutes >= 0 ? "bg-green-500" : "bg-red-500")}
                          >
                            {formatMinutes(report.overtime_minutes)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            <Home className="h-3 w-3 mr-1" />
                            {report.homeoffice_days}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {report.plausibility_warnings > 0 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {report.plausibility_warnings}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              exportAsCSV(report)
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine Reports für die ausgewählten Filter gefunden</p>
              <Button
                variant="link"
                onClick={() => {
                  setSelectedYear(CURRENT_YEAR.toString())
                  setSelectedMonth("all")
                  setSelectedUserId("all")
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Report generieren</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen monatlichen Zeiterfassungs-Report für einen Mitarbeiter
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mitarbeiter</label>
              <Select value={generateUserId} onValueChange={setGenerateUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Mitarbeiter auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Jahr</label>
                <Select value={generateYear} onValueChange={setGenerateYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={generateMonth} onValueChange={setGenerateMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, idx) => (
                      <SelectItem key={idx} value={(idx + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)} disabled={isGenerating}>
              Abbrechen
            </Button>
            <Button onClick={handleGenerateReport} disabled={isGenerating || !generateUserId}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Zeiterfassungs-Report Details
            </DialogTitle>
            <DialogDescription>
              {selectedReport &&
                `${selectedReport.team_members?.first_name} ${selectedReport.team_members?.last_name} • ${MONTHS[selectedReport.month - 1]} ${selectedReport.year}`}
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <ScrollArea className="h-[70vh]">
              <div className="space-y-6 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{selectedReport.total_work_days}</div>
                      <div className="text-xs text-muted-foreground">Arbeitstage</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{formatMinutes(selectedReport.total_net_minutes)}</div>
                      <div className="text-xs text-muted-foreground">Arbeitszeit</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          selectedReport.overtime_minutes >= 0 ? "text-green-600" : "text-red-600",
                        )}
                      >
                        {formatMinutes(selectedReport.overtime_minutes)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedReport.overtime_minutes >= 0 ? "Überstunden" : "Minderstunden"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-purple-600">{selectedReport.homeoffice_days}</div>
                      <div className="text-xs text-muted-foreground">Homeoffice-Tage</div>
                    </CardContent>
                  </Card>
                </div>

                {selectedReport.report_data?.daily_breakdown && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tägliche Aufschlüsselung</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Ende</TableHead>
                            <TableHead>Pause</TableHead>
                            <TableHead>Netto</TableHead>
                            <TableHead>Ort</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedReport.report_data.daily_breakdown.map((day, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">
                                {format(new Date(day.date), "EEE, dd.MM.", { locale: de })}
                              </TableCell>
                              <TableCell>{day.start_time && format(new Date(day.start_time), "HH:mm")}</TableCell>
                              <TableCell>{day.end_time && format(new Date(day.end_time), "HH:mm")}</TableCell>
                              <TableCell className="font-mono">{day.break_minutes} min</TableCell>
                              <TableCell className="font-mono font-medium">{formatMinutes(day.net_minutes)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {day.work_location}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => selectedReport && exportAsCSV(selectedReport)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => selectedReport && exportAsPDF(selectedReport)}
                    disabled={isExportingPDF}
                  >
                    {isExportingPDF ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exportiere...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        PDF Export
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
