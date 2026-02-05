"use client"

import { memo } from "react"
import { useRouter } from "next/navigation"
import { LazyDashboardOverview } from "@/components/lazy-components"
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface DashboardPageClientProps {
  initialData: {
    totalTeams: number
    totalMembers: number
    activeTodos: number
    completedTodos: number
    upcomingEvents: number
  } | null
  practiceId: string | null | undefined
  userId: string
}

export default function DashboardPageClient({ initialData, practiceId, userId }: DashboardPageClientProps) {
  const router = useRouter()

  // If no practice ID, show error
  if (!practiceId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <CardTitle>Keine Praxis gefunden</CardTitle>
            </div>
            <CardDescription>
              Es konnte keine Praxis für Ihr Konto gefunden werden. Bitte wenden Sie sich an den Administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.refresh()} variant="outline" className="w-full bg-transparent">
              <RefreshCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <OnboardingWrapper>
      <LazyDashboardOverview 
        practiceId={practiceId} 
        userId={userId} 
        initialData={initialData}
      />
    </OnboardingWrapper>
  )
}
