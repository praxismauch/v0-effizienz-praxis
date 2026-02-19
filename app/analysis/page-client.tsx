"use client"

import { useState } from "react"
import useSWR from "swr"
import AIPracticeAnalysis from "@/components/ai-practice-analysis"
import { AIAnalysisHistoryTable } from "@/components/profile/ai-analysis-history-table"
import AIPracticeChatDialog from "@/components/ai-practice-chat-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader, StatsCards } from "@/components/page-layout"
import { MessageSquare, History, Sparkles, TrendingUp, Target, Users, FileText, Clock, Workflow, Heart } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const sampleQuestions = [
  {
    text: "Wie ist die aktuelle Team-Performance?",
    icon: Users,
  },
  {
    text: "Welche Ziele sollten priorisiert werden?",
    icon: Target,
  },
  {
    text: "Gibt es Optimierungspotenzial bei den Workflows?",
    icon: Workflow,
  },
  {
    text: "Wie steht es um die Patienten-Zufriedenheit?",
    icon: Heart,
  },
]

export default function AnalysisPageClient() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState("")
  const [lastScore, setLastScore] = useState<number | null>(null)

  const practiceId = currentPractice?.id
  const { data: badgeData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/sidebar-badges` : null,
    fetcher,
  )

  const badges = badgeData?.badges || {}
  const activeGoals = badges.goals || 0
  const teamSize = badges.teamMembers || 0
  const totalTasks = badges.tasks || 0
  const totalDocuments = badges.documents || 0

  const handleQuestionClick = (question: string) => {
    setSelectedQuestion(question)
    setChatOpen(true)
  }

  const handleChatOpenChange = (open: boolean) => {
    setChatOpen(open)
    if (!open) {
      setSelectedQuestion("")
    }
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="KI-Analyse"
          subtitle="Lassen Sie Ihre Praxis von der KI analysieren und erhalten Sie Optimierungsvorschl\u00e4ge"
        />

        <StatsCards
          columns={4}
          cards={[
            {
              label: "Praxis-Score",
              value: lastScore != null ? `${lastScore}/100` : "\u2013",
              icon: TrendingUp,
              color: "primary",
              description: lastScore != null ? "Aktuelle Bewertung" : "Analyse starten f\u00fcr Score",
            },
            {
              label: "Aktive Ziele",
              value: activeGoals,
              icon: Target,
              color: "success",
              description: "Ziele aktiv verfolgt",
            },
            {
              label: "Team-Mitglieder",
              value: teamSize,
              icon: Users,
              color: "blue",
              description: "Aktive Mitglieder",
            },
            {
              label: "Dokumente",
              value: totalDocuments,
              icon: FileText,
              color: "amber",
              description: `${totalTasks} offene Aufgaben`,
            },
          ]}
        />

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="current" className="gap-2 text-base py-3 px-4">
              <Sparkles className="h-5 w-5" />
              Aktuelle Analyse
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 text-base py-3 px-4">
              <History className="h-5 w-5" />
              Verlauf
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-6">
            <AIPracticeAnalysis onScoreUpdate={(score) => setLastScore(score)} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-500" />
                  Analyse-Verlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIAnalysisHistoryTable
                  userId={currentUser?.id || ""}
                  practiceId={currentPractice?.id || ""}
                  limit={10}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                KI-Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Nutzen Sie den KI-Chat für detaillierte Fragen zu Ihrer Praxisleistung.
                  <br />
                  Die KI hat vollständigen Zugriff auf alle Ihre Daten und kann gezielte Empfehlungen geben.
                </p>
                <Button
                  onClick={() => setChatOpen(true)}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  size="lg"
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat starten
                </Button>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Beispielfragen:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sampleQuestions.map((question, index) => {
                    const Icon = question.icon
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuestionClick(question.text)}
                        className="flex items-center gap-3 p-4 text-left rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-colors group"
                      >
                        <span className="text-muted-foreground group-hover:text-primary transition-colors">•</span>
                        <span className="text-sm">{question.text}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AIPracticeChatDialog open={chatOpen} onOpenChange={handleChatOpenChange} initialMessage={selectedQuestion} />
    </>
  )
}
