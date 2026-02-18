"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Play, Square, Coffee, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useTimeTrackingStatus, useTimeActions } from "@/hooks/use-time-tracking"
import { useToast } from "@/hooks/use-toast"

interface TimeTrackingWidgetProps {
  practiceId: string
  userId: string
}

function formatElapsed(startTime: string): string {
  const start = new Date(startTime).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - start)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export function TimeTrackingWidget({ practiceId, userId }: TimeTrackingWidgetProps) {
  const { status, currentBlock, activeBreak, mutate } = useTimeTrackingStatus(practiceId, userId)
  const { clockIn, clockOut, startBreak, endBreak } = useTimeActions(practiceId, userId)
  const { toast } = useToast()
  const [elapsed, setElapsed] = useState("00:00:00")
  const [actionLoading, setActionLoading] = useState(false)

  const isWorking = status === "working"
  const isOnBreak = status === "on_break"
  const isActive = isWorking || isOnBreak

  // Live timer
  useEffect(() => {
    if (!isActive || !currentBlock?.start_time) return
    const tick = () => setElapsed(formatElapsed(currentBlock.start_time))
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [isActive, currentBlock?.start_time])

  const handleClockIn = useCallback(async () => {
    setActionLoading(true)
    try {
      const result = await clockIn("office")
      if (result.success) {
        toast({ title: "Eingestempelt", description: "Zeiterfassung gestartet." })
        mutate()
      } else {
        toast({ title: "Fehler", description: result.error, variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }, [clockIn, mutate, toast])

  const handleClockOut = useCallback(async () => {
    setActionLoading(true)
    try {
      const result = await clockOut(currentBlock?.id)
      if (result.success) {
        toast({ title: "Ausgestempelt", description: "Zeiterfassung beendet." })
        mutate()
      } else {
        toast({ title: "Fehler", description: result.error, variant: "destructive" })
      }
    } finally {
      setActionLoading(false)
    }
  }, [clockOut, currentBlock?.id, mutate, toast])

  const handleToggleBreak = useCallback(async () => {
    setActionLoading(true)
    try {
      if (isOnBreak && activeBreak?.id) {
        const result = await endBreak(activeBreak.id)
        if (result.success) {
          toast({ title: "Pause beendet" })
          mutate()
        } else {
          toast({ title: "Fehler", description: result.error, variant: "destructive" })
        }
      } else {
        const result = await startBreak(currentBlock?.id)
        if (result.success) {
          toast({ title: "Pause gestartet" })
          mutate()
        } else {
          toast({ title: "Fehler", description: result.error, variant: "destructive" })
        }
      }
    } finally {
      setActionLoading(false)
    }
  }, [isOnBreak, activeBreak, currentBlock?.id, startBreak, endBreak, mutate, toast])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isActive ? "bg-green-500/10" : "bg-muted"}`}>
              <Clock className={`h-4 w-4 ${isActive ? "text-green-600" : "text-muted-foreground"}`} />
            </div>
            <span className="text-sm font-medium">Zeiterfassung</span>
          </div>
          <Link href="/zeiterfassung" className="text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="sr-only">Zur Zeiterfassung</span>
          </Link>
        </div>

        {isActive ? (
          <div className="space-y-3">
            <div className="text-center">
              <p className="text-2xl font-mono font-bold tracking-wider">{elapsed}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isOnBreak ? "In Pause" : "Arbeitszeit"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={isOnBreak ? "default" : "outline"}
                className="flex-1 h-8 text-xs"
                onClick={handleToggleBreak}
                disabled={actionLoading}
              >
                <Coffee className="h-3.5 w-3.5 mr-1" />
                {isOnBreak ? "Weiter" : "Pause"}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 h-8 text-xs"
                onClick={handleClockOut}
                disabled={actionLoading}
              >
                <Square className="h-3 w-3 mr-1" />
                Stopp
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center py-1">
              <p className="text-sm text-muted-foreground">Nicht eingestempelt</p>
            </div>
            <Button
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleClockIn}
              disabled={actionLoading}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Einstempeln
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
