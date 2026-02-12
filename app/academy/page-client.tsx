"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeEarnedPopup } from "@/components/badge-earned-popup"
import { Lock } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { useAcademyUserData } from "./hooks/use-academy-user-data"

// Import types
import type { UserStats } from "./types"
import { DEFAULT_STATS } from "./types"

// Import components
import { AcademyStatsCards } from "./components/academy-stats-cards"
import { CoursesTab } from "./components/courses-tab"
import { MyLearningTab } from "./components/my-learning-tab"
import { BadgesTab } from "./components/badges-tab"
import { LeaderboardTab } from "./components/leaderboard-tab"
import { AcademyHeader } from "./components/academy-header"

export function AcademyPageClient() {
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { currentUser, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState("courses")

  const isAuthenticated = !!currentUser?.id
  const hasPractice = !!currentPractice?.id

  const {
    courses,
    enrollments,
    userStats,
    userBadges,
    leaderboard,
    isLoading,
    pendingBadge,
    handleBadgePopupClose,
    refetch,
  } = useAcademyUserData({
    practiceId: currentPractice?.id,
    userId: currentUser?.id,
    isAuthenticated,
    hasPractice,
  })

  const displayStats: UserStats = userStats || DEFAULT_STATS

  if (userLoading || practiceLoading || isLoading) {
    if (currentUser?.id) {
      return <AppLayout loading loadingMessage="Lade Academy..." />
    }
    return (
      <LandingPageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground ml-4">Lade Academy...</p>
        </div>
      </LandingPageLayout>
    )
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <AcademyHeader 
        isAuthenticated={isAuthenticated} 
        displayStats={displayStats} 
      />

      {/* Stats Cards for Authenticated Users */}
      {isAuthenticated && (
        <AcademyStatsCards 
          userStats={userStats}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
          <TabsTrigger value="courses">Kurse</TabsTrigger>
          <TabsTrigger value="my-learning" className="flex items-center gap-1">
            Mein Lernen
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-1">
            Abzeichen
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1">
            Rangliste
            {!isAuthenticated && <Lock className="h-3 w-3" />}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <CoursesTab courses={courses} />
        </TabsContent>

        <TabsContent value="my-learning">
          <MyLearningTab 
            isAuthenticated={isAuthenticated}
            enrollments={enrollments}
            onSwitchTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="badges">
          <BadgesTab 
            isAuthenticated={isAuthenticated}
            userBadges={userBadges}
            onSwitchTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <LeaderboardTab 
            isAuthenticated={isAuthenticated}
            leaderboard={leaderboard}
            currentUserId={currentUser?.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )

  if (isAuthenticated) {
    return (
      <AppLayout>
        <BadgeEarnedPopup badge={pendingBadge} onClose={handleBadgePopupClose} />
        {content}
      </AppLayout>
    )
  }

  return (
    <LandingPageLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <BadgeEarnedPopup badge={pendingBadge} onClose={handleBadgePopupClose} />
        {content}
      </div>
    </LandingPageLayout>
  )
}
