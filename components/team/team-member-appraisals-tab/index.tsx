"use client"

import { Loader2 } from "lucide-react"
import type { AppraisalsTabProps } from "./types"
import { useAppraisals } from "./hooks/use-appraisals"
import { AppraisalList } from "./appraisal-list"
import { AppraisalDialog } from "./appraisal-dialog"

export function TeamMemberAppraisalsTab(props: AppraisalsTabProps) {
  const { memberId, practiceId, memberName, isAdmin } = props
  const state = useAppraisals(props)

  if (!practiceId || !memberId) {
    return <div>Keine Praxis-ID oder Mitarbeiter-ID verfügbar</div>
  }

  if (state.loading && state.skills.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AppraisalList
        appraisals={state.appraisals}
        skills={state.skills}
        memberName={memberName}
        isAdmin={isAdmin}
        onNew={state.openNewDialog}
        onEdit={state.openEditDialog}
        onDelete={state.handleDelete}
      />

      <AppraisalDialog
        open={state.dialogOpen}
        onOpenChange={state.setDialogOpen}
        editingAppraisal={state.editingAppraisal}
        memberName={memberName}
        activeTab={state.activeTab}
        setActiveTab={state.setActiveTab}
        formData={state.formData}
        setFormData={state.setFormData}
        skills={state.skills}
        skillStats={state.skillStats}
        aiLoading={state.aiLoading}
        aiSuggestions={state.aiSuggestions}
        setAiSuggestions={state.setAiSuggestions}
        skillsLoading={state.skillsLoading}
        saving={state.saving}
        onSave={state.handleSave}
        onAIGenerate={state.handleAIGenerate}
        onSyncSkills={state.syncSkillsToSystem}
        onRefreshCompetencies={state.refreshCompetenciesFromSkills}
        calculateOverallRating={state.calculateOverallRating}
      />
    </div>
  )
}

export default TeamMemberAppraisalsTab
