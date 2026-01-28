"use client"

import { useState, useEffect } from "react"
import { format, parseISO, differenceInMinutes, differenceInSeconds } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Clock, Play, Square, Coffee, AlertTriangle, TrendingUp, TrendingDown, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { TimeBlock, WORK_LOCATIONS } from "../types"

interface StechuhrTabProps {
  currentStatus: "idle" | "working" | "break"
  currentBlock: TimeBlock | null
  selectedLocation: string
  setSelectedLocation: (location: string) => void
  timeBlocks: TimeBlock[]
  plausibilityIssues: any[]
  userId: string | undefined
  overtimeBalance: number
  homeofficePolicy: any | null
  homeofficeCheckResult: any | null
  onStamp: (action: "start" | "stop" | "pause_start" | "pause_end") => void
  onShowPolicyDialog: () => void
}

// Format Minuten zu Stunden
const formatMinutes = (minutes: number) => {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${h}h ${m}min`
}

// Berechne aktuelle Arbeitszeit
const getCurrentWorkDuration = (currentBlock: TimeBlock | null) => {
  if (!currentBlock) return 0
  const start = parseISO(currentBlock.start_time)
  return differenceInMinutes(new Date(), start) - (currentBlock.break_minutes || 0)
}

// Helper function for weekday labels
const getWeekDayLabel = (day: string) => {
  const days: Record<string, string> = {
    monday: "Mo",
    tuesday: "Di",
    wednesday: "Mi",
    thursday: "Do",
    friday: "Fr",
    saturday: "Sa",
    sunday: "So",
  }
  return days[day] || day
}

// Format seconds to HH:MM:SS
const formatElapsedTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

function StechuhrTab({
  currentStatus,
  currentBlock,
  selectedLocation,
  setSelectedLocation,
  timeBlocks,
  plausibilityIssues,
  userId,
  overtimeBalance,
  homeofficePolicy,
  homeofficeCheckResult,
  onStamp,
  onShowPolicyDialog,
}: StechuhrTabProps) {
  // Real-time elapsed time counter
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Update elapsed time every second when working
  useEffect(() => {
    if (currentStatus !== "idle" && currentBlock) {
      const startTime = parseISO(currentBlock.start_time)
      const breakSeconds = (currentBlock.break_minutes || 0) * 60
      
      // Calculate initial elapsed time
      const calculateElapsed = () => {
        const now = new Date()
        const totalSeconds = differenceInSeconds(now, startTime)
        return Math.max(0, totalSeconds - breakSeconds)
      }
      
      setElapsedSeconds(calculateElapsed())
      
      // Update every second
      const interval = setInterval(() => {
        setElapsedSeconds(calculateElapsed())
      }, 1000)
      
      return () => clearInterval(interval)
    } else {
      setElapsedSeconds(0)
    }
  }, [currentStatus, currentBlock])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Hauptkarte: Stechuhr */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>Stechuhr</span>
            <Badge
              variant={currentStatus === "working" ? "default" : currentStatus === "break" ? "secondary" : "outline"}
              className={cn(
                "text-sm",
                currentStatus === "working" && "bg-green-500",
                currentStatus === "break" && "bg-yellow-500",
              )}
            >
              {currentStatus === "working" ? "Arbeitet" : currentStatus === "break" ? "Pause" : "Nicht eingestempelt"}
            </Badge>
          </CardTitle>
          <CardDescription>{format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {homeofficePolicy && (
            <div
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                homeofficeCheckResult?.allowed ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200",
              )}
            >
              <Info
                className={cn(
                  "h-5 w-5 mt-0.5 shrink-0",
                  homeofficeCheckResult?.allowed ? "text-green-600" : "text-amber-600",
                )}
              />
              <div className="flex-1 space-y-1">
                <div className="font-medium text-sm">
                  {homeofficePolicy.is_allowed ? "Homeoffice erlaubt" : "Homeoffice nicht erlaubt"}
                </div>
                {homeofficePolicy.is_allowed && (
                  <>
                    {homeofficeCheckResult?.allowed ? (
                      <div className="text-xs text-muted-foreground">
                        Heute verfügbar • Max. {homeofficePolicy.max_days_per_week} Tage/Woche
                        {homeofficePolicy.allowed_days?.length > 0 && (
                          <span className="ml-1">({homeofficePolicy.allowed_days.map(getWeekDayLabel).join(", ")})</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700">
                        {homeofficeCheckResult?.reason || "Heute nicht verfügbar"}
                      </div>
                    )}
                  </>
                )}
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onShowPolicyDialog}>
                  Details anzeigen
                </Button>
              </div>
            </div>
          )}

          {/* Aktuelle Zeit-Anzeige */}
          <div className="text-center py-8 bg-muted/30 rounded-xl">
            {currentStatus !== "idle" ? (
              <>
                <div className="text-5xl font-mono font-bold text-primary mb-2">
                  {formatElapsedTime(elapsedSeconds)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Seit {currentBlock && format(parseISO(currentBlock.start_time), "HH:mm")} Uhr
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl font-mono font-bold text-muted-foreground mb-2">--:--:--</div>
                <div className="text-sm text-muted-foreground">Noch nicht eingestempelt</div>
              </>
            )}
          </div>

          {/* Arbeitsort Auswahl */}
          <div className="space-y-2">
            <Label>Arbeitsort</Label>
            <div className="grid grid-cols-3 gap-2">
              {WORK_LOCATIONS.slice(0, 3).map((loc) => {
                const Icon = loc.icon
                const isHomeoffice = loc.value === "homeoffice"
                const isDisabled =
                  currentStatus !== "idle" || (isHomeoffice && homeofficeCheckResult && !homeofficeCheckResult.allowed)

                return (
                  <Button
                    key={loc.value}
                    variant={selectedLocation === loc.value ? "default" : "outline"}
                    className="flex-col h-auto py-3"
                    onClick={() => setSelectedLocation(loc.value)}
                    disabled={isDisabled}
                    title={
                      isHomeoffice && homeofficeCheckResult && !homeofficeCheckResult.allowed
                        ? homeofficeCheckResult.reason
                        : undefined
                    }
                  >
                    <Icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{loc.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Haupt-Aktionsbuttons */}
          <div className="grid grid-cols-2 gap-4">
            {currentStatus === "idle" ? (
              <Button
                size="lg"
                className="col-span-2 h-16 text-lg bg-green-600 hover:bg-green-700"
                onClick={() => onStamp("start")}
              >
                <Play className="h-6 w-6 mr-2" />
                Einstempeln
              </Button>
            ) : (
              <>
                {currentStatus === "working" ? (
                  <Button size="lg" variant="secondary" className="h-16" onClick={() => onStamp("pause_start")}>
                    <Coffee className="h-5 w-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-16 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                    onClick={() => onStamp("pause_end")}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Weiter
                  </Button>
                )}
                <Button size="lg" variant="destructive" className="h-16" onClick={() => onStamp("stop")}>
                  <Square className="h-5 w-5 mr-2" />
                  Ausstempeln
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tagesübersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Heute</CardTitle>
          <CardDescription>{format(new Date(), "d. MMMM", { locale: de })}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Statistik-Karten */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Arbeitszeit</div>
              <div className="text-2xl font-bold text-blue-700">
                {formatMinutes(
                  timeBlocks
                    .filter((b) => b.date === format(new Date(), "yyyy-MM-dd"))
                    .reduce((sum, b) => sum + (b.actual_hours ? b.actual_hours * 60 : 0), 0) +
                    (currentStatus !== "idle" ? getCurrentWorkDuration(currentBlock) : 0),
                )}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">Pausenzeit</div>
              <div className="text-2xl font-bold text-orange-700">
                {formatMinutes(
                  timeBlocks
                    .filter((b) => b.date === format(new Date(), "yyyy-MM-dd"))
                    .reduce((sum, b) => sum + (b.break_minutes || 0), 0) + (currentBlock?.break_minutes || 0),
                )}
              </div>
            </div>
          </div>

          {/* Überstundenkonto */}
          <div className={cn("p-4 rounded-lg", overtimeBalance >= 0 ? "bg-green-50" : "bg-red-50")}>
            <div className="flex items-center justify-between">
              <div>
                <div className={cn("text-sm mb-1", overtimeBalance >= 0 ? "text-green-600" : "text-red-600")}>
                  Überstundenkonto
                </div>
                <div className={cn("text-2xl font-bold", overtimeBalance >= 0 ? "text-green-700" : "text-red-700")}>
                  {formatMinutes(overtimeBalance)}
                </div>
              </div>
              {overtimeBalance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-400" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>

          {/* Plausibilitäts-Warnungen */}
          {plausibilityIssues.filter((i) => i.user_id === userId).length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                <AlertTriangle className="h-4 w-4" />
                Plausibilitäts-Hinweise
              </div>
              <ul className="text-sm text-yellow-600 space-y-1">
                {plausibilityIssues
                  .filter((i) => i.user_id === userId)
                  .slice(0, 3)
                  .map((issue) => (
                    <li key={issue.id}>• {issue.description}</li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StechuhrTab
