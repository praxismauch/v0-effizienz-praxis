"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { de } from "date-fns/locale"
import {
  useTimeTrackingStatus,
  useTeamLiveView,
  useTimeBlocks,
  useTimeActions,
  useCorrectionRequests,
  usePlausibilityIssues,
} from "@/hooks/use-time-tracking"
import { useUser } from "@/hooks/use-user"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Clock, Users, Calendar, FileText, Shield, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

// Tab components
import StechuhrTab from "./components/stechuhr-tab"
import TeamLiveTab from "./components/team-live-tab"
import ZeitkontoTab from "./components/zeitkonto-tab"
import KorrekturenTab from "./components/korrekturen-tab"
import AuswertungTab from "./components/auswertung-tab"

// Types
import type { TimeBlock, MonthlyReport, CorrectionRequest } from "./types"
import { WORK_LOCATIONS } from "./types"

export default function ZeiterfassungPageClient() {
  const { currentUser } = useUser()
  const user = currentUser
  const practiceId = currentUser?.practiceId ? String(currentUser.practiceId) : null

  // UI State
  const [activeTab, setActiveTab] = useState("stechuhr")
  const [isLoading, setIsLoading] = useState(true)
  const [isStamping, setIsStamping] = useState(false)

  // Stechuhr State
  const [currentStatus, setCurrentStatus] = useState<"idle" | "working" | "break">("idle")
  const [currentBlock, setCurrentBlock] = useState<TimeBlock | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<string>("office")
  const [stampComment, setStampComment] = useState("")
  const [showStampDialog, setShowStampDialog] = useState(false)
  const [stampAction, setStampAction] = useState<"start" | "stop" | "pause_start" | "pause_end">("start")

  // Time Account State
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [overtimeBalance, setOvertimeBalance] = useState(0)

  // Corrections State
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionBlock, setCorrectionBlock] = useState<TimeBlock | null>(null)
  const [correctionReason, setCorrectionReason] = useState("")
  const [correctionNewStart, setCorrectionNewStart] = useState("")
  const [correctionNewEnd, setCorrectionNewEnd] = useState("")

  // Policy State
  const [homeofficePolicy, setHomeofficePolicy] = useState<any | null>(null)
  const [homeofficeCheckResult, setHomeofficeCheckResult] = useState<any | null>(null)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)

  // SWR hooks
  const { status: swrStatus, currentBlock: swrCurrentBlock, mutate: mutateStatus } = useTimeTrackingStatus(
    practiceId,
    user?.id
  )
  const { members: swrTeamMembers, isLoading: teamLoading } = useTeamLiveView(practiceId)
  const { blocks: swrTimeBlocks, isLoading: blocksLoading, mutate: mutateBlocks } = useTimeBlocks(
    practiceId,
    user?.id,
    format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
    format(endOfMonth(selectedMonth), "yyyy-MM-dd")
  )
  const { clockIn, clockOut, startBreak, endBreak } = useTimeActions(practiceId, user?.id)
  const { corrections: swrCorrections, mutate: mutateCorrections } = useCorrectionRequests(practiceId)
  const { issues: swrPlausibilityIssues } = usePlausibilityIssues(practiceId)

  // Sync SWR data with local state
  useEffect(() => {
    if (swrStatus) setCurrentStatus(swrStatus)
  }, [swrStatus])

  useEffect(() => {
    if (swrCurrentBlock !== undefined) {
      setCurrentBlock(swrCurrentBlock)
      if (swrCurrentBlock?.location_type) setSelectedLocation(swrCurrentBlock.location_type)
    }
  }, [swrCurrentBlock])

  useEffect(() => {
    if (swrTimeBlocks) {
      setTimeBlocks(swrTimeBlocks)
      if (swrTimeBlocks.length > 0) {
        const totalNetMinutes = swrTimeBlocks.reduce((sum, b) => sum + (b.actual_hours ? b.actual_hours * 60 : 0), 0)
        const workDays = new Set(swrTimeBlocks.map((b) => b.date)).size
        const homeOfficeDays = swrTimeBlocks.filter((b) => b.location_type === "homeoffice").length
        const warnings = swrTimeBlocks.filter((b) => b.status !== "completed").length
        const targetMinutes = workDays * 480
        const overtime = totalNetMinutes - targetMinutes

        setMonthlyReport({
          total_work_days: workDays,
          total_net_minutes: totalNetMinutes,
          overtime_minutes: overtime,
          homeoffice_days: homeOfficeDays,
          corrections_count: 0,
          plausibility_warnings: warnings,
        })
      }
    }
  }, [swrTimeBlocks])

  // Loading state management
  useEffect(() => {
    if (practiceId && user?.id) {
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    } else if (currentUser !== undefined) {
      setIsLoading(false)
    }
  }, [practiceId, user?.id, currentUser])

  // Handlers
  const handleStamp = useCallback(
    async (action: "start" | "stop" | "pause_start" | "pause_end") => {
      setStampAction(action)
      setShowStampDialog(true)
    },
    []
  )

  const confirmStamp = useCallback(async () => {
    if (!practiceId || !user?.id) return
    setIsStamping(true)

    try {
      let result
      switch (stampAction) {
        case "start":
          result = await clockIn(selectedLocation, stampComment)
          break
        case "stop":
          result = await clockOut(stampComment)
          break
        case "pause_start":
          result = await startBreak(stampComment)
          break
        case "pause_end":
          result = await endBreak(stampComment)
          break
      }

      if (result?.success) {
        toast.success(
          stampAction === "start"
            ? "Arbeitszeit gestartet"
            : stampAction === "stop"
              ? "Arbeitszeit beendet"
              : stampAction === "pause_start"
                ? "Pause gestartet"
                : "Pause beendet"
        )
        mutateStatus()
        mutateBlocks()
      }
    } catch (error) {
      toast.error("Fehler beim Stempeln")
    } finally {
      setIsStamping(false)
      setShowStampDialog(false)
      setStampComment("")
    }
  }, [practiceId, user?.id, stampAction, selectedLocation, stampComment, clockIn, clockOut, startBreak, endBreak, mutateStatus, mutateBlocks])

  const handleCorrectionSubmit = useCallback(async () => {
    if (!practiceId || !correctionBlock || !correctionReason) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/time-correction-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          time_block_id: correctionBlock.id,
          user_id: user?.id,
          correction_type: "time_change",
          requested_changes: {
            new_start_time: correctionNewStart || undefined,
            new_end_time: correctionNewEnd || undefined,
          },
          reason: correctionReason,
        }),
      })

      if (response.ok) {
        toast.success("Korrekturantrag eingereicht")
        mutateCorrections()
        setShowCorrectionDialog(false)
        setCorrectionBlock(null)
        setCorrectionReason("")
        setCorrectionNewStart("")
        setCorrectionNewEnd("")
      }
    } catch (error) {
      toast.error("Fehler beim Einreichen")
    }
  }, [practiceId, correctionBlock, correctionReason, correctionNewStart, correctionNewEnd, user?.id, mutateCorrections])

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Render error state
  if (!practiceId || !user?.id) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zugriff nicht möglich</h2>
            <p className="text-muted-foreground text-center">
              {!user?.id
                ? "Bitte melden Sie sich an, um die Zeiterfassung zu nutzen."
                : "Keine Praxis zugewiesen. Bitte kontaktieren Sie Ihren Administrator."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
        <p className="text-muted-foreground">Erfassen und verwalten Sie Ihre Arbeitszeiten</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 mb-6">
          <TabsTrigger value="stechuhr" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Stechuhr</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team Live</span>
          </TabsTrigger>
          <TabsTrigger value="zeitkonto" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Zeitkonto</span>
          </TabsTrigger>
          <TabsTrigger value="korrekturen" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Korrekturen</span>
          </TabsTrigger>
          <TabsTrigger value="auswertung" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Auswertung</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stechuhr">
          <StechuhrTab
            currentStatus={currentStatus}
            currentBlock={currentBlock}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            timeBlocks={timeBlocks}
            plausibilityIssues={swrPlausibilityIssues || []}
            userId={user?.id}
            overtimeBalance={overtimeBalance}
            homeofficePolicy={homeofficePolicy}
            homeofficeCheckResult={homeofficeCheckResult}
            onStamp={handleStamp}
            onShowPolicyDialog={() => setShowPolicyDialog(true)}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamLiveTab members={swrTeamMembers || []} isLoading={teamLoading} />
        </TabsContent>

        <TabsContent value="zeitkonto">
          <ZeitkontoTab
            timeBalance={{
              current_balance: overtimeBalance,
              target_hours: monthlyReport?.total_work_days ? monthlyReport.total_work_days * 8 : 0,
              actual_hours: monthlyReport ? monthlyReport.total_net_minutes / 60 : 0,
            }}
            plausibilityIssues={swrPlausibilityIssues || []}
            isLoadingBalance={blocksLoading}
            isLoadingIssues={false}
            onResolveIssue={(issue) => {
              toast.info("Plausibilitätsproblem wird überprüft")
            }}
          />
        </TabsContent>

        <TabsContent value="korrekturen">
          <KorrekturenTab
            corrections={swrCorrections || []}
            timeBlocks={timeBlocks}
            isLoading={false}
            onRequestCorrection={(block) => {
              setCorrectionBlock(block)
              setShowCorrectionDialog(true)
            }}
          />
        </TabsContent>

        <TabsContent value="auswertung">
          <AuswertungTab
            monthlyReport={monthlyReport}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            timeBlocks={timeBlocks}
            isLoading={blocksLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Stamp Dialog */}
      <Dialog open={showStampDialog} onOpenChange={setShowStampDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stampAction === "start"
                ? "Arbeitszeit starten"
                : stampAction === "stop"
                  ? "Arbeitszeit beenden"
                  : stampAction === "pause_start"
                    ? "Pause starten"
                    : "Pause beenden"}
            </DialogTitle>
            <DialogDescription>
              {stampAction === "start" && "Wählen Sie Ihren Arbeitsort und starten Sie die Zeiterfassung."}
              {stampAction === "stop" && "Möchten Sie Ihre Arbeitszeit jetzt beenden?"}
              {stampAction === "pause_start" && "Möchten Sie eine Pause beginnen?"}
              {stampAction === "pause_end" && "Möchten Sie Ihre Pause beenden?"}
            </DialogDescription>
          </DialogHeader>

          {stampAction === "start" && (
            <div className="space-y-4">
              <div>
                <Label>Arbeitsort</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {WORK_LOCATIONS.map((loc) => (
                    <Button
                      key={loc.value}
                      type="button"
                      variant={selectedLocation === loc.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setSelectedLocation(loc.value)}
                    >
                      <loc.icon className="h-5 w-5 mb-1" />
                      <span className="text-xs">{loc.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Kommentar (optional)</Label>
            <Textarea
              value={stampComment}
              onChange={(e) => setStampComment(e.target.value)}
              placeholder="Optionaler Kommentar..."
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStampDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={confirmStamp} disabled={isStamping}>
              {isStamping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Korrekturantrag</DialogTitle>
            <DialogDescription>Beantragen Sie eine Korrektur für diesen Zeiteintrag.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Neue Startzeit</Label>
              <Input
                type="time"
                value={correctionNewStart}
                onChange={(e) => setCorrectionNewStart(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Neue Endzeit</Label>
              <Input
                type="time"
                value={correctionNewEnd}
                onChange={(e) => setCorrectionNewEnd(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Begründung *</Label>
              <Textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Bitte begründen Sie Ihren Korrekturantrag..."
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCorrectionSubmit} disabled={!correctionReason}>
              Antrag einreichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
