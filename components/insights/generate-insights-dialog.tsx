"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  startOfWeek,
  endOfWeek,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns"
import { de } from "date-fns/locale"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  Target,
  FileText,
  ExternalLink,
  Zap,
  Brain,
  Heart,
  Users,
  Scale,
  Smile,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  kpiCount: number
  onGenerated: () => void
}

interface ExistingJournalInfo {
  id: string
  message: string
}

const SELF_CHECK_DIMENSIONS = [
  {
    key: "energy_level",
    label: "Energielevel",
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Wie energiegeladen fühlen Sie sich?",
    lowLabel: "Erschöpft",
    highLabel: "Voller Energie",
  },
  {
    key: "stress_level",
    label: "Stresslevel",
    icon: Brain,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    description: "Wie gestresst fühlen Sie sich?",
    lowLabel: "Entspannt",
    highLabel: "Sehr gestresst",
    inverted: true,
  },
  {
    key: "work_satisfaction",
    label: "Arbeitszufriedenheit",
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    description: "Wie zufrieden sind Sie mit Ihrer Arbeit?",
    lowLabel: "Unzufrieden",
    highLabel: "Sehr zufrieden",
  },
  {
    key: "team_harmony",
    label: "Team-Harmonie",
    icon: Users,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Wie harmonisch ist die Zusammenarbeit?",
    lowLabel: "Angespannt",
    highLabel: "Harmonisch",
  },
  {
    key: "work_life_balance",
    label: "Work-Life-Balance",
    icon: Scale,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Wie gut ist Ihre Work-Life-Balance?",
    lowLabel: "Unausgeglichen",
    highLabel: "Ausgeglichen",
  },
  {
    key: "motivation",
    label: "Motivation",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Wie motiviert fühlen Sie sich?",
    lowLabel: "Unmotiviert",
    highLabel: "Hoch motiviert",
  },
  {
    key: "overall_wellbeing",
    label: "Allgemeines Wohlbefinden",
    icon: Smile,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    description: "Wie würden Sie Ihr Wohlbefinden bewerten?",
    lowLabel: "Schlecht",
    highLabel: "Ausgezeichnet",
  },
]

interface SelfCheckData {
  [key: string]: number
}

export function GenerateJournalDialog({ open, onOpenChange, practiceId, kpiCount, onGenerated }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [periodType, setPeriodType] = useState<"weekly" | "monthly" | "quarterly" | "yearly">("monthly")
  const [periodOffset, setPeriodOffset] = useState(1)
  const [userNotes, setUserNotes] = useState("")
  const { user } = useAuth()
  const { currentUser } = useUser()

  const [existingJournal, setExistingJournal] = useState<ExistingJournalInfo | null>(null)

  const [includeSelfCheck, setIncludeSelfCheck] = useState(false)
  const [includeKpis, setIncludeKpis] = useState(true)
  const [includeTeamData, setIncludeTeamData] = useState(true)
  const [generateActionPlan, setGenerateActionPlan] = useState(true)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [selfCheckData, setSelfCheckData] = useState<SelfCheckData>({
    energy_level: 5,
    stress_level: 5,
    work_satisfaction: 5,
    team_harmony: 5,
    work_life_balance: 5,
    motivation: 5,
    overall_wellbeing: 5,
  })

  // Load saved journal preferences
  useEffect(() => {
    if (!open || preferencesLoaded) return
    const effectivePracticeId = practiceId || currentUser?.practice_id
    if (!effectivePracticeId) return

    fetch(`/api/practices/${effectivePracticeId}/insights/preferences`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((prefs) => {
        if (prefs) {
          if (prefs.frequency) setPeriodType(prefs.frequency)
          if (typeof prefs.include_kpis === "boolean") setIncludeKpis(prefs.include_kpis)
          if (typeof prefs.include_team_data === "boolean") setIncludeTeamData(prefs.include_team_data)
          if (typeof prefs.include_self_check === "boolean") setIncludeSelfCheck(prefs.include_self_check)
          if (typeof prefs.generate_action_plan === "boolean") setGenerateActionPlan(prefs.generate_action_plan)
        }
        setPreferencesLoaded(true)
      })
      .catch(() => setPreferencesLoaded(true))
  }, [open, preferencesLoaded, practiceId, currentUser?.practice_id])

  const getPeriodDates = () => {
    const now = new Date()
    let start: Date, end: Date

    switch (periodType) {
      case "weekly":
        const targetWeek = subWeeks(now, periodOffset)
        start = startOfWeek(targetWeek, { weekStartsOn: 1 })
        end = endOfWeek(targetWeek, { weekStartsOn: 1 })
        break
      case "monthly":
        const targetMonth = subMonths(now, periodOffset)
        start = startOfMonth(targetMonth)
        end = endOfMonth(targetMonth)
        break
      case "quarterly":
        const targetQuarter = subQuarters(now, periodOffset)
        start = startOfQuarter(targetQuarter)
        end = endOfQuarter(targetQuarter)
        break
      case "yearly":
        const targetYear = subYears(now, periodOffset)
        start = startOfYear(targetYear)
        end = endOfYear(targetYear)
        break
    }

    return { start, end }
  }

  const { start, end } = getPeriodDates()

  const handleGenerate = async () => {
    setGenerating(true)
    setProgress(10)
    setExistingJournal(null)

    try {
      if (!user) throw new Error("Not authenticated")

      const effectivePracticeId = practiceId || currentUser?.practice_id

      if (!effectivePracticeId) {
        throw new Error("Keine Praxis zugeordnet. Bitte laden Sie die Seite neu.")
      }

      setProgress(20)

      // Fetch all context data from API
      const dataResponse = await fetch(
        `/api/practices/${effectivePracticeId}/insights/data?period_start=${format(start, "yyyy-MM-dd")}&period_end=${format(end, "yyyy-MM-dd")}`
      )
      
      if (!dataResponse.ok) {
        throw new Error("Failed to fetch insights data")
      }

      const { kpis, teamMembers, goals, workflows, parameterValues: values } = await dataResponse.json()

      setProgress(50)

      // Save self-check if enabled
      if (includeSelfCheck && user?.id) {
        const overallScore = calculateOverallScore()
        await fetch(`/api/practices/${effectivePracticeId}/insights/data`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment_date: format(new Date(), "yyyy-MM-dd"),
            ...selfCheckData,
            overall_score: overallScore,
          }),
        })
      }

      setProgress(70)

      // Generate AI analysis (respecting journal preferences)
      const response = await fetch("/api/practice-insights/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId: effectivePracticeId,
          periodType,
          periodStart: format(start, "yyyy-MM-dd"),
          periodEnd: format(end, "yyyy-MM-dd"),
          userNotes,
          kpis: includeKpis ? kpis : [],
          parameterValues: includeKpis ? values : [],
          teamMembers: includeTeamData ? teamMembers : [],
          goals,
          workflows,
          selfCheckData: includeSelfCheck ? selfCheckData : null,
          generateActionPlan,
        }),
      })

      setProgress(90)

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 409 && errorData.existingJournalId) {
          setGenerating(false)
          setProgress(0)
          setExistingJournal({
            id: errorData.existingJournalId,
            message: errorData.error,
          })
          return
        }

        throw new Error(errorData.error || "Failed to generate journal")
      }

      setProgress(100)

      toast({
        title: "Journal erstellt",
        description: includeSelfCheck
          ? "Ihr Praxis-Journal mit Selbst-Check wurde erfolgreich generiert."
          : "Ihr Praxis-Journal wurde erfolgreich generiert.",
      })

      setTimeout(() => {
        onGenerated()
        setStep(1)
        setProgress(0)
        setUserNotes("")
        setExistingJournal(null)
        setIncludeSelfCheck(false)
        setPreferencesLoaded(false)
        setSelfCheckData({
          energy_level: 5,
          stress_level: 5,
          work_satisfaction: 5,
          team_harmony: 5,
          work_life_balance: 5,
          motivation: 5,
          overall_wellbeing: 5,
        })
      }, 500)
    } catch (error: any) {
      console.error("Error generating journal:", error)
      toast({
        title: "Fehler",
        description: error.message || "Das Journal konnte nicht generiert werden.",
        variant: "destructive",
      })
      setGenerating(false)
      setProgress(0)
    }
  }

  const calculateOverallScore = () => {
    const values = SELF_CHECK_DIMENSIONS.map((d) => {
      const value = selfCheckData[d.key]
      return d.inverted ? 11 - value : value
    })
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const handleOpenExistingJournal = () => {
    if (existingJournal) {
      onOpenChange(false)
      toast({
        title: "Journal bereits vorhanden",
        description: "Ein Journal für diesen Zeitraum existiert bereits.",
      })
    }
  }

  const handleTryDifferentPeriod = () => {
    setExistingJournal(null)
    setStep(1)
  }

  const renderExistingJournalConflict = () => (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Journal bereits vorhanden</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">{existingJournal?.message}</p>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button onClick={handleOpenExistingJournal} className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Vorhandenes Journal öffnen
        </Button>
        <Button variant="outline" onClick={handleTryDifferentPeriod} className="w-full bg-transparent">
          Anderen Zeitraum wählen
        </Button>
        <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
          Abbrechen
        </Button>
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-6">
      {kpiCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Empfehlung:</strong> Für ein aussagekräftiges Journal mit detaillierten Analysen sollten Sie zuerst
            Kennzahlen in der Auswertung definieren.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Berichtszeitraum</Label>
        <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Wochenbericht</SelectItem>
            <SelectItem value="monthly">Monatsbericht</SelectItem>
            <SelectItem value="quarterly">Quartalsbericht</SelectItem>
            <SelectItem value="yearly">Jahresbericht</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Zeitraum</Label>
        <Select value={periodOffset.toString()} onValueChange={(v) => setPeriodOffset(Number.parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">
              {periodType === "weekly"
                ? "Letzte Woche"
                : periodType === "monthly"
                  ? "Letzter Monat"
                  : periodType === "quarterly"
                    ? "Letztes Quartal"
                    : "Letztes Jahr"}
            </SelectItem>
            <SelectItem value="2">
              {periodType === "weekly"
                ? "Vorletzte Woche"
                : periodType === "monthly"
                  ? "Vorletzter Monat"
                  : periodType === "quarterly"
                    ? "Vorletztes Quartal"
                    : "Vorletztes Jahr"}
            </SelectItem>
            <SelectItem value="3">
              {periodType === "weekly"
                ? "Vor 3 Wochen"
                : periodType === "monthly"
                  ? "Vor 3 Monaten"
                  : periodType === "quarterly"
                    ? "Vor 3 Quartalen"
                    : "Vor 3 Jahren"}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Ausgewählter Zeitraum: {format(start, "dd.MM.yyyy", { locale: de })} -{" "}
          {format(end, "dd.MM.yyyy", { locale: de })}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <BarChart3 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{kpiCount}</p>
          <p className="text-xs text-muted-foreground">KPIs definiert</p>
        </div>
        <div className="text-center">
          <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
          <p className="text-2xl font-bold">--</p>
          <p className="text-xs text-muted-foreground">Datenpunkte</p>
        </div>
        <div className="text-center">
          <Target className="h-8 w-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold">--</p>
          <p className="text-xs text-muted-foreground">Ziele aktiv</p>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Ihre Notizen und Beobachtungen (optional)</Label>
        <Textarea
          placeholder="Fügen Sie hier persönliche Notizen, besondere Ereignisse oder Beobachtungen hinzu..."
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="p-4 border rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base font-medium flex items-center gap-2">
              <Smile className="h-5 w-5 text-cyan-500" />
              Selbst-Check hinzufügen
            </Label>
            <p className="text-sm text-muted-foreground">Dokumentieren Sie Ihr persönliches Wohlbefinden im Journal</p>
          </div>
          <Switch checked={includeSelfCheck} onCheckedChange={setIncludeSelfCheck} />
        </div>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Die KI wird folgende Analysen erstellen:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Zusammenfassung der wichtigsten Entwicklungen</li>
          <li>KPI-Analyse mit Trends und Vergleichen</li>
          <li>Team- und Personalentwicklung</li>
          {includeSelfCheck && (
            <li className="text-cyan-600 dark:text-cyan-400">Wohlbefindens-Analyse und Empfehlungen</li>
          )}
          <li>Konkrete Handlungsempfehlungen als Aktionsplan</li>
        </ul>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="mx-auto w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-2">
          <Smile className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
        </div>
        <h3 className="font-semibold">Selbst-Check</h3>
        <p className="text-sm text-muted-foreground">
          Bewerten Sie Ihr aktuelles Wohlbefinden auf einer Skala von 1-10
        </p>
      </div>

      <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
        {SELF_CHECK_DIMENSIONS.map((dimension) => {
          const Icon = dimension.icon
          return (
            <div key={dimension.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${dimension.bgColor}`}>
                    <Icon className={`h-4 w-4 ${dimension.color}`} />
                  </div>
                  <span className="font-medium text-sm">{dimension.label}</span>
                </div>
                <span className="text-lg font-bold tabular-nums">{selfCheckData[dimension.key]}</span>
              </div>
              <Slider
                value={[selfCheckData[dimension.key]]}
                onValueChange={([value]) => setSelfCheckData((prev) => ({ ...prev, [dimension.key]: value }))}
                min={1}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{dimension.lowLabel}</span>
                <span>{dimension.highLabel}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Gesamtbewertung</span>
          <span className="text-xl font-bold text-cyan-600 dark:text-cyan-400">
            {calculateOverallScore().toFixed(1)}/10
          </span>
        </div>
      </div>
    </div>
  )

  const renderGenerating = () => (
    <div className="space-y-6 py-8">
      <div className="text-center">
        <Sparkles className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
        <h3 className="text-lg font-semibold mb-2">Journal wird generiert...</h3>
        <p className="text-muted-foreground mb-4">
          Die KI analysiert Ihre Praxisdaten und erstellt einen umfassenden Bericht.
        </p>
      </div>
      <Progress value={progress} className="w-full" />
      <div className="flex justify-center gap-8 text-sm text-muted-foreground">
        <span className={progress >= 20 ? "text-green-500" : ""}>
          {progress >= 20 ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : null}
          Daten laden
        </span>
        <span className={progress >= 50 ? "text-green-500" : ""}>
          {progress >= 50 ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : null}
          Analyse
        </span>
        <span className={progress >= 90 ? "text-green-500" : ""}>
          {progress >= 90 ? <CheckCircle2 className="h-4 w-4 inline mr-1" /> : null}
          Bericht erstellen
        </span>
      </div>
    </div>
  )

  const totalSteps = includeSelfCheck ? 3 : 2
  const isLastStep = step === totalSteps

  const handleNext = () => {
    if (isLastStep) {
      handleGenerate()
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {existingJournal ? "Journal existiert bereits" : "Neues Praxis-Journal erstellen"}
          </DialogTitle>
          <DialogDescription>
            {existingJournal
              ? "Für diesen Zeitraum wurde bereits ein Journal erstellt."
              : generating
                ? "Bitte warten Sie, während Ihr Journal generiert wird."
                : step === 1
                  ? "Schritt 1: Wählen Sie den Zeitraum für Ihr Journal."
                  : step === 2
                    ? "Schritt 2: Fügen Sie optionale Notizen hinzu."
                    : "Schritt 3: Selbst-Check - Bewerten Sie Ihr Wohlbefinden."}
          </DialogDescription>
        </DialogHeader>

        {existingJournal
          ? renderExistingJournalConflict()
          : generating
            ? renderGenerating()
            : step === 1
              ? renderStep1()
              : step === 2
                ? renderStep2()
                : renderStep3()}

        {!generating && !existingJournal && (
          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Zurück
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleNext} disabled={!user}>
              {isLastStep ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Journal generieren
                </>
              ) : (
                "Weiter"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default GenerateJournalDialog
