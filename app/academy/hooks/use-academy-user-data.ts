"use client"

import { useState } from "react"
import useSWR from "swr"
import type { Course, Enrollment, UserStats, UserBadge, LeaderboardEntry } from "../types"

const fetcher = (url: string) => fetch(url).then((res) => (res.ok ? res.json() : null))

interface UseAcademyProps {
  practiceId: string | undefined
  userId: string | undefined
  isAuthenticated: boolean
  hasPractice: boolean
}

export function useAcademyUserData({ practiceId, userId, isAuthenticated, hasPractice }: UseAcademyProps) {
  const [pendingBadge, setPendingBadge] = useState<any>(null)

  const canFetchPrivate = isAuthenticated && hasPractice && !!practiceId

  // Public courses - always fetch
  const { data: courses, isLoading: coursesLoading, mutate: mutateCourses } = useSWR<Course[]>(
    "/api/public/academy/courses",
    fetcher,
    { fallbackData: [] }
  )

  // Enrollments - only if authenticated
  const { data: enrollments, mutate: mutateEnrollments } = useSWR<Enrollment[]>(
    canFetchPrivate ? `/api/practices/${practiceId}/academy/enrollments` : null,
    fetcher,
    { fallbackData: [] }
  )

  // User stats
  const { data: userStats, mutate: mutateStats } = useSWR<UserStats | null>(
    canFetchPrivate
      ? `/api/practices/${practiceId}/academy/stats${userId ? `?user_id=${userId}` : ""}`
      : null,
    fetcher,
  )

  // User badges
  const { data: userBadges, mutate: mutateBadges } = useSWR<UserBadge[]>(
    canFetchPrivate
      ? `/api/practices/${practiceId}/academy/badges${userId ? `?user_id=${userId}` : ""}`
      : null,
    fetcher,
    { fallbackData: [] }
  )

  // Leaderboard
  const { data: leaderboard } = useSWR<LeaderboardEntry[]>(
    canFetchPrivate ? `/api/practices/${practiceId}/academy/leaderboard` : null,
    fetcher,
    { fallbackData: [] }
  )

  // Unseen badges check
  const { data: unseenBadges } = useSWR(
    userId ? `/api/badges/unseen?userId=${userId}` : null,
    fetcher,
    {
      onSuccess: (data) => {
        if (data && data.length > 0 && !pendingBadge) {
          const firstBadge = data[0]
          setPendingBadge({
            id: firstBadge.badge?.badge_id || firstBadge.badge?.id,
            name: firstBadge.badge?.name,
            description: firstBadge.badge?.description,
            icon_name: firstBadge.badge?.icon_name,
            color: firstBadge.badge?.color,
            rarity: firstBadge.badge?.rarity || "common",
            points: firstBadge.badge?.xp_reward || firstBadge.badge?.points || 0,
            userBadgeId: firstBadge.id,
          })
        }
      },
    }
  )

  const isLoading = coursesLoading

  const refetch = () => {
    mutateCourses()
    mutateEnrollments()
    mutateStats()
    mutateBadges()
  }

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
    refetch()
  }

  return {
    courses: courses || [],
    enrollments: enrollments || [],
    userStats: userStats || null,
    userBadges: userBadges || [],
    leaderboard: leaderboard || [],
    isLoading,
    pendingBadge,
    handleBadgePopupClose,
    refetch,
  }
}
