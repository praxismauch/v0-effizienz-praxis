"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeEarnedPopup } from "@/components/badge-earned-popup"
import { Lock } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { AppLayout } from "@/components/app-layout"
import { LandingPageLayout } from "@/components/landing-page-layout"

// Import types
import type { Course, Enrollment, UserStats, UserBadge, LeaderboardEntry } from "./types"
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
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("courses")
  const [pendingBadge, setPendingBadge] = useState<any>(null)

  const isAuthenticated = !!currentUser?.id
  const hasPractice = !!currentPractice?.id

  useEffect(() => {
    fetchAcademyData()
  }, [currentPractice?.id, currentUser?.id])

  const fetchAcademyData = async () => {
    setIsLoading(true)
    try {
      const coursesPromise = fetch(`/api/public/academy/courses`)
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => [])

      let enrollmentsPromise = Promise.resolve([])
      let statsPromise = Promise.resolve(null)
      let badgesPromise = Promise.resolve([])
      let leaderboardPromise = Promise.resolve([])

      if (isAuthenticated && hasPractice && currentPractice?.id) {
        enrollmentsPromise = fetch(`/api/practices/${currentPractice.id}/academy/enrollments`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        statsPromise = fetch(
          `/api/practices/${currentPractice.id}/academy/stats${currentUser?.id ? `?user_id=${currentUser.id}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)

        badgesPromise = fetch(
          `/api/practices/${currentPractice.id}/academy/badges${currentUser?.id ? `?user_id=${currentUser.id}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        leaderboardPromise = fetch(`/api/practices/${currentPractice.id}/academy/leaderboard`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])
      }

      const [coursesData, enrollmentsData, statsData, badgesData, leaderboardData] = await Promise.all([
        coursesPromise,
        enrollmentsPromise,
        statsPromise,
        badgesPromise,
        leaderboardPromise,
      ])

      setCourses(coursesData || [])
      setEnrollments(enrollmentsData || [])
      setUserStats(statsData)
      setUserBadges(badgesData || [])
      setLeaderboard(leaderboardData || [])
    } catch (error) {
      console.error("Error fetching academy data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkUnseenBadges = async () => {
      if (!currentUser?.id) return

      try {
        const response = await fetch(`/api/badges/unseen?userId=${currentUser.id}`)
        if (response.ok) {
          const unseenBadges = await response.json()
          if (unseenBadges.length > 0) {
            const firstBadge = unseenBadges[0]
            setPendingBadge({
              id: firstBadge.badge?.badge_id,
              name: firstBadge.badge?.name,
              description: firstBadge.badge?.description,
              icon_name: firstBadge.badge?.icon_name,
              color: firstBadge.badge?.color,
              rarity: firstBadge.badge?.rarity,
              points: firstBadge.badge?.points,
              userBadgeId: firstBadge.id,
            })
          }
        }
      } catch (error) {
        console.error("Error checking unseen badges:", error)
      }
    }

    checkUnseenBadges()
  }, [currentUser?.id])

  const handleBadgePopupClose = async () => {
    if (pendingBadge?.userBadgeId) {
      try {
        await fetch("/api/badges/unseen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ badgeIds: [pendingBadge.userBadgeId] }),
        })
      } catch (error) {
        console.error("Error marking badge as seen:", error)
      }
    }
    setPendingBadge(null)
    fetchAcademyData()
  }

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
