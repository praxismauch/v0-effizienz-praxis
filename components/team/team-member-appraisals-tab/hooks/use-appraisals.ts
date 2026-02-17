"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"
import { swrFetcher } from "@/lib/swr-fetcher"
import type { Appraisal, SkillDefinition, AiSuggestions, AppraisalsTabProps } from "../types"
import { DEFAULT_PERFORMANCE_AREAS } from "../types"

export function useAppraisals({ memberId, practiceId, memberName }: AppraisalsTabProps) {
  const { toast } = useToast()
  const [appraisals, setAppraisals] = useState<Appraisal[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAppraisal, setEditingAppraisal] = useState<Appraisal | null>(null)
  const [activeTab, setActiveTab] = useState("performance")
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestions>({})
  const [formData, setFormData] = useState<Partial<Appraisal>>({})
  const [skillsLoading] = useState(false)

  const { data: skillsData, mutate: mutateSkills } = useSWR<SkillDefinition[]>(
    practiceId && memberId ? `/api/practices/${practiceId}/team-members/${memberId}/skills` : null,
    swrFetcher,
  )
  const skills = Array.isArray(skillsData) ? skillsData : []

  const convertSkillsToCompetencies = useCallback((skillsData: SkillDefinition[]) => {
    const safeSkills = Array.isArray(skillsData) ? skillsData : []
    return safeSkills
      .filter((s) => s && (s.current_level !== null || s.target_level !== null))
      .map((skill) => ({
        skill_id: skill.id,
        name: skill.name,
        currentLevel: skill.current_level ?? 0,
        targetLevel: skill.target_level ?? 3,
        previousLevel: skill.current_level ?? 0,
        gap: (skill.target_level ?? 3) - (skill.current_level ?? 0),
      }))
  }, [])

  const handleAIGenerate = useCallback(
    async (action: string, context?: Record<string, unknown>) => {
      if (!practiceId || !memberId) return
      setAiLoading(action)
      try {
        const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals/ai-generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action, memberName, formData,
            skills: (Array.isArray(skills) ? skills : []).filter(Boolean).map((s) => ({
              name: s.name, category: s.category,
              currentLevel: s.current_level, targetLevel: s.target_level,
              gap: (s.target_level ?? 3) - (s.current_level ?? 0),
            })),
            ...context,
          }),
        })
        if (!res.ok) throw new Error("AI generation failed")
        const data = await res.json()
        switch (action) {
          case "summary": setFormData((prev) => ({ ...prev, summary: data.summary })); break
          case "goals": setAiSuggestions((prev) => ({ ...prev, goals: data.goals })); break
          case "development": setAiSuggestions((prev) => ({ ...prev, developmentActions: data.developmentActions })); break
          case "strengths": setAiSuggestions((prev) => ({ ...prev, strengths: data.strengths, improvements: data.improvements })); break
          case "feedback-strengths": setFormData((prev) => ({ ...prev, strengths: data.text })); break
          case "feedback-improvements": setFormData((prev) => ({ ...prev, areas_for_improvement: data.text })); break
          case "feedback-overall": setFormData((prev) => ({ ...prev, manager_comments: data.text })); break
          case "career": setAiSuggestions((prev) => ({ ...prev, careerSteps: data.careerSteps })); break
          case "skill-development": setAiSuggestions((prev) => ({ ...prev, developmentActions: data.developmentActions })); break
        }
        toast({ title: "Erfolgreich", description: "KI-Vorschlag generiert" })
      } catch {
        toast({ title: "Fehler", description: "KI-Generierung fehlgeschlagen", variant: "destructive" })
      } finally {
        setAiLoading(null)
      }
    },
    [practiceId, memberId, memberName, formData, skills, toast],
  )

  const loadAppraisals = useCallback(async () => {
    if (!practiceId || !memberId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals`)
      if (res.ok) { const data = await res.json(); setAppraisals(data) }
    } catch (error) {
      console.error("Failed to load appraisals:", error)
      toast({ title: "Fehler", description: "Gespraeche konnten nicht geladen werden", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [practiceId, memberId, toast])

  useEffect(() => { loadAppraisals() }, [loadAppraisals])

  const openNewDialog = () => {
    const competenciesFromSkills = convertSkillsToCompetencies(skills)
    setEditingAppraisal(null)
    setFormData({
      appraisal_type: "annual", appraisal_date: new Date().toISOString().split("T")[0],
      status: "draft", performance_areas: DEFAULT_PERFORMANCE_AREAS,
      competencies: competenciesFromSkills.length > 0 ? competenciesFromSkills : [],
      goals_review: [], new_goals: [], development_plan: [], follow_up_actions: [],
    })
    setAiSuggestions({})
    setActiveTab("performance")
    setDialogOpen(true)
  }

  const openEditDialog = (appraisal: Appraisal) => {
    setEditingAppraisal(appraisal)
    setFormData({
      ...appraisal,
      performance_areas: appraisal.performance_areas || DEFAULT_PERFORMANCE_AREAS,
      competencies: appraisal.competencies || convertSkillsToCompetencies(skills),
      goals_review: appraisal.goals_review || [],
      new_goals: appraisal.new_goals || [],
      development_plan: appraisal.development_plan || [],
      follow_up_actions: appraisal.follow_up_actions || [],
    })
    setAiSuggestions({})
    setActiveTab("performance")
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!practiceId || !memberId) return
    setSaving(true)
    try {
      const url = `/api/practices/${practiceId}/team-members/${memberId}/appraisals`
      const res = await fetch(url, {
        method: editingAppraisal ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAppraisal ? { ...formData, id: editingAppraisal.id } : formData),
      })
      if (!res.ok) throw new Error("Save failed")
      toast({ title: "Erfolgreich", description: "Mitarbeitergespraech gespeichert" })
      setDialogOpen(false)
      loadAppraisals()
    } catch {
      toast({ title: "Fehler", description: "Speichern fehlgeschlagen", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie dieses Gespräch wirklich löschen?")) return
    try {
      const res = await fetch(`/api/practices/${practiceId}/team-members/${memberId}/appraisals?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Delete failed")
      toast({ title: "Erfolgreich", description: "Gespräch gelöscht" })
      loadAppraisals()
    } catch {
      toast({ title: "Fehler", description: "Löschen fehlgeschlagen", variant: "destructive" })
    }
  }

  const calculateOverallRating = () => {
    const areas = formData.performance_areas || []
    if (areas.length === 0) return "0"
    const totalWeight = areas.reduce((sum, a) => sum + a.weight, 0)
    const weightedSum = areas.reduce((sum, a) => sum + a.rating * a.weight, 0)
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : "0"
  }

  const syncSkillsToSystem = async () => {
    if (!formData.competencies || formData.competencies.length === 0) return
    setAiLoading("sync-skills")
    try {
      for (const comp of formData.competencies) {
        if (comp.skill_id && comp.currentLevel !== comp.previousLevel) {
          await fetch(`/api/practices/${practiceId}/team-members/${memberId}/skills`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skill_id: comp.skill_id, current_level: comp.currentLevel,
              notes: `Aktualisiert im Mitarbeitergespraech am ${formData.appraisal_date}`,
            }),
          })
        }
      }
      toast({ title: "Erfolgreich", description: "Skills wurden im System aktualisiert" })
      await mutateSkills()
    } catch {
      toast({ title: "Fehler", description: "Skill-Synchronisation fehlgeschlagen", variant: "destructive" })
    } finally {
      setAiLoading(null)
    }
  }

  const refreshCompetenciesFromSkills = async () => {
    const competenciesFromSkills = convertSkillsToCompetencies(skills)
    if (competenciesFromSkills.length > 0) {
      setFormData((prev) => ({ ...prev, competencies: competenciesFromSkills }))
      toast({ title: "Aktualisiert", description: "Kompetenzen aus Skills geladen" })
    }
  }

  const skillStats = {
    total: skills.length,
    assessed: skills.filter((s) => s.current_level !== null && s.current_level !== undefined && s.current_level > 0).length,
    gapsCount: skills.filter((s) => s.target_level !== null && s.target_level !== undefined && s.current_level !== null && s.current_level !== undefined && s.target_level > s.current_level).length,
    avgLevel: skills.length > 0 ? (skills.reduce((sum, s) => sum + (s.current_level ?? 0), 0) / skills.length).toFixed(1) : "0",
    expertCount: skills.filter((s) => s.current_level === 3).length,
  }

  return {
    appraisals, loading, dialogOpen, setDialogOpen, editingAppraisal,
    activeTab, setActiveTab, saving, aiLoading, aiSuggestions, setAiSuggestions,
    formData, setFormData, skills, skillsLoading, skillStats,
    handleAIGenerate, openNewDialog, openEditDialog, handleSave, handleDelete,
    calculateOverallRating, syncSkillsToSystem, refreshCompetenciesFromSkills,
  }
}
