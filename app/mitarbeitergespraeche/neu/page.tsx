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
import type { TeamMember, FormData, Goal, DevelopmentPlan } from "./types"

export default function NeueMitarbeitergespraechPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentPractice, loading: practiceLoading } = usePractice()
  const { user } = useUser()

  const [step, setStep] = useState<"select-member" | "form">("select-member")
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [activeTab, setActiveTab] = useState("performance")
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    performance_rating: 3,
    performance_notes: "",
    skills: [],
    goals: [],
    development_plans: [],
    feedback_employee: "",
    feedback_manager: "",
    next_steps: "",
    next_meeting_date: "",
  })

  const practiceId = currentPractice?.id?.toString()

  // Handle member selection
  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member)
    setStep("form")
  }

  // Handle form field changes
  const handleFormChange = useCallback((field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Handle adding a goal
  const handleAddGoal = useCallback((goal: Goal) => {
    setFormData((prev) => ({
      ...prev,
      goals: [...prev.goals, goal],
    }))
  }, [])

  // Handle removing a goal
  const handleRemoveGoal = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }))
  }, [])

  // Handle adding a development plan
  const handleAddDevelopmentPlan = useCallback((plan: DevelopmentPlan) => {
    setFormData((prev) => ({
      ...prev,
      development_plans: [...prev.development_plans, plan],
    }))
  }, [])

  // Handle removing a development plan
  const handleRemoveDevelopmentPlan = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      development_plans: prev.development_plans.filter((_, i) => i !== index),
    }))
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
          ...formData,
          employee_id: selectedMember.id,
          appraiser_id: user?.teamMemberId,
          appraisal_date: new Date().toISOString().split("T")[0],
          status: "completed",
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
        practiceId={practiceId}
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
              rating={formData.performance_rating}
              notes={formData.performance_notes}
              onRatingChange={(value) => handleFormChange("performance_rating", value)}
              onNotesChange={(value) => handleFormChange("performance_notes", value)}
            />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsTab
              skills={formData.skills}
              onSkillsChange={(value) => handleFormChange("skills", value)}
            />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsTab
              goals={formData.goals}
              onAddGoal={handleAddGoal}
              onRemoveGoal={handleRemoveGoal}
            />
          </TabsContent>

          <TabsContent value="development">
            <DevelopmentTab
              plans={formData.development_plans}
              onAddPlan={handleAddDevelopmentPlan}
              onRemovePlan={handleRemoveDevelopmentPlan}
            />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackTab
              employeeFeedback={formData.feedback_employee}
              managerFeedback={formData.feedback_manager}
              onEmployeeFeedbackChange={(value) => handleFormChange("feedback_employee", value)}
              onManagerFeedbackChange={(value) => handleFormChange("feedback_manager", value)}
            />
          </TabsContent>

          <TabsContent value="summary">
            <SummaryTab
              formData={formData}
              member={selectedMember}
              nextSteps={formData.next_steps}
              nextMeetingDate={formData.next_meeting_date}
              onNextStepsChange={(value) => handleFormChange("next_steps", value)}
              onNextMeetingDateChange={(value) => handleFormChange("next_meeting_date", value)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
