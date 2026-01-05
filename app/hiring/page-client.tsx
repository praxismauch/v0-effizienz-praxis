"use client"

import { useState } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobPostingsManager } from "@/components/hiring/job-postings-manager"
import CandidatesManager from "@/components/hiring/candidates-manager"
import { HiringPipeline } from "@/components/hiring/hiring-pipeline"
import { InterviewTemplatesManager } from "@/components/hiring/interview-templates-manager"
import { QuestionnaireManager } from "@/components/hiring/questionnaire-manager"
import { RecruitingSettings } from "@/components/hiring/recruiting-settings"
import { AIRecruitingAnalysisDialog } from "@/components/hiring/ai-recruiting-analysis-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Users, Kanban, FileText, ClipboardList, Settings, Sparkles } from "lucide-react"
import { AppLayout } from "@/components/app-layout"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface HiringCounts {
  jobPostings: number
  candidates: number
  pipeline: number
  archived: number
  questionnaires: number
  interviews: number
}

export default function HiringPageClient() {
  const { t } = useTranslation()
  const { currentPractice } = usePractice()
  const { user, isLoading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState("postings")
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const { data: counts } = useSWR<HiringCounts>(
    currentPractice?.id ? `/api/hiring/counts?practiceId=${currentPractice.id}` : null,
    fetcher,
    { refreshInterval: 30000 },
  )

  if (userLoading) {
    return <AppLayout loading loadingMessage="Laden..." />
  }

  if (!currentPractice?.id) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold mb-2">{t("hiring.noPractice", "Keine Praxis ausgewählt")}</h2>
            <p className="text-muted-foreground text-center">
              {t("hiring.selectPractice", "Bitte wählen Sie eine Praxis aus, um das Recruiting zu verwalten.")}
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  const CountBadge = ({ count }: { count?: number }) => {
    if (count === undefined || count === 0) return null
    return (
      <Badge variant="secondary" className="ml-1.5 h-5 min-w-[20px] px-1.5 text-xs font-medium">
        {count}
      </Badge>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("hiring.title", "Recruiting")}</h1>
            <p className="text-muted-foreground">
              {t("hiring.description", "Verwalten Sie Stellenausschreibungen, Bewerbungen und den Einstellungsprozess")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowAIAnalysis(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              {t("hiring.aiAnalysis", "KI-Analyse")}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="postings" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.postings", "Stellen")}</span>
              <CountBadge count={counts?.jobPostings} />
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.candidates", "Kandidaten")}</span>
              <CountBadge count={counts?.candidates} />
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.pipeline", "Pipeline")}</span>
              <CountBadge count={counts?.pipeline} />
            </TabsTrigger>
            <TabsTrigger value="interviews" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.interviews", "Interviews")}</span>
              <CountBadge count={counts?.interviews} />
            </TabsTrigger>
            <TabsTrigger value="questionnaires" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.questionnaires", "Fragebögen")}</span>
              <CountBadge count={counts?.questionnaires} />
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t("hiring.tabs.settings", "Einstellungen")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="postings">
            <JobPostingsManager />
          </TabsContent>

          <TabsContent value="candidates">
            <CandidatesManager
              onTabChange={setActiveTab}
              showArchived={showArchived}
              onShowArchivedChange={setShowArchived}
            />
          </TabsContent>

          <TabsContent value="pipeline">
            <Card>
              <CardHeader>
                <CardTitle>{t("hiring.pipeline.title", "Recruiting-Pipeline")}</CardTitle>
                <CardDescription>
                  {t("hiring.pipeline.description", "Visualisieren und verwalten Sie den Bewerbungsprozess")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HiringPipeline />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interviews">
            <InterviewTemplatesManager />
          </TabsContent>

          <TabsContent value="questionnaires">
            <QuestionnaireManager />
          </TabsContent>

          <TabsContent value="settings">
            <RecruitingSettings />
          </TabsContent>
        </Tabs>

        {/* AI Analysis Dialog */}
        <AIRecruitingAnalysisDialog open={showAIAnalysis} onOpenChange={setShowAIAnalysis} />
      </div>
    </AppLayout>
  )
}
