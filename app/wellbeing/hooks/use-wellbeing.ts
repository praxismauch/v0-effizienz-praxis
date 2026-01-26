"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import type {
  MoodSurvey,
  MoodResponse,
  WorkloadAnalysis,
  WellbeingSuggestion,
  Kudos,
  TeamMember,
  KudosForm,
} from "../types"

interface UseWellbeingProps {
  practiceId: string | undefined
  userId: string | undefined
}

export function useWellbeing({ practiceId, userId }: UseWellbeingProps) {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)

  // State for mood surveys
  const [surveys, setSurveys] = useState<MoodSurvey[]>([])
  const [activeSurvey, setActiveSurvey] = useState<MoodSurvey | null>(null)

  // State for mood response form
  const [moodResponse, setMoodResponse] = useState<MoodResponse>({
    energy_level: 3,
    stress_level: 3,
    work_satisfaction: 3,
    team_harmony: 3,
    work_life_balance: 3,
    leadership_support: 3,
    growth_opportunities: 3,
    workload_fairness: 3,
  })
  const [positiveFeedback, setPositiveFeedback] = useState("")
  const [improvementSuggestions, setImprovementSuggestions] = useState("")
  const [concerns, setConcerns] = useState("")
  const [isSubmittingMood, setIsSubmittingMood] = useState(false)
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false)

  // State for workload analysis
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis | null>(null)
  const [isAnalyzingWorkload, setIsAnalyzingWorkload] = useState(false)

  // State for suggestions
  const [suggestions, setSuggestions] = useState<WellbeingSuggestion[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  // State for kudos
  const [kudosList, setKudosList] = useState<Kudos[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [kudosForm, setKudosForm] = useState<KudosForm>({
    to_user_id: "",
    category: "",
    message: "",
    is_anonymous: false,
  })
  const [isSubmittingKudos, setIsSubmittingKudos] = useState(false)

  // Aggregated mood data
  const [moodTrends, setMoodTrends] = useState<any[]>([])
  const [moodAverages, setMoodAverages] = useState<MoodResponse | null>(null)

  const loadSurveys = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/surveys`)
      if (res.ok) {
        const data = await res.json()
        setSurveys(data.surveys || [])
        const active = data.surveys?.find((s: MoodSurvey) => s.is_active)
        setActiveSurvey(active || null)
      }
    } catch (error) {
      console.error("Error loading surveys:", error)
    }
  }, [practiceId])

  const loadMoodData = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/mood-data`)
      if (res.ok) {
        const data = await res.json()
        setMoodTrends(data.trends || [])
        setMoodAverages(data.averages || null)
        setHasSubmittedToday(data.hasSubmittedToday || false)
      }
    } catch (error) {
      console.error("Error loading mood data:", error)
    }
  }, [practiceId])

  const loadWorkloadAnalysis = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/workload-analysis`)
      if (res.ok) {
        const data = await res.json()
        setWorkloadAnalysis(data.analysis || null)
      }
    } catch (error) {
      console.error("Error loading workload analysis:", error)
    }
  }, [practiceId])

  const loadSuggestions = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/suggestions`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error("Error loading suggestions:", error)
    }
  }, [practiceId])

  const loadKudos = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/kudos`)
      if (res.ok) {
        const data = await res.json()
        setKudosList(data.kudos || [])
      }
    } catch (error) {
      console.error("Error loading kudos:", error)
    }
  }, [practiceId])

  const loadTeamMembers = useCallback(async () => {
    if (!practiceId) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members`)
      if (res.ok) {
        const data = await res.json()
        setTeamMembers(data || [])
      }
    } catch (error) {
      console.error("Error loading team members:", error)
    }
  }, [practiceId])

  const loadAllData = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        loadSurveys(),
        loadMoodData(),
        loadWorkloadAnalysis(),
        loadSuggestions(),
        loadKudos(),
        loadTeamMembers(),
      ])
    } catch (error) {
      console.error("Error loading all data:", error)
    }
    setIsLoading(false)
  }, [loadSurveys, loadMoodData, loadWorkloadAnalysis, loadSuggestions, loadKudos, loadTeamMembers])

  useEffect(() => {
    if (practiceId) {
      loadAllData()
    } else {
      setIsLoading(false)
    }
  }, [practiceId, loadAllData])

  const handleSubmitMoodResponse = async () => {
    if (!practiceId) return

    setIsSubmittingMood(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/mood-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_id: activeSurvey?.id,
          ...moodResponse,
          positive_feedback: positiveFeedback,
          improvement_suggestions: improvementSuggestions,
          concerns,
        }),
      })

      if (res.ok) {
        toast({
          title: "Feedback gesendet",
          description: "Vielen Dank für Ihr anonymes Feedback!",
        })
        setHasSubmittedToday(true)
        setPositiveFeedback("")
        setImprovementSuggestions("")
        setConcerns("")
        loadMoodData()
      } else {
        throw new Error("Failed to submit")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Feedback konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingMood(false)
    }
  }

  const handleAnalyzeWorkload = async () => {
    if (!practiceId) return

    setIsAnalyzingWorkload(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/analyze-workload`, {
        method: "POST",
      })

      if (res.ok) {
        const data = await res.json()
        setWorkloadAnalysis(data.analysis)
        toast({
          title: "Analyse abgeschlossen",
          description: "Die Arbeitsbelastungs-Analyse wurde erstellt.",
        })
      } else {
        throw new Error("Failed to analyze")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Analyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzingWorkload(false)
    }
  }

  const handleGenerateSuggestions = async () => {
    if (!practiceId) return

    setIsGeneratingSuggestions(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/generate-suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood_averages: moodAverages,
          workload_analysis: workloadAnalysis,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestions([...suggestions, ...(data.suggestions || [])])
        toast({
          title: "Vorschläge generiert",
          description: "KI-basierte Wellbeing-Vorschläge wurden erstellt.",
        })
      } else {
        throw new Error("Failed to generate")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Vorschläge konnten nicht generiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  const handleSendKudos = async () => {
    if (!practiceId || !kudosForm.to_user_id || !kudosForm.category || !kudosForm.message) {
      toast({
        title: "Felder ausfüllen",
        description: "Bitte wählen Sie eine Person, Kategorie und schreiben Sie eine Nachricht.",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingKudos(true)
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/kudos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...kudosForm,
          from_user_id: userId,
        }),
      })

      if (res.ok) {
        toast({
          title: "Kudos gesendet!",
          description: "Ihre Anerkennung wurde gesendet.",
        })
        setKudosForm({
          to_user_id: "",
          category: "",
          message: "",
          is_anonymous: false,
        })
        loadKudos()
        return true
      } else {
        throw new Error("Failed to send kudos")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kudos konnten nicht gesendet werden.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsSubmittingKudos(false)
    }
  }

  const handleReactToKudos = async (kudosId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/kudos/${kudosId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      })

      if (res.ok) {
        loadKudos()
      }
    } catch (error) {
      console.error("Error reacting to kudos:", error)
    }
  }

  const handleMarkSuggestionImplemented = async (suggestionId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/wellbeing/suggestions/${suggestionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_implemented: true }),
      })

      if (res.ok) {
        setSuggestions((prev) =>
          prev.map((s) => (s.id === suggestionId ? { ...s, is_implemented: true } : s))
        )
        toast({
          title: "Vorschlag umgesetzt",
          description: "Der Vorschlag wurde als umgesetzt markiert.",
        })
      }
    } catch (error) {
      console.error("Error marking suggestion:", error)
    }
  }

  return {
    // State
    isLoading,
    surveys,
    activeSurvey,
    moodResponse,
    setMoodResponse,
    positiveFeedback,
    setPositiveFeedback,
    improvementSuggestions,
    setImprovementSuggestions,
    concerns,
    setConcerns,
    isSubmittingMood,
    hasSubmittedToday,
    workloadAnalysis,
    isAnalyzingWorkload,
    suggestions,
    isGeneratingSuggestions,
    kudosList,
    teamMembers,
    kudosForm,
    setKudosForm,
    isSubmittingKudos,
    moodTrends,
    moodAverages,

    // Actions
    handleSubmitMoodResponse,
    handleAnalyzeWorkload,
    handleGenerateSuggestions,
    handleSendKudos,
    handleReactToKudos,
    handleMarkSuggestionImplemented,
    loadAllData,
  }
}
