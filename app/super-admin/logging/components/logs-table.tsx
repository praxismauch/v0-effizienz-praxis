"use client"

import { format, formatDistanceToNow } from "date-fns"
import { de } from "date-fns/locale"
import { Eye, MoreHorizontal, RefreshCw, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { type ErrorLog, levelConfig, statusConfig, categoryIcons, sourceIcons } from "../logging-types"

interface LogsTableProps {
  logs: ErrorLog[]
  isLoading: boolean
  selectedLogs: string[]
  onSelectAll: () => void
  onSelectLog: (id: string) => void
  onViewDetails: (log: ErrorLog) => void
  onUpdateStatus: (logId: string, status: string) => void
}

export function LogsTable({
  logs,
  isLoading,
  selectedLogs,
  onSelectAll,
  onSelectLog,
  onViewDetails,
  onUpdateStatus,
}: LogsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={selectedLogs.length === logs.length && logs.length > 0}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="w-[160px]">Zeit</TableHead>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead className="w-[100px]">Kategorie</TableHead>
              <TableHead>Nachricht</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[80px]">Quelle</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Keine Logs gefunden
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const levelCfg = levelConfig[log.level] || levelConfig.info
                const statusCfg = statusConfig[log.status] || statusConfig.new
                const LevelIcon = levelCfg.icon
                const StatusIcon = statusCfg.icon
                const CategoryIcon = categoryIcons[log.category] || Activity
                const SourceIcon = sourceIcons[log.source || ""] || Activity

                return (
                  <TableRow
                    key={log.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedLogs.includes(log.id) && "bg-muted/50"
                    )}
                    onClick={() => onViewDetails(log)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLogs.includes(log.id)}
                        onCheckedChange={() => onSelectLog(log.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div>{format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}</div>
                      <div className="text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: de })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(levelCfg.bg, levelCfg.color)}>
                        <LevelIcon className="h-3 w-3 mr-1" />
                        {levelCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <CategoryIcon className="h-3 w-3 text-muted-foreground" />
                        {log.category}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[400px] truncate font-medium">{log.message}</div>
                      {log.url && (
                        <div className="text-xs text-muted-foreground truncate max-w-[400px]">{log.url}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(statusCfg.bg, statusCfg.color)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.source && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <SourceIcon className="h-3 w-3" />
                          {log.source}
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(log)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Details anzeigen
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onUpdateStatus(log.id, "acknowledged")}>
                            Bestätigen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(log.id, "investigating")}>
                            In Bearbeitung
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(log.id, "resolved")}>
                            Gelöst
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onUpdateStatus(log.id, "ignored")}>
                            Ignorieren
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
