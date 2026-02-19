"use client"

import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { type TimeBlock, formatMinutes, calculateWorkDuration } from "../lib/time-helpers"
import type { UserStat } from "../hooks/use-zeit-logs-stats"

interface UserStatsRowProps {
  stat: UserStat
  isExpanded: boolean
  onToggle: () => void
  onEditBlock?: (block: TimeBlock) => void
  onDeleteBlock?: (blockId: string) => void
}

export function UserStatsRow({ stat, isExpanded, onToggle, onEditBlock, onDeleteBlock }: UserStatsRowProps) {
  return (
    <div className="space-y-2">
      <div
        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
            {stat.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <div className="font-medium">{stat.name}</div>
            <div className="text-sm text-muted-foreground">
              {stat.daysWorked} Arbeitstage
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-sm font-medium">{formatMinutes(stat.totalMinutes)}</div>
            <div className="text-xs text-muted-foreground">Arbeitszeit</div>
          </div>
          <div className="text-right">
            <div
              className={cn(
                "text-sm font-medium",
                stat.overtimeMinutes >= 0 ? "text-green-600" : "text-red-600"
              )}
            >
              {formatMinutes(stat.overtimeMinutes)}
            </div>
            <div className="text-xs text-muted-foreground">Überstunden</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="ml-4 space-y-1 rounded-lg border bg-muted/30 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Startzeit</TableHead>
                <TableHead>Endzeit</TableHead>
                <TableHead>Pause</TableHead>
                <TableHead>Arbeitszeit</TableHead>
                <TableHead>Überstunden</TableHead>
                <TableHead>Standort</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stat.blocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell>
                    {format(parseISO(block.date), "EE, dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(block.start_time), "HH:mm")}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {block.end_time
                        ? format(parseISO(block.end_time), "HH:mm")
                        : "-"}
                      {block.auto_stopped && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-amber-600 border-amber-300">
                          Auto
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>{formatMinutes(block.break_minutes)}</TableCell>
                  <TableCell className="font-medium">
                    {formatMinutes(calculateWorkDuration(block))}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "font-medium",
                        block.overtime_minutes >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      )}
                    >
                      {formatMinutes(block.overtime_minutes)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{block.location_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEditBlock && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditBlock(block)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteBlock && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteBlock(block.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
