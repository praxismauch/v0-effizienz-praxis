"use client"

import { format } from "date-fns"
import { ChevronDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { type ErrorLog, levelConfig, statusConfig } from "../logging-types"

interface LogDetailDialogProps {
  log: ErrorLog | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateStatus: (logId: string, status: string) => void
  onCopy: (text: string) => void
  onFilterChange: (key: string, value: string) => void
}

export function LogDetailDialog({
  log,
  open,
  onOpenChange,
  onUpdateStatus,
  onCopy,
  onFilterChange,
}: LogDetailDialogProps) {
  if (!log) return null

  const cfg = levelConfig[log.level]
  const Icon = cfg.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", cfg.color)} />
            Error Details
          </DialogTitle>
          <DialogDescription>
            {format(new Date(log.created_at), "dd.MM.yyyy HH:mm:ss")}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Status & Actions */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className={cn(statusConfig[log.status].bg, statusConfig[log.status].color)}>
                  {statusConfig[log.status].label}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Select
                  value={log.status}
                  onValueChange={(value) => onUpdateStatus(log.id, value)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Neu</SelectItem>
                    <SelectItem value="acknowledged">Bestätigt</SelectItem>
                    <SelectItem value="investigating">In Bearbeitung</SelectItem>
                    <SelectItem value="resolved">Gelöst</SelectItem>
                    <SelectItem value="ignored">Ignoriert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nachricht</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{log.message}</p>
                {log.error_message && log.error_message !== log.message && (
                  <p className="text-sm text-muted-foreground mt-1">{log.error_message}</p>
                )}
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Kategorie</Label>
                <p className="text-sm">{log.category}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Quelle</Label>
                <p className="text-sm">{log.source || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Benutzer ID</Label>
                <p className="text-sm font-mono">{log.user_id || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Praxis ID</Label>
                <p className="text-sm">{log.practice_id || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Request ID</Label>
                <p className="text-sm font-mono">{log.request_id || "-"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IP Adresse</Label>
                <p className="text-sm font-mono">{log.ip_address || "-"}</p>
              </div>
            </div>

            {/* URL */}
            {log.url && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">URL</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  {log.method && <Badge variant="outline">{log.method}</Badge>}
                  <code className="text-sm flex-1 truncate">{log.url}</code>
                  <Button size="sm" variant="ghost" onClick={() => onCopy(log.url || "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Stack Trace */}
            {log.stack_trace && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Stack Trace
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">{log.stack_trace}</pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* User Agent */}
            {log.user_agent && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">{log.user_agent}</p>
              </div>
            )}

            {/* Metadata */}
            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Zusätzliche Daten
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-3 bg-muted rounded-lg overflow-x-auto">
                    <pre className="text-xs">{JSON.stringify(log.metadata, null, 2)}</pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Resolution Notes */}
            {log.resolution_notes && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lösungsnotizen</Label>
                <p className="text-sm bg-green-500/10 text-green-700 p-3 rounded-lg">{log.resolution_notes}</p>
              </div>
            )}

            {/* Fingerprint */}
            {log.fingerprint && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Fingerprint:</span>
                <code>{log.fingerprint}</code>
                <Button
                  size="sm"
                  variant="link"
                  className="text-xs h-auto p-0"
                  onClick={() => {
                    onFilterChange("search", "")
                    onOpenChange(false)
                  }}
                >
                  Ähnliche anzeigen
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
