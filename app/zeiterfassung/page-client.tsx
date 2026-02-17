"use client"

import { useState, useEffect } from "react"
import { Loader2, Clock, Users, FileText, BarChart3, AlertTriangle, List } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ZeiterfassungStats } from "./components/zeiterfassung-stats"
import { useTimeTrackingStatus, useTimeActions, useCorrectionRequests, usePlausibilityIssues, useTeamLiveView, useTimeBlocks, useTimeTracking } from "@/hooks/use-time-tracking"
import { toast } from "sonner"
import { format } from "date-fns"
import { submitCorrection } from "@/hooks/use-correction"

import type { StampAction, TimeBlock } from "./types"

import StechuhrTab from "./components/stechuhr-tab"
import TeamLiveTab from "./components/team-live-tab"
import ZeitkontoTab from "./components/zeitkonto-tab"
import KorrekturenTab from "./components/korrekturen-tab"
import AuswertungTab from "./components/auswertung-tab"
import ZeitLogsTab from "./components/zeit-logs-tab"

import StampDialog from "./components/stamp-dialog"
import CorrectionDialog from "./components/correction-dialog"
import PolicyDialog from "./components/policy-dialog"

interface ZeiterfassungPageClientProps {
  practiceId: string | null | undefined
  userId: string
}

export default function ZeiterfassungPageClient({ practiceId, userId }: ZeiterfassungPageClientProps) {
  const user = { id: userId }

  const [activeTab, setActiveTab] = useState("stechuhr")
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [teamFilter, setTeamFilter] = useState("all")

  const [showStampDialog, setShowStampDialog] = useState(false)
  const [stampAction, setStampAction] = useState<StampAction>("start")
  const [stampComment, setStampComment] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("office")
  const [isStamping, setIsStamping] = useState(false)

  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionBlock, setCorrectionBlock] = useState<TimeBlock | null>(null)
  const [correctionNewStart, setCorrectionNewStart] = useState("")
  const [correctionNewEnd, setCorrectionNewEnd] = useState("")
  const [correctionReason, setCorrectionReason] = useState("")

  const [showPolicyDialog, setShowPolicyDialog] = useState(false)

  const {
    status: currentSession,
    currentBlock,
    activeBreak,
    isLoading: statusLoading,
    mutate,
  } = useTimeTrackingStatus(practiceId, user?.id)

  const { blocks: timeBlocks, isLoading: blocksLoading, mutate: mutateBlocks } = useTimeBlocks(
    practiceId, 
    user?.id || null,
    format(selectedMonth, "yyyy-MM-01"),
    format(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0), "yyyy-MM-dd")
  )
  
  const { members: teamMembers, isLoading: teamLoading, mutate: mutateTeam } = useTeamLiveView(practiceId)
  const { clockIn, clockOut, startBreak, endBreak } = useTimeActions(practiceId, user?.id)
  const { corrections: correctionRequests, mutate: mutateCorrectionRequests } = useCorrectionRequests(practiceId)
  const { issues: plausibilityIssues } = usePlausibilityIssues(practiceId)
  
  const homeofficePolicy = null
  const dataLoading = statusLoading || blocksLoading || teamLoading

  // Auto-stop stale time blocks on page load
  useEffect(() => {
    if (practiceId) {
      fetch(`/api/practices/${practiceId}/time/auto-stop`, { method: "POST" })
        .then((res) => res.json())
        .then((data) => {
          if (data.stopped > 0) {
            toast.warning(`${data.stopped} vergessene Stempelung(en) wurden automatisch beendet`, {
              duration: 8000,
            })
            mutate()
            mutateBlocks()
            mutateTeam()
          }
        })
        .catch(() => {})
    }
  }, [practiceId])

  useEffect(() => {
    if (practiceId && userId) {
      const timer = setTimeout(() => setIsLoading(false), 1000)
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  }, [practiceId, userId])

  const handleStamp = async () => {
    if (!practiceId || !user?.id) {
      toast.error("Benutzerdaten fehlen. Bitte neu anmelden.")
      return
    }
    setIsStamping(true)
    try {
      let result
      switch (stampAction) {
        case "start":
          result = await clockIn(selectedLocation, stampComment)
          if (!result.success) throw new Error(result.error || "Einstempeln fehlgeschlagen")
          await Promise.all([mutate(), mutateBlocks(), mutateTeam()])
          toast.success("Erfolgreich eingestempelt")
          break
        case "stop":
          result = await clockOut(undefined, stampComment)
          if (!result.success) throw new Error(result.error || "Ausstempeln fehlgeschlagen")
          await Promise.all([mutate(), mutateBlocks(), mutateTeam()])
          toast.success("Erfolgreich ausgestempelt")
          break
        case "pause_start":
          if (!currentBlock?.id) throw new Error("Kein aktiver Zeitblock gefunden.")
          result = await startBreak(currentBlock.id)
          if (!result.success) throw new Error(result.error || "Pause starten fehlgeschlagen")
          await Promise.all([mutate(), mutateBlocks(), mutateTeam()])
          toast.success("Pause gestartet")
          break
        case "pause_end":
          if (!activeBreak?.id) throw new Error("Keine aktive Pause gefunden")
          result = await endBreak(activeBreak.id)
          if (!result.success) throw new Error(result.error || "Pause beenden fehlgeschlagen")
          await Promise.all([mutate(), mutateBlocks(), mutateTeam()])
          toast.success("Pause beendet")
          break
      }
      setShowStampDialog(false)
      setStampComment("")
    } catch (error) {
      console.error("Stamp error:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Stempeln")
    } finally {
      setIsStamping(false)
    }
  }

  const openStampDialog = (action: StampAction) => {
    setStampAction(action)
    setShowStampDialog(true)
  }

  const submitCorrectionRequest = async () => {
    if (!correctionBlock || !correctionReason.trim()) return
    try {
      await submitCorrection({
        timeBlockId: correctionBlock.id,
        correctionType: "modify_time",
        newStartTime: correctionNewStart,
        newEndTime: correctionNewEnd,
        reason: correctionReason,
      })
      toast.success("Korrekturantrag eingereicht")
      setShowCorrectionDialog(false)
      setCorrectionBlock(null)
      setCorrectionReason("")
      mutateCorrectionRequests()
    } catch (error) {
      toast.error("Fehler beim Einreichen des Antrags")
      console.error(error)
    }
  }

  const openCorrectionDialog = (block: TimeBlock) => {
    setCorrectionBlock(block)
    setCorrectionNewStart(block.start_time)
    setCorrectionNewEnd(block.end_time || "")
    setShowCorrectionDialog(true)
  }

  const exportMonthlyReport = (exportFormat: "csv" | "pdf") => {
    if (exportFormat === "csv") {
      if (!timeBlocks || timeBlocks.length === 0) {
        toast.error("Keine Daten zum Exportieren vorhanden")
        return
      }
      const headers = ["Datum", "Start", "Ende", "Pause (Min)", "Arbeitszeit (Std)", "Typ", "Standort", "Kommentar"]
      const rows = timeBlocks.map((block: any) => [
        format(new Date(block.start_time), "dd.MM.yyyy"),
        format(new Date(block.start_time), "HH:mm"),
        block.end_time ? format(new Date(block.end_time), "HH:mm") : "Aktiv",
        block.break_minutes || "0",
        block.duration_minutes ? (block.duration_minutes / 60).toFixed(2) : "0",
        block.entry_type || "normal",
        block.location || "office",
        block.comment || "",
      ])
      const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n")
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `zeiterfassung_${format(selectedMonth, "yyyy-MM")}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`CSV-Export erfolgreich (${timeBlocks.length} Einträge)`)
    } else {
      toast.info("PDF-Export wird vorbereitet...")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!practiceId || !user?.id) {
    return (
      <div className="w-full p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Zugriff nicht moeglich</h2>
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
    <div className="w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Zeiterfassung</h1>
        <p className="text-muted-foreground">Erfassen und verwalten Sie Ihre Arbeitszeiten</p>
      </div>

      <ZeiterfassungStats
        currentBlock={currentBlock}
        timeBlocks={timeBlocks || []}
        correctionRequests={correctionRequests || []}
        teamMembers={teamMembers || []}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="stechuhr" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Stechuhr</span>
          </TabsTrigger>
          <TabsTrigger value="protokoll" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Protokoll</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Team Live</span>
          </TabsTrigger>
          <TabsTrigger value="zeitkonto" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Zeitkonto</span>
          </TabsTrigger>
          <TabsTrigger value="korrekturen" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Korrekturen</span>
          </TabsTrigger>
          <TabsTrigger value="auswertung" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Auswertung</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stechuhr">
          <StechuhrTab
            currentStatus={currentSession}
            currentBlock={currentBlock}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            timeBlocks={timeBlocks || []}
            plausibilityIssues={plausibilityIssues || []}
            userId={user?.id}
            overtimeBalance={0}
            homeofficePolicy={homeofficePolicy}
            homeofficeCheckResult={null}
            onStamp={openStampDialog}
            onShowPolicyDialog={() => setShowPolicyDialog(true)}
          />
        </TabsContent>

        <TabsContent value="protokoll">
          <ZeitLogsTab
            timeBlocks={timeBlocks || []}
            teamMembers={teamMembers || []}
            teams={[]}
            isLoading={blocksLoading}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onEditBlock={() => toast.info("Bearbeitung wird noch implementiert")}
            onDeleteBlock={() => toast.info("Löschen wird noch implementiert")}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamLiveTab 
            teamMembers={teamMembers || []} 
            teamFilter={teamFilter}
            setTeamFilter={setTeamFilter}
          />
        </TabsContent>

        <TabsContent value="zeitkonto">
          <ZeitkontoTab
            timeBalance={null}
            plausibilityIssues={plausibilityIssues || []}
            isLoadingBalance={dataLoading}
            isLoadingIssues={dataLoading}
            onResolveIssue={() => toast.info("Funktion wird noch implementiert")}
          />
        </TabsContent>

        <TabsContent value="korrekturen">
          <KorrekturenTab 
            corrections={correctionRequests || []}
            isLoading={dataLoading}
            onNewCorrection={() => toast.info("Funktion wird noch implementiert")}
            onViewCorrection={() => toast.info("Funktion wird noch implementiert")}
          />
        </TabsContent>

        <TabsContent value="auswertung">
          <AuswertungTab
            timeEntries={timeBlocks || []}
            isLoading={dataLoading}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </TabsContent>
      </Tabs>

      <StampDialog
        open={showStampDialog}
        onOpenChange={setShowStampDialog}
        stampAction={stampAction}
        selectedLocation={selectedLocation}
        stampComment={stampComment}
        onStampCommentChange={setStampComment}
        onConfirm={handleStamp}
        isStamping={isStamping}
        currentBlock={currentBlock}
      />

      <CorrectionDialog
        open={showCorrectionDialog}
        onOpenChange={setShowCorrectionDialog}
        correctionBlock={correctionBlock}
        correctionNewStart={correctionNewStart}
        correctionNewEnd={correctionNewEnd}
        correctionReason={correctionReason}
        onNewStartChange={setCorrectionNewStart}
        onNewEndChange={setCorrectionNewEnd}
        onReasonChange={setCorrectionReason}
        onSubmit={submitCorrectionRequest}
      />

      <PolicyDialog
        open={showPolicyDialog}
        onOpenChange={setShowPolicyDialog}
        homeofficePolicy={homeofficePolicy}
      />
    </div>
  )
}
