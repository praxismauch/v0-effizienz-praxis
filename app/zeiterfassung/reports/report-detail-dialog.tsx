"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { MonthlyTimeReport } from "./report-types"
import { MONTHS, formatMinutes } from "./report-types"

interface ReportDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: MonthlyTimeReport | null
  practiceId: string | number | undefined
  onExportCSV: (report: MonthlyTimeReport) => void
}

export function ReportDetailDialog({
  open,
  onOpenChange,
  report,
  practiceId,
  onExportCSV,
}: ReportDetailDialogProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const exportAsPDF = async (r: MonthlyTimeReport) => {
    setIsExportingPDF(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/zeiterfassung/reports/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report: r }),
      })

      if (!response.ok) {
        throw new Error("PDF-Export fehlgeschlagen")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `zeiterfassung_${r.year}-${String(r.month).padStart(2, "0")}_${r.team_members?.last_name}.pdf`
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            Zeiterfassungs-Report Details
          </DialogTitle>
          <DialogDescription>
            {report &&
              `${report.team_members?.first_name} ${report.team_members?.last_name} • ${MONTHS[report.month - 1]} ${report.year}`}
          </DialogDescription>
        </DialogHeader>

        {report && (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{report.total_work_days}</div>
                    <div className="text-xs text-muted-foreground">Arbeitstage</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{formatMinutes(report.total_net_minutes)}</div>
                    <div className="text-xs text-muted-foreground">Arbeitszeit</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        report.overtime_minutes >= 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {formatMinutes(report.overtime_minutes)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {report.overtime_minutes >= 0 ? "Überstunden" : "Minderstunden"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-purple-600">{report.homeoffice_days}</div>
                    <div className="text-xs text-muted-foreground">Homeoffice-Tage</div>
                  </CardContent>
                </Card>
              </div>

              {report.report_data?.daily_breakdown && (
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
                        {report.report_data.daily_breakdown.map((day, idx) => (
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
                  onClick={() => onExportCSV(report)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV-Export
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => exportAsPDF(report)}
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
                      PDF-Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
