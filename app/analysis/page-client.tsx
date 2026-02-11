"use client"

import { useState } from "react"
import AIPracticeAnalysis from "@/components/ai-practice-analysis"
import { AIAnalysisHistoryTable } from "@/components/profile/ai-analysis-history-table"
import AIPracticeChatDialog from "@/components/ai-practice-chat-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  History,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  FileText,
  ArrowUp,
  CheckCircle2,
  Clock,
  Activity,
  Workflow,
  Heart,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"

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
        {/* Stats cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Praxis-Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-3 pt-0">
              <div className="text-3xl font-bold">85/100</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">+5</span> seit letzter Analyse
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Ziele</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-3 pt-0">
              <div className="text-3xl font-bold">12</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">8</span> abgeschlossen
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Team-Performance</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-3 pt-0">
              <div className="text-3xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3 text-blue-500" />
                Auslastung optimal
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-3 px-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Analysen</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1 px-4 pb-3 pt-0">
              <div className="text-3xl font-bold">24</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />
                Letzte vor 2 Std.
              </p>
            </CardContent>
          </Card>
        </div>

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
            <AIPracticeAnalysis />
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
