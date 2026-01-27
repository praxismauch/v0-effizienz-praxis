"use client"

import { useState, useEffect } from "react"
import type { Course, Enrollment, UserStats, UserBadge, LeaderboardEntry } from "../types"

interface UseAcademyProps {
  practiceId: string | undefined
  userId: string | undefined
  isAuthenticated: boolean
  hasPractice: boolean
}

export function useAcademy({ practiceId, userId, isAuthenticated, hasPractice }: UseAcademyProps) {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pendingBadge, setPendingBadge] = useState<any>(null)

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

      if (isAuthenticated && hasPractice && practiceId) {
        enrollmentsPromise = fetch(`/api/practices/${practiceId}/academy/enrollments`)
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        statsPromise = fetch(
          `/api/practices/${practiceId}/academy/stats${userId ? `?user_id=${userId}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)

        badgesPromise = fetch(
          `/api/practices/${practiceId}/academy/badges${userId ? `?user_id=${userId}` : ""}`,
        )
          .then((res) => (res.ok ? res.json() : []))
          .catch(() => [])

        leaderboardPromise = fetch(`/api/practices/${practiceId}/academy/leaderboard`)
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
    fetchAcademyData()
  }, [practiceId, userId])

  useEffect(() => {
    const checkUnseenBadges = async () => {
      if (!userId) return

      try {
        const response = await fetch(`/api/badges/unseen?userId=${userId}`)
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
  }, [userId])

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

  return {
    courses,
    enrollments,
    userStats,
    userBadges,
    leaderboard,
    isLoading,
    pendingBadge,
    handleBadgePopupClose,
    refetch: fetchAcademyData,
  }
}
