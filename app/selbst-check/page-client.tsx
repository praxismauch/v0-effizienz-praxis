"use client"

import { AppLayout } from "@/components/app-layout"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { SelfCheckTab } from "@/components/profile/self-check-tab"
import { Loader2 } from "lucide-react"

export default function SelbstCheckPageClient() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()

  if (!currentUser) {
    return (
      <AppLayout loading={true} loadingMessage="Lade Selbst-Check...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Selbst-Check</h1>
          <p className="text-muted-foreground mt-1">
            Bewerten Sie regelmäßig Ihr mentales Wohlbefinden und erhalten Sie personalisierte Empfehlungen
          </p>
        </div>

        {/* Self-Check Component */}
        <SelfCheckTab userId={currentUser.id} practiceId={currentPractice?.id ? String(currentPractice.id) : ""} />
      </div>
    </AppLayout>
  )
}
