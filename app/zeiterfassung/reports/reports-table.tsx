"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileText, Download, Home, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MonthlyTimeReport } from "./report-types"
import { MONTHS, CURRENT_YEAR, formatMinutes } from "./report-types"

interface ReportsTableProps {
  reports: MonthlyTimeReport[]
  selectedYear: string
  selectedMonth: string
  onSelectReport: (report: MonthlyTimeReport) => void
  onExportCSV: (report: MonthlyTimeReport) => void
  onResetFilters: () => void
}

export function ReportsTable({
  reports,
  selectedYear,
  selectedMonth,
  onSelectReport,
  onExportCSV,
  onResetFilters,
}: ReportsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reports ({reports.length})</CardTitle>
        <CardDescription>
          {selectedYear !== "all" && `${selectedYear} • `}
          {selectedMonth !== "all" && `${MONTHS[Number.parseInt(selectedMonth) - 1]} • `}
          Klicken Sie auf einen Report für Details
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length > 0 ? (
          <ScrollArea className="h-[500px]">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Mitarbeiter</TableHead>
                    <TableHead className="min-w-[120px]">Zeitraum</TableHead>
                    <TableHead className="text-right min-w-[90px]">Arbeitstage</TableHead>
                    <TableHead className="text-right min-w-[90px]">Arbeitszeit</TableHead>
                    <TableHead className="text-right min-w-[120px]">{"Über-/Unterstunden"}</TableHead>
                    <TableHead className="text-center min-w-[90px]">Homeoffice</TableHead>
                    <TableHead className="text-center min-w-[70px]">Status</TableHead>
                    <TableHead className="min-w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectReport(report)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
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
                            onExportCSV(report)
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
            <Button variant="link" onClick={onResetFilters}>
              Filter zurücksetzen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
