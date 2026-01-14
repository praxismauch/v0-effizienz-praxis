"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { createBrowserClient } from "@/lib/supabase/client"
import { format, parseISO, startOfMonth, endOfMonth, differenceInMinutes } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  Play,
  Square,
  Coffee,
  Home,
  Building2,
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Edit2,
  Send,
  Shield,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface TimeStamp {
  id: string
  user_id: string
  practice_id: string
  stamp_type: "start" | "stop" | "pause_start" | "pause_end"
  timestamp: string
  location_type: string
  device_fingerprint?: string
  ip_address?: string
  latitude?: number
  longitude?: number
  notes?: string
  is_manual: boolean
  created_at: string
  updated_at: string
}

interface TimeBlock {
  id: string
  user_id: string
  practice_id: string
  date: string
  start_time: string
  end_time?: string
  planned_hours?: number
  actual_hours?: number
  break_minutes: number
  overtime_minutes: number
  location_type: string
  status: "active" | "completed" | "cancelled"
  notes?: string
  created_at: string
  updated_at: string
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  current_status?: "working" | "break" | "absent"
  current_location?: string
  today_minutes?: number
}

interface CorrectionRequest {
  id: string
  user_id: string
  correction_type: string
  requested_changes: any
  reason: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  reviewed_by?: string
  review_comment?: string
}

interface MonthlyReport {
  total_work_days: number
  total_net_minutes: number
  overtime_minutes: number
  homeoffice_days: number
  corrections_count: number
  plausibility_warnings: number
}

// Database constraint: location_type IN ('office', 'homeoffice', 'mobile')
const WORK_LOCATIONS = [
  { value: "office", label: "Praxis vor Ort", icon: Building2, color: "bg-blue-100 text-blue-700" },
  { value: "homeoffice", label: "Homeoffice", icon: Home, color: "bg-purple-100 text-purple-700" },
  { value: "mobile", label: "Mobil / Außentermin", icon: Car, color: "bg-orange-100 text-orange-700" },
]

export default function ZeiterfassungPageClient() {
  const { currentUser } = useUser()
  const user = currentUser
  const practiceId = currentUser?.practiceId ? String(currentUser.practiceId) : null

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

  // Team Live View
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamFilter, setTeamFilter] = useState<string>("all")

  // Zeitkonto State
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([])
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null)
  const [overtimeBalance, setOvertimeBalance] = useState(0)

  // Korrekturen State
  const [correctionRequests, setCorrectionRequests] = useState<CorrectionRequest[]>([])
  const [showCorrectionDialog, setShowCorrectionDialog] = useState(false)
  const [correctionBlock, setCorrectionBlock] = useState<TimeBlock | null>(null)
  const [correctionReason, setCorrectionReason] = useState("")
  const [correctionNewStart, setCorrectionNewStart] = useState("")
  const [correctionNewEnd, setCorrectionNewEnd] = useState("")

  // Plausibilität State
  const [plausibilityIssues, setPlausibilityIssues] = useState<any[]>([])

  const [homeofficePolicy, setHomeofficePolicy] = useState<any | null>(null)
  const [homeofficeCheckResult, setHomeofficeCheckResult] = useState<any | null>(null)
  const [loadingPolicy, setLoadingPolicy] = useState(false)
  const [showPolicyDialog, setShowPolicyDialog] = useState(false)

  const supabase = createBrowserClient()

  // Lade aktuellen Status
  const loadCurrentStatus = useCallback(async () => {
    if (!practiceId || !user?.id) {
      toast.error("Zeiterfassung nicht verfügbar", {
        description: "Praxis-ID oder Benutzer-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    try {
      // Lade heutigen offenen Block
      const today = format(new Date(), "yyyy-MM-dd")
      const { data: blocks } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user.id)
        .eq("date", today)
        .eq("status", "active")
        .order("start_time", { ascending: false })
        .limit(1)

      if (blocks && blocks.length > 0) {
        setCurrentBlock(blocks[0])

        // Prüfe ob gerade in Pause
        const { data: breaks } = await supabase
          .from("time_block_breaks")
          .select("*")
          .eq("time_block_id", blocks[0].id)
          .is("end_time", null)
          .limit(1)

        if (breaks && breaks.length > 0) {
          setCurrentStatus("break")
        } else {
          setCurrentStatus("working")
        }
        // Updated default value to 'office' to match the new default
        setSelectedLocation(blocks[0].location_type || "office")
      } else {
        setCurrentStatus("idle")
        setCurrentBlock(null)
      }
    } catch (error) {
      console.error("Error loading current status:", error)
      toast.error("Fehler beim Laden des Status", {
        description: "Bitte versuchen Sie es erneut.",
      })
    }
  }, [practiceId, user?.id, supabase])

  // Lade Team-Übersicht
  const loadTeamOverview = useCallback(async () => {
    if (!practiceId) {
      toast.error("Team-Übersicht nicht verfügbar", {
        description: "Praxis-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    try {
      // Lade alle Teammitglieder
      const { data: members } = await supabase
        .from("team_members")
        .select("id, first_name, last_name, email, avatar_url")
        .eq("practice_id", practiceId)
        .eq("status", "active")

      if (!members) return

      // Lade heutige Zeitblöcke für alle
      const today = format(new Date(), "yyyy-MM-dd")
      const { data: todayBlocks } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("date", today)

      // Merge Status in Teammitglieder
      const membersWithStatus = members.map((member) => {
        const memberBlocks = todayBlocks?.filter((b) => b.user_id === member.id) || []
        const openBlock = memberBlocks.find((b) => b.status === "active")
        const totalMinutes = memberBlocks.reduce((sum, b) => {
          // Calculate net minutes from actual_hours or break_minutes
          const actualMins = b.actual_hours ? b.actual_hours * 60 : 0
          return sum + actualMins
        }, 0)

        return {
          ...member,
          current_status: openBlock ? ("working" as const) : ("absent" as const),
          current_location: openBlock?.location_type,
          today_minutes: totalMinutes,
        }
      })

      setTeamMembers(membersWithStatus)
    } catch (error) {
      console.error("Error loading team overview:", error)
      toast.error("Fehler beim Laden der Team-Übersicht", {
        description: "Bitte versuchen Sie es erneut.",
      })
    }
  }, [practiceId, supabase])

  // Lade Zeitkonto für Monat
  const loadMonthlyData = useCallback(async () => {
    if (!practiceId || !user?.id) {
      toast.error("Monatsdaten nicht verfügbar", {
        description: "Praxis-ID oder Benutzer-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    try {
      const start = format(startOfMonth(selectedMonth), "yyyy-MM-dd")
      const end = format(endOfMonth(selectedMonth), "yyyy-MM-dd")

      const { data: blocks } = await supabase
        .from("time_blocks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("user_id", user.id)
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: true })

      setTimeBlocks(blocks || [])

      // Berechne Monatsbericht
      if (blocks) {
        const totalNetMinutes = blocks.reduce((sum, b) => sum + (b.actual_hours ? b.actual_hours * 60 : 0), 0)
        const totalBreakMinutes = blocks.reduce((sum, b) => sum + (b.break_minutes || 0), 0)
        const workDays = new Set(blocks.map((b) => b.date)).size
        const homeOfficeDays = blocks.filter((b) => b.location_type === "homeoffice").length
        const warnings = blocks.filter((b) => b.status !== "completed").length // Assuming status is an indicator of issues

        // Annahme: 8h/Tag Soll
        const targetMinutes = workDays * 480
        const overtime = totalNetMinutes - targetMinutes

        setMonthlyReport({
          total_work_days: workDays,
          total_net_minutes: totalNetMinutes,
          overtime_minutes: overtime,
          homeoffice_days: homeOfficeDays,
          corrections_count: 0, // This needs to be fetched separately or calculated
          plausibility_warnings: warnings,
        })
      }

      // Lade Überstundenkonto
      const { data: overtimeAccount } = await supabase
        .from("overtime_accounts")
        .select("balance_minutes")
        .eq("practice_id", practiceId)
        .eq("user_id", user.id)
        .single()

      if (overtimeAccount) {
        setOvertimeBalance(overtimeAccount.balance_minutes)
      }
    } catch (error) {
      console.error("Error loading monthly data:", error)
      toast.error("Fehler beim Laden der Monatsdaten", {
        description: "Bitte versuchen Sie es erneut.",
      })
    }
  }, [practiceId, user?.id, selectedMonth, supabase])

  // Lade Korrekturanträge
  const loadCorrectionRequests = useCallback(async () => {
    if (!practiceId) {
      toast.error("Korrekturanträge nicht verfügbar", {
        description: "Praxis-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    try {
      const { data } = await supabase
        .from("time_correction_requests")
        .select("*")
        .eq("practice_id", practiceId)
        .order("created_at", { ascending: false })
        .limit(50)

      setCorrectionRequests(data || [])
    } catch (error) {
      console.error("Error loading corrections:", error)
      toast.error("Fehler beim Laden der Korrekturanträge", {
        description: "Bitte versuchen Sie es erneut.",
      })
    }
  }, [practiceId, supabase])

  // Lade Plausibilitätsprobleme
  const loadPlausibilityIssues = useCallback(async () => {
    if (!practiceId) {
      toast.error("Plausibilitätsprüfung nicht verfügbar", {
        description: "Praxis-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    try {
      const { data } = await supabase
        .from("time_plausibility_checks")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("is_resolved", false)
        .order("created_at", { ascending: false })

      setPlausibilityIssues(data || [])
    } catch (error) {
      console.error("Error loading plausibility issues:", error)
      toast.error("Fehler beim Laden der Plausibilitätsprobleme", {
        description: "Bitte versuchen Sie es erneut.",
      })
    }
  }, [practiceId, supabase])

  const loadHomeofficePolicy = useCallback(async () => {
    if (!practiceId || !user?.id) return

    setLoadingPolicy(true)
    try {
      // Load policy
      const policyResponse = await fetch(`/api/practices/${practiceId}/homeoffice-policies`)
      if (policyResponse.ok) {
        const policyData = await policyResponse.json()
        // Find user-specific policy or default
        const userPolicy = policyData.policies?.find((p: any) => p.user_id === user.id)
        const defaultPolicy = policyData.policies?.find((p: any) => p.user_id === null)
        setHomeofficePolicy(userPolicy || defaultPolicy || null)
      }

      // Check if homeoffice is allowed today
      const checkResponse = await fetch(
        `/api/practices/${practiceId}/homeoffice-policies/check?userId=${user.id}&date=${format(new Date(), "yyyy-MM-dd")}`,
      )
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        setHomeofficeCheckResult(checkData)
      }
    } catch (error) {
      console.error("[v0] Error loading homeoffice policy:", error)
    } finally {
      setLoadingPolicy(false)
    }
  }, [practiceId, user?.id])

  // Initial Load
  const hasLoadedRef = useRef(false)
  const loadingPracticeIdRef = useRef<number | null>(null)

  useEffect(() => {
    const loadAllData = async () => {
      console.log("[v0] Zeiterfassung loadAllData started")
      setIsLoading(true)

      if (!practiceId || !user?.id) {
        console.log("[v0] Zeiterfassung - missing practiceId or userId")
        setIsLoading(false)
        return
      }

      const timeout = (ms: number) =>
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))

      try {
        const results = await Promise.allSettled([
          Promise.race([loadCurrentStatus(), timeout(5000)]),
          Promise.race([loadTeamOverview(), timeout(5000)]),
          Promise.race([loadMonthlyData(), timeout(5000)]),
          Promise.race([loadCorrectionRequests(), timeout(5000)]),
          Promise.race([loadPlausibilityIssues(), timeout(5000)]),
          // loadHomeofficePolicy() is intentionally not included here as it's less critical and can run independently if others fail or timeout
        ])

        const failures = results.filter((r) => r.status === "rejected")
        console.log("[v0] Zeiterfassung loaded with", failures.length, "failures")

        if (failures.length > 0) {
          console.warn("[v0] Some data failed to load:", failures)
          toast.error("Teilweise Ladefehler", {
            description: `${failures.length} Datenbereiche konnten nicht geladen werden.`,
          })
        }
      } catch (error) {
        console.error("[v0] Zeiterfassung loadAllData ERROR:", error)
        toast.error("Ladefehler", {
          description: "Daten konnten nicht vollständig geladen werden.",
        })
      } finally {
        console.log("[v0] Zeiterfassung setting isLoading to false")
        setIsLoading(false)
      }
    }

    loadAllData()
    // Load homeoffice policy independently if the main load is done or practiceId is available
    if (practiceId && user?.id) {
      loadHomeofficePolicy()
    }

    // Refresh alle 30 Sekunden (similar to original, but less critical if some data failed to load)
    const interval = setInterval(() => {
      if (user?.id && practiceId) {
        // Conditionally load only what might change frequently
        loadCurrentStatus()
        loadTeamOverview()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [
    user?.id,
    practiceId,
    loadCurrentStatus,
    loadTeamOverview,
    loadMonthlyData,
    loadCorrectionRequests,
    loadPlausibilityIssues,
    loadHomeofficePolicy, // Include here to ensure the interval re-runs if dependencies change
  ])

  useEffect(() => {
    if (practiceId && loadingPracticeIdRef.current !== practiceId) {
      hasLoadedRef.current = false
    }
  }, [practiceId])

  // Stempel-Funktion
  const handleStamp = async () => {
    console.log("[v0] 1-Click: handleStamp called", {
      practiceId,
      userId: user?.id,
      stampAction,
      selectedLocation,
    })

    if (!practiceId || !user?.id) {
      console.error("[v0] Validation failed:", { practiceId, userId: user?.id })
      toast.error("Fehler beim Stempeln", {
        description: "Praxis-ID oder Benutzer-ID fehlt. Bitte laden Sie die Seite neu.",
      })
      return
    }

    // Check for 'homeoffice' specifically and validate against the check result
    if (selectedLocation === "homeoffice" && stampAction === "start") {
      try {
        const checkResponse = await fetch(
          `/api/practices/${practiceId}/homeoffice-policies/check?userId=${user.id}&date=${format(new Date(), "yyyy-MM-dd")}`,
        )
        if (checkResponse.ok) {
          const checkData = await checkResponse.json()
          if (!checkData.allowed) {
            toast.error("Homeoffice nicht erlaubt", {
              description: checkData.reason || "Sie können heute nicht im Homeoffice arbeiten.",
            })
            return
          }
        } else {
          toast.error("Validierung fehlgeschlagen", {
            description: "Homeoffice-Berechtigung konnte nicht geprüft werden.",
          })
          return
        }
      } catch (error) {
        console.error("[v0] Error checking homeoffice policy:", error)
        toast.error("Validierung fehlgeschlagen", {
          description: "Ein Fehler ist bei der Prüfung aufgetreten.",
        })
        return
      }
    }

    console.log("[v0] 2-Handler: Starting stamp process")
    setIsStamping(true)

    try {
      const now = new Date().toISOString()

      console.log("[v0] 3-API: Inserting time_stamp", { stampAction, now })

      // Columns: id, user_id, practice_id, stamp_type, timestamp, location_type,
      //          device_fingerprint, ip_address, latitude, longitude, notes, is_manual
      const { data: stamp, error: stampError } = await supabase
        .from("time_stamps")
        .insert({
          practice_id: practiceId, // TEXT in DB
          user_id: user.id,
          stamp_type: stampAction,
          timestamp: now,
          // Use selectedLocation directly for location_type
          location_type: selectedLocation, // was work_location
          notes: stampComment || null, // was comment
          is_manual: false,
          // Removed: browser_info (doesn't exist in DB)
        })
        .select()
        .single()

      if (stampError) {
        console.error("[v0] time_stamps insert error:", stampError)
        throw stampError
      }

      console.log("[v0] time_stamp created:", stamp.id)

      // Verarbeite basierend auf Aktion
      if (stampAction === "start") {
        // Columns: id, user_id, practice_id, date, start_time, end_time, planned_hours,
        //          actual_hours, break_minutes, overtime_minutes, location_type, status, notes
        const { error: blockError } = await supabase.from("time_blocks").insert({
          practice_id: practiceId, // TEXT in DB
          user_id: user.id,
          date: format(new Date(), "yyyy-MM-dd"),
          start_time: now,
          // Use selectedLocation for location_type
          location_type: selectedLocation, // was work_location
          status: "active", // was is_open: true
          break_minutes: 0,
          overtime_minutes: 0,
          // Removed: start_stamp_id, is_open (don't exist in DB)
        })

        if (blockError) {
          console.error("[v0] time_blocks insert error:", blockError)
          throw blockError
        }

        setCurrentStatus("working")
        // Use WORK_LOCATIONS to find the label for the toast message
        toast.success("Arbeitszeit gestartet", {
          description: `${WORK_LOCATIONS.find((l) => l.value === selectedLocation)?.label}`,
        })
      } else if (stampAction === "stop") {
        // Schließe Block
        if (currentBlock) {
          const startTime = parseISO(currentBlock.start_time)
          const endTime = new Date()
          const grossMinutes = differenceInMinutes(endTime, startTime)
          const netMinutes = grossMinutes - (currentBlock.break_minutes || 0)

          const { error: updateError } = await supabase
            .from("time_blocks")
            .update({
              end_time: now,
              actual_hours: netMinutes / 60, // Store as hours
              status: "completed", // was is_open: false
            })
            .eq("id", currentBlock.id)

          if (updateError) {
            console.error("[v0] time_blocks update error:", updateError)
            throw updateError
          }

          setCurrentStatus("idle")
          setCurrentBlock(null)
          toast.success("Arbeitszeit beendet", {
            description: `${Math.floor(netMinutes / 60)}h ${netMinutes % 60}min gearbeitet`,
          })
        }
      } else if (stampAction === "pause_start") {
        // Pause beginnen
        if (currentBlock) {
          await supabase.from("time_block_breaks").insert({
            time_block_id: currentBlock.id,
            start_time: now,
          })

          setCurrentStatus("break")
          toast.success("Pause gestartet")
        }
      } else if (stampAction === "pause_end") {
        // Pause beenden
        if (currentBlock) {
          // Finde offene Pause
          const { data: openBreak } = await supabase
            .from("time_block_breaks")
            .select("*")
            .eq("time_block_id", currentBlock.id)
            .is("end_time", null)
            .single()

          if (openBreak) {
            const breakStart = parseISO(openBreak.start_time)
            const breakEnd = new Date()
            const breakMinutes = differenceInMinutes(breakEnd, breakStart)

            await supabase
              .from("time_block_breaks")
              .update({
                end_time: now,
                duration_minutes: breakMinutes,
              })
              .eq("id", openBreak.id)

            // Update Gesamtpause im Block
            await supabase
              .from("time_blocks")
              .update({
                break_minutes: (currentBlock.break_minutes || 0) + breakMinutes,
              })
              .eq("id", currentBlock.id)
          }

          setCurrentStatus("working")
          toast.success("Pause beendet")
        }
      }

      // Refresh Status
      await loadCurrentStatus()

      setShowStampDialog(false)
      setStampComment("")
    } catch (error: any) {
      console.error("[v0] Stamp error:", error)
      toast.error("Fehler beim Stempeln", {
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
      })
    } finally {
      setIsStamping(false)
    }
  }

  // Korrekturantrag erstellen
  const submitCorrectionRequest = async () => {
    if (!practiceId || !user?.id || !correctionBlock) {
      toast.error("Korrekturantrag kann nicht erstellt werden", {
        description: "Fehlende Daten. Bitte versuchen Sie es erneut.",
      })
      return
    }

    if (!correctionReason.trim()) {
      toast.error("Begründung erforderlich", {
        description: "Bitte geben Sie einen Grund für die Korrektur an.",
      })
      return
    }

    try {
      await supabase.from("time_correction_requests").insert({
        practice_id: practiceId,
        user_id: user.id,
        time_block_id: correctionBlock.id,
        correction_type: "modify_time",
        requested_changes: {
          old_start: correctionBlock.start_time,
          old_end: correctionBlock.end_time,
          new_start: correctionNewStart || correctionBlock.start_time,
          new_end: correctionNewEnd || correctionBlock.end_time,
        },
        reason: correctionReason,
        status: "pending",
      })

      toast.success("Korrekturantrag eingereicht", {
        description: "Wartet auf Freigabe durch die Praxisleitung",
      })

      setShowCorrectionDialog(false)
      setCorrectionBlock(null)
      setCorrectionReason("")
      setCorrectionNewStart("")
      setCorrectionNewEnd("")
      await loadCorrectionRequests()
    } catch (error) {
      console.error("Correction error:", error)
      toast.error("Fehler beim Einreichen")
    }
  }

  // Export-Funktionen
  const exportMonthlyReport = (format: "csv" | "pdf") => {
    // Generiere Export
    if (format === "csv") {
      const headers = ["Datum", "Start", "Ende", "Brutto", "Pause", "Netto", "Ort", "Status"]
      const rows = timeBlocks.map((b) => [
        b.date,
        b.start_time ? new Date(b.start_time).toLocaleTimeString("de-DE") : "",
        b.end_time ? new Date(b.end_time).toLocaleTimeString("de-DE") : "",
        b.actual_hours
          ? `${Math.floor(b.actual_hours)}:${String(Math.round((b.actual_hours % 1) * 60)).padStart(2, "0")}`
          : "", // Display actual_hours
        `${Math.floor((b.break_minutes || 0) / 60)}:${String((b.break_minutes || 0) % 60).padStart(2, "0")}`,
        b.actual_hours
          ? `${Math.floor(b.actual_hours)}:${String(Math.round((b.actual_hours % 1) * 60)).padStart(2, "0")}`
          : "", // Display actual_hours
        // Use block.location_type for the 'Ort' column
        b.location_type, // Use location_type
        b.status, // Use status
      ])

      const csv = [headers, ...rows].map((r) => r.join(";")).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `zeiterfassung_${format(selectedMonth, "yyyy-MM")}.csv`
      a.click()

      toast.success("CSV exportiert")
    }
  }

  // Format Minuten zu Stunden
  const formatMinutes = (minutes: number) => {
    const h = Math.floor(Math.abs(minutes) / 60)
    const m = Math.abs(minutes) % 60
    const sign = minutes < 0 ? "-" : ""
    return `${sign}${h}h ${m}min`
  }

  // Berechne aktuelle Arbeitszeit
  const getCurrentWorkDuration = () => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Zeiterfassung</h1>
          <p className="text-muted-foreground">Manipulationsarme Stechuhr mit KI-Plausibilitätsprüfung</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            <Shield className="h-3 w-3 mr-1" />
            Audit-geschützt
          </Badge>
          <Button variant="outline" size="sm" onClick={() => loadCurrentStatus()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
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
            <Edit2 className="h-4 w-4" />
            <span className="hidden sm:inline">Korrekturen</span>
            {correctionRequests.filter((c) => c.status === "pending").length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {correctionRequests.filter((c) => c.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auswertung" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Auswertung</span>
          </TabsTrigger>
        </TabsList>

        {/* Stechuhr Tab */}
        <TabsContent value="stechuhr" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Hauptkarte: Stechuhr */}
            <Card className="md:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span>Stechuhr</span>
                  <Badge
                    variant={
                      currentStatus === "working" ? "default" : currentStatus === "break" ? "secondary" : "outline"
                    }
                    className={cn(
                      "text-sm",
                      currentStatus === "working" && "bg-green-500",
                      currentStatus === "break" && "bg-yellow-500",
                    )}
                  >
                    {currentStatus === "working"
                      ? "Arbeitet"
                      : currentStatus === "break"
                        ? "Pause"
                        : "Nicht eingestempelt"}
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
                                <span className="ml-1">
                                  ({homeofficePolicy.allowed_days.map(getWeekDayLabel).join(", ")})
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-700">
                              {homeofficeCheckResult?.reason || "Heute nicht verfügbar"}
                            </div>
                          )}
                        </>
                      )}
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setShowPolicyDialog(true)}
                      >
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
                        {formatMinutes(getCurrentWorkDuration())}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Seit {currentBlock && format(parseISO(currentBlock.start_time), "HH:mm")} Uhr
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-5xl font-mono font-bold text-muted-foreground mb-2">--:--</div>
                      <div className="text-sm text-muted-foreground">Noch nicht eingestempelt</div>
                    </>
                  )}
                </div>

                {/* Arbeitsort Auswahl */}
                <div className="space-y-2">
                  <Label>Arbeitsort</Label>
                  {/* Updated WORK_LOCATIONS to iterate through the new array and show only the first 3 */}
                  <div className="grid grid-cols-3 gap-2">
                    {WORK_LOCATIONS.slice(0, 3).map((loc) => {
                      const Icon = loc.icon
                      const isHomeoffice = loc.value === "homeoffice"
                      const isDisabled =
                        currentStatus !== "idle" ||
                        (isHomeoffice && homeofficeCheckResult && !homeofficeCheckResult.allowed)

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
                  {/* Updated to show remaining WORK_LOCATIONS */}
                  <div className="grid grid-cols-2 gap-2">
                    {WORK_LOCATIONS.slice(3).map((loc) => {
                      const Icon = loc.icon
                      return (
                        <Button
                          key={loc.value}
                          variant={selectedLocation === loc.value ? "default" : "outline"}
                          className="flex-col h-auto py-3"
                          onClick={() => setSelectedLocation(loc.value)}
                          disabled={currentStatus !== "idle"}
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
                      onClick={() => {
                        setStampAction("start")
                        setShowStampDialog(true)
                      }}
                    >
                      <Play className="h-6 w-6 mr-2" />
                      Einstempeln
                    </Button>
                  ) : (
                    <>
                      {currentStatus === "working" ? (
                        <Button
                          size="lg"
                          variant="secondary"
                          className="h-16"
                          onClick={() => {
                            setStampAction("pause_start")
                            setShowStampDialog(true)
                          }}
                        >
                          <Coffee className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="secondary"
                          className="h-16 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                          onClick={() => {
                            setStampAction("pause_end")
                            setShowStampDialog(true)
                          }}
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Weiter
                        </Button>
                      )}
                      <Button
                        size="lg"
                        variant="destructive"
                        className="h-16"
                        onClick={() => {
                          setStampAction("stop")
                          setShowStampDialog(true)
                        }}
                      >
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
                          (currentStatus !== "idle" ? getCurrentWorkDuration() : 0),
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
                      <div
                        className={cn("text-2xl font-bold", overtimeBalance >= 0 ? "text-green-700" : "text-red-700")}
                      >
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
                {plausibilityIssues.filter((i) => i.user_id === user?.id).length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 font-medium mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Plausibilitäts-Hinweise
                    </div>
                    <ul className="text-sm text-yellow-600 space-y-1">
                      {plausibilityIssues
                        .filter((i) => i.user_id === user?.id)
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
        </TabsContent>

        {/* Team Live Tab */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team-Anwesenheit</CardTitle>
                  <CardDescription>Live-Übersicht aller Teammitglieder</CardDescription>
                </div>
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Alle anzeigen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle anzeigen</SelectItem>
                    <SelectItem value="working">Anwesend</SelectItem>
                    <SelectItem value="break">In Pause</SelectItem>
                    <SelectItem value="absent">Abwesend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers
                  .filter((m) => teamFilter === "all" || m.current_status === teamFilter)
                  .map((member) => {
                    // Updated to check against the new WORK_LOCATIONS array
                    const location = WORK_LOCATIONS.find((l) => l.value === member.current_location)
                    const LocationIcon = location?.icon || Building2

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-colors",
                          member.current_status === "working"
                            ? "border-green-200 bg-green-50"
                            : member.current_status === "break"
                              ? "border-yellow-200 bg-yellow-50"
                              : "border-gray-200 bg-gray-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>
                              {member.first_name?.[0]}
                              {member.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">
                              {member.first_name} {member.last_name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              {member.current_status === "working" ? (
                                <>
                                  <LocationIcon className="h-3 w-3" />
                                  {location?.label || "Arbeitet"}
                                </>
                              ) : member.current_status === "break" ? (
                                <>
                                  <Coffee className="h-3 w-3" />
                                  In Pause
                                </>
                              ) : (
                                "Nicht anwesend"
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={cn(
                                "text-lg font-bold",
                                member.current_status === "working"
                                  ? "text-green-600"
                                  : member.current_status === "break"
                                    ? "text-yellow-600"
                                    : "text-gray-400",
                              )}
                            >
                              {formatMinutes(member.today_minutes || 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">heute</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {teamMembers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Teammitglieder gefunden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Zeitkonto Tab */}
        <TabsContent value="zeitkonto" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mein Zeitkonto</CardTitle>
                  <CardDescription>Übersicht Ihrer Arbeitszeiten</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1)))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[140px] text-center font-medium">
                    {format(selectedMonth, "MMMM yyyy", { locale: de })}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSelectedMonth(new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1)))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Monatsstatistik */}
              {monthlyReport && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Arbeitstage</div>
                    <div className="text-2xl font-bold">{monthlyReport.total_work_days}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">Arbeitszeit</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatMinutes(monthlyReport.total_net_minutes)}
                    </div>
                  </div>
                  <div
                    className={cn("p-4 rounded-lg", monthlyReport.overtime_minutes >= 0 ? "bg-green-50" : "bg-red-50")}
                  >
                    <div
                      className={cn("text-sm", monthlyReport.overtime_minutes >= 0 ? "text-green-600" : "text-red-600")}
                    >
                      {monthlyReport.overtime_minutes >= 0 ? "Überstunden" : "Minderstunden"}
                    </div>
                    <div
                      className={cn(
                        "text-2xl font-bold",
                        monthlyReport.overtime_minutes >= 0 ? "text-green-700" : "text-red-700",
                      )}
                    >
                      {formatMinutes(monthlyReport.overtime_minutes)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">Homeoffice</div>
                    <div className="text-2xl font-bold text-purple-700">{monthlyReport.homeoffice_days} Tage</div>
                  </div>
                </div>
              )}

              {/* Zeitblöcke-Tabelle */}
              <ScrollArea className="h-[400px]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[100px]">Datum</TableHead>
                        <TableHead className="min-w-[70px]">Start</TableHead>
                        <TableHead className="min-w-[70px]">Ende</TableHead>
                        <TableHead className="min-w-[70px]">Pause</TableHead>
                        <TableHead className="min-w-[70px]">Netto</TableHead>
                        <TableHead className="min-w-[80px]">Ort</TableHead>
                        <TableHead className="min-w-[60px]">Status</TableHead>
                        <TableHead className="min-w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeBlocks.map((block) => {
                        // Use block.location_type to find the corresponding location details
                        const location = WORK_LOCATIONS.find((l) => l.value === block.location_type)

                        return (
                          <TableRow key={block.id}>
                            <TableCell className="font-medium">
                              {format(parseISO(block.date), "EEE, d.M.", { locale: de })}
                            </TableCell>
                            <TableCell>{format(parseISO(block.start_time), "HH:mm")}</TableCell>
                            <TableCell>
                              {block.end_time ? (
                                format(parseISO(block.end_time), "HH:mm")
                              ) : (
                                <Badge variant="secondary">Offen</Badge>
                              )}
                            </TableCell>
                            <TableCell>{block.break_minutes || 0} min</TableCell>
                            <TableCell className="font-mono">
                              {block.actual_hours ? formatMinutes(block.actual_hours * 60) : "-"}{" "}
                              {/* Display actual_hours */}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={location?.color}>
                                {/* Display location?.label or block.location_type for the location */}
                                {location?.label || block.location_type} {/* Use location_type */}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {block.status === "completed" ? ( // Check status for completion
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : block.status === "active" ? ( // Check status for active
                                <AlertTriangle className="h-4 w-4 text-yellow-500" /> // Indicating active might be a warning
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" /> // Indicating cancelled
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setCorrectionBlock(block)
                                      setCorrectionNewStart(block.start_time)
                                      setCorrectionNewEnd(block.end_time || "")
                                      setShowCorrectionDialog(true)
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Korrektur beantragen
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Korrekturen Tab */}
        <TabsContent value="korrekturen" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Korrekturanträge</CardTitle>
              <CardDescription>Anträge zur Änderung von Zeitbuchungen</CardDescription>
            </CardHeader>
            <CardContent>
              {correctionRequests.length > 0 ? (
                <div className="space-y-4">
                  {correctionRequests.map((request) => (
                    <div
                      key={request.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        request.status === "pending"
                          ? "border-yellow-200 bg-yellow-50"
                          : request.status === "approved"
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">
                            {request.correction_type === "modify_time" ? "Zeitkorrektur" : request.correction_type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(request.created_at), "d. MMMM yyyy, HH:mm", { locale: de })}
                          </div>
                          <div className="mt-2 text-sm">{request.reason}</div>
                        </div>
                        <Badge
                          variant={
                            request.status === "pending"
                              ? "secondary"
                              : request.status === "approved"
                                ? "default"
                                : "destructive"
                          }
                        >
                          {request.status === "pending"
                            ? "Ausstehend"
                            : request.status === "approved"
                              ? "Genehmigt"
                              : "Abgelehnt"}
                        </Badge>
                      </div>
                      {request.review_comment && (
                        <div className="mt-3 p-2 bg-white/50 rounded text-sm">
                          <span className="font-medium">Kommentar:</span> {request.review_comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Edit2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Keine Korrekturanträge vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auswertung Tab */}
        <TabsContent value="auswertung" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monatsbericht</CardTitle>
                  <CardDescription>{format(selectedMonth, "MMMM yyyy", { locale: de })}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportMonthlyReport("csv")}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                  <Button variant="outline" onClick={() => exportMonthlyReport("pdf")}>
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {monthlyReport && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Arbeitszeit-Übersicht</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Arbeitstage</span>
                        <span className="font-mono font-medium">{monthlyReport.total_work_days}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Gesamte Arbeitszeit</span>
                        <span className="font-mono font-medium">{formatMinutes(monthlyReport.total_net_minutes)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Durchschnitt pro Tag</span>
                        <span className="font-mono font-medium">
                          {monthlyReport.total_work_days > 0
                            ? formatMinutes(Math.round(monthlyReport.total_net_minutes / monthlyReport.total_work_days))
                            : "-"}
                        </span>
                      </div>
                      <div
                        className={cn(
                          "flex justify-between p-3 rounded",
                          monthlyReport.overtime_minutes >= 0 ? "bg-green-100" : "bg-red-100",
                        )}
                      >
                        <span>{monthlyReport.overtime_minutes >= 0 ? "Überstunden" : "Minderstunden"}</span>
                        <span
                          className={cn(
                            "font-mono font-medium",
                            monthlyReport.overtime_minutes >= 0 ? "text-green-700" : "text-red-700",
                          )}
                        >
                          {formatMinutes(monthlyReport.overtime_minutes)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Zusätzliche Informationen</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-purple-50 rounded">
                        <span>Homeoffice-Tage</span>
                        <span className="font-mono font-medium text-purple-700">{monthlyReport.homeoffice_days}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-muted/50 rounded">
                        <span>Korrekturen</span>
                        <span className="font-mono font-medium">{monthlyReport.corrections_count}</span>
                      </div>
                      {monthlyReport.plausibility_warnings > 0 && (
                        <div className="flex justify-between p-3 bg-yellow-100 rounded">
                          <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            Plausibilitäts-Hinweise
                          </span>
                          <span className="font-mono font-medium text-yellow-700">
                            {monthlyReport.plausibility_warnings}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stempel-Dialog */}
      <Dialog open={showStampDialog} onOpenChange={setShowStampDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {stampAction === "start"
                ? "Einstempeln"
                : stampAction === "stop"
                  ? "Ausstempeln"
                  : stampAction === "pause_start"
                    ? "Pause beginnen"
                    : "Pause beenden"}
            </DialogTitle>
            <DialogDescription>
              {stampAction === "start"
                ? `Arbeitszeit starten am ${WORK_LOCATIONS.find((l) => l.value === selectedLocation)?.label}`
                : "Bestätigen Sie Ihre Buchung"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <div className="text-3xl font-mono font-bold">{format(new Date(), "HH:mm")}</div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(), "EEEE, d. MMMM yyyy", { locale: de })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Kommentar (optional)</Label>
              <Textarea
                value={stampComment}
                onChange={(e) => setStampComment(e.target.value)}
                placeholder="z.B. Hausbesuch bei Patient X, Fortbildung..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStampDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleStamp}
              disabled={isStamping}
              className={cn(
                stampAction === "start" && "bg-green-600 hover:bg-green-700",
                stampAction === "stop" && "bg-red-600 hover:bg-red-700",
              )}
            >
              {isStamping && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Bestätigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Korrektur-Dialog */}
      <Dialog open={showCorrectionDialog} onOpenChange={setShowCorrectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Korrektur beantragen</DialogTitle>
            <DialogDescription>Änderungen müssen von der Praxisleitung genehmigt werden</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {correctionBlock && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <div>
                  <strong>Datum:</strong> {format(parseISO(correctionBlock.date), "d. MMMM yyyy", { locale: de })}
                </div>
                <div>
                  <strong>Aktuell:</strong> {format(parseISO(correctionBlock.start_time), "HH:mm")} -{" "}
                  {correctionBlock.end_time ? format(parseISO(correctionBlock.end_time), "HH:mm") : "offen"}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Neue Startzeit</Label>
                <Input
                  type="time"
                  value={correctionNewStart ? format(parseISO(correctionNewStart), "HH:mm") : ""}
                  onChange={(e) => setCorrectionNewStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Neue Endzeit</Label>
                <Input
                  type="time"
                  value={correctionNewEnd ? format(parseISO(correctionNewEnd), "HH:mm") : ""}
                  onChange={(e) => setCorrectionNewEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Begründung *</Label>
              <Textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                placeholder="Bitte begründen Sie die gewünschte Änderung..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCorrectionDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={submitCorrectionRequest} disabled={!correctionReason.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Antrag einreichen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPolicyDialog} onOpenChange={setShowPolicyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ihre Homeoffice-Regelung</DialogTitle>
            <DialogDescription>Details zu Ihrer persönlichen Homeoffice-Policy</DialogDescription>
          </DialogHeader>

          {homeofficePolicy ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={homeofficePolicy.is_allowed ? "default" : "secondary"}>
                    {homeofficePolicy.is_allowed ? "Erlaubt" : "Nicht erlaubt"}
                  </Badge>
                </div>
              </div>

              {homeofficePolicy.is_allowed && (
                <>
                  {homeofficePolicy.allowed_days && homeofficePolicy.allowed_days.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Erlaubte Tage</span>
                      <div className="flex flex-wrap gap-2">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                          <Badge
                            key={day}
                            variant={homeofficePolicy.allowed_days.includes(day) ? "default" : "outline"}
                            className="text-xs"
                          >
                            {getWeekDayLabel(day)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Maximale Tage pro Woche</span>
                    <div className="text-2xl font-bold text-primary">{homeofficePolicy.max_days_per_week || 0}</div>
                  </div>

                  {(homeofficePolicy.allowed_start_time || homeofficePolicy.allowed_end_time) && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Zeitfenster</span>
                      <div className="text-sm text-muted-foreground">
                        {homeofficePolicy.allowed_start_time || "00:00"} -{" "}
                        {homeofficePolicy.allowed_end_time || "23:59"} Uhr
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t space-y-2">
                    {homeofficePolicy.requires_reason && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Begründung erforderlich</span>
                      </div>
                    )}
                    {homeofficePolicy.requires_location_verification && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Standort-Verifizierung erforderlich</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!homeofficePolicy.is_allowed && (
                <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                  Homeoffice ist für Sie derzeit nicht freigegeben. Bitte wenden Sie sich an Ihren Administrator, wenn
                  Sie Fragen haben.
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center p-8">Keine Homeoffice-Regelung gefunden.</div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowPolicyDialog(false)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
