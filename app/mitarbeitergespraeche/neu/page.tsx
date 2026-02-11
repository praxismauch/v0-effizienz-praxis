"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

// Import extracted tab components
import { MemberSelection } from "./components/member-selection"
import { PerformanceTab } from "./components/performance-tab"
import { SkillsTab } from "./components/skills-tab"
import { GoalsTab } from "./components/goals-tab"
import { DevelopmentTab } from "./components/development-tab"
import { FeedbackTab } from "./components/feedback-tab"
import { SummaryTab } from "./components/summary-tab"

// Import types
import type { TeamMember, FormData } from "./types"
import { DEFAULT_PERFORMANCE_AREAS } from "./types"

export default function NeueMitarbeitergespraechPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser } = useUser()

  const [step, setStep] = useState<"select-member" | "form">("select-member")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [activeTab, setActiveTab] = useState("performance")
  const [saving, setSaving] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [aiLoading, setAiLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    performance_areas: DEFAULT_PERFORMANCE_AREAS.map((a) => ({ ...a })),
    competencies: [],
    goals: [],
    development_plans: [],
    strengths: "",
    areas_for_improvement: "",
    achievements: "",
    challenges: "",
    employee_self_assessment: "",
    manager_comments: "",
    overall_rating: null,
    summary: "",
    career_aspirations: "",
    promotion_readiness: "",
    next_review_date: "",
    follow_up_actions: [],
  })

  const practiceId = currentPractice?.id?.toString()

  // Fetch team members
  useEffect(() => {
    if (!practiceId) return
    
    const fetchTeamMembers = async () => {
      setLoadingMembers(true)
      try {
        const res = await fetch(`/api/practices/${practiceId}/team-members`, {
          credentials: "include",
        })
        if (res.ok) {
          const data = await res.json()
          // Handle both array and object with team_members property
          const members = Array.isArray(data) ? data : (data?.team_members || data?.teamMembers || [])
          setTeamMembers(members)
        }
      } catch (error) {
        console.error("Failed to fetch team members:", error)
      } finally {
        setLoadingMembers(false)
      }
    }
    
    fetchTeamMembers()
  }, [practiceId])

  // Handle member selection
  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member)
    setStep("form")
  }

  // Handle form field changes
  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle save
  const handleSave = async () => {
    if (!practiceId || !selectedMember) return

    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/team-members/${selectedMember.id}/appraisals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employee_id: selectedMember.id,
          appraiser_id: currentUser?.teamMemberId,
          appraisal_type: "annual",
          appraisal_date: new Date().toISOString().split("T")[0],
          status: "completed",
          overall_rating: formData.overall_rating,
          performance_areas: formData.performance_areas,
          competencies: formData.competencies,
          new_goals: formData.goals,
          development_plan: formData.development_plans,
          strengths: formData.strengths,
          areas_for_improvement: formData.areas_for_improvement,
          achievements: formData.achievements,
          challenges: formData.challenges,
          employee_self_assessment: formData.employee_self_assessment,
          manager_comments: formData.manager_comments,
          career_aspirations: formData.career_aspirations,
          promotion_readiness: formData.promotion_readiness,
          next_review_date: formData.next_review_date,
          summary: formData.summary,
          follow_up_actions: formData.follow_up_actions,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      toast({
        title: "Erfolgreich gespeichert",
        description: "Das Mitarbeitergespräch wurde erfolgreich gespeichert.",
      })

      router.push("/mitarbeitergespraeche")
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Ein Fehler ist aufgetreten",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (practiceLoading) {
    return <AppLayout loading loadingMessage="Praxis wird geladen..." />
  }

  // Member selection step
  if (step === "select-member") {
    return (
      <MemberSelection
        teamMembers={teamMembers}
        loadingMembers={loadingMembers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectMember={handleSelectMember}
        onBack={() => router.push("/mitarbeitergespraeche")}
      />
    )
  }

  // Form step
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setStep("select-member")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mitarbeitergespräch</h1>
              <p className="text-muted-foreground">
                Gespräch mit {selectedMember?.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto gap-1">
            <TabsTrigger value="performance">Leistung</TabsTrigger>
            <TabsTrigger value="skills">Kompetenzen</TabsTrigger>
            <TabsTrigger value="goals">Ziele</TabsTrigger>
            <TabsTrigger value="development">Entwicklung</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <PerformanceTab
              performanceAreas={formData.performance_areas}
              onUpdate={(areas) => handleFormChange("performance_areas", areas)}
            />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsTab
              competencies={formData.competencies}
              onUpdate={(comps) => handleFormChange("competencies", comps)}
              onAIGenerate={() => {}}
              aiLoading={aiLoading}
            />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsTab
              goals={formData.goals}
              onUpdate={(goals) => handleFormChange("goals", goals)}
              onAIGenerate={() => {}}
              aiLoading={aiLoading}
              onAcceptSuggestion={(s) => {
                handleFormChange("goals", [...formData.goals, { ...s, status: "open" }])
              }}
            />
          </TabsContent>

          <TabsContent value="development">
            <DevelopmentTab
              plans={formData.development_plans}
              onUpdate={(plans) => handleFormChange("development_plans", plans)}
              onAIGenerate={() => {}}
              aiLoading={aiLoading}
              onAcceptSuggestion={(s) => {
                handleFormChange("development_plans", [...formData.development_plans, { ...s, status: "planned" }])
              }}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab
              strengths={formData.strengths}
              areasForImprovement={formData.areas_for_improvement}
              achievements={formData.achievements}
              challenges={formData.challenges}
              employeeSelfAssessment={formData.employee_self_assessment}
              managerComments={formData.manager_comments}
              onUpdate={handleFormChange}
            />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryTab
              overallRating={formData.overall_rating}
              summary={formData.summary}
              careerAspirations={formData.career_aspirations}
              promotionReadiness={formData.promotion_readiness}
              nextReviewDate={formData.next_review_date}
              followUpActions={formData.follow_up_actions}
              onUpdate={handleFormChange}
              onAIGenerate={() => {}}
              aiLoading={aiLoading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
