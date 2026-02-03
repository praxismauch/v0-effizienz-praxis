"use client"

import useSWR from "swr"
import { SWR_KEYS, DEFAULT_PRACTICE_ID } from "@/lib/swr-keys"
import { swrFetcher, mutationFetcher } from "@/lib/swr-fetcher"
import { SHARED_SWR_CONFIG, REALTIME_SWR_CONFIG } from "@/lib/swr-config"

// Types
export interface Course {
  id: string
  practice_id: number
  title: string
  description: string | null
  category: string | null
  difficulty: string | null
  instructor_name: string | null
  instructor_bio: string | null
  instructor_avatar: string | null
  thumbnail_url: string | null
  estimated_hours: number | null
  xp_reward: number
  is_published: boolean
  visibility: string
  target_audience: string
  tags: string[] | null
  learning_objectives: string[] | null
  created_at: string
  updated_at: string | null
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string | null
  display_order: number
  estimated_minutes: number | null
  is_published: boolean
  created_at: string
}

export interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  description: string | null
  content: string | null
  lesson_type: string
  video_url: string | null
  video_duration: number | null
  estimated_time: number | null
  xp_reward: number
  is_free_preview: boolean
  display_order: number
  is_published: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  badge_type: string
  icon_name: string | null
  rarity: string
  xp_reward: number
  color: string | null
  criteria: unknown
  display_order: number
  created_at: string
}

export interface AcademyStats {
  totalCourses: number
  publishedCourses: number
  totalModules: number
  totalLessons: number
  totalQuizzes: number
  totalBadges: number
  totalEnrollments: number
  completionRate: number
  averageRating: number
}

/**
 * Hook for fetching academy courses
 */
export function useAcademyCourses(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<Course[] | { courses: Course[] }>(
    SWR_KEYS.academyCourses(practiceId),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const courses = Array.isArray(data) ? data : data?.courses || []

  return {
    courses,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching academy modules
 */
export function useAcademyModules(practiceId = DEFAULT_PRACTICE_ID, courseId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Module[] | { modules: Module[] }>(
    SWR_KEYS.academyModules(practiceId, courseId),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const modules = Array.isArray(data) ? data : data?.modules || []

  return {
    modules,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching academy lessons
 */
export function useAcademyLessons(practiceId = DEFAULT_PRACTICE_ID, moduleId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Lesson[] | { lessons: Lesson[] }>(
    SWR_KEYS.academyLessons(practiceId, moduleId),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const lessons = Array.isArray(data) ? data : data?.lessons || []

  return {
    lessons,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching academy badges
 */
export function useAcademyBadges(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<Badge[] | { badges: Badge[] }>(
    SWR_KEYS.academyBadges(practiceId),
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const badges = Array.isArray(data) ? data : data?.badges || []

  return {
    badges,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching academy quizzes
 */
export function useAcademyQuizzes(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<any[]>(
    `/api/practices/${practiceId}/academy/quizzes`,
    swrFetcher,
    SHARED_SWR_CONFIG
  )

  const quizzes = Array.isArray(data) ? data : data?.quizzes || []

  return {
    data: quizzes,
    quizzes,
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook for fetching academy stats
 */
export function useAcademyStats(practiceId = DEFAULT_PRACTICE_ID) {
  const { data, error, isLoading, mutate } = useSWR<AcademyStats>(
    SWR_KEYS.academyStats(practiceId),
    swrFetcher,
    { ...REALTIME_SWR_CONFIG, refreshInterval: 60000 }
  )

  return {
    stats: data || {
      totalCourses: 0,
      publishedCourses: 0,
      totalModules: 0,
      totalLessons: 0,
      totalQuizzes: 0,
      totalBadges: 0,
      totalEnrollments: 0,
      completionRate: 0,
      averageRating: 0,
    },
    isLoading,
    error,
    refresh: () => mutate(),
    mutate,
  }
}

/**
 * Hook with academy mutations (create, update, delete courses)
 */
export function useAcademyMutations(practiceId = DEFAULT_PRACTICE_ID) {
  const { mutate: mutateCourses } = useAcademyCourses(practiceId)
  const { mutate: mutateModules } = useAcademyModules(practiceId)
  const { mutate: mutateLessons } = useAcademyLessons(practiceId)
  const { mutate: mutateBadges } = useAcademyBadges(practiceId)
  const { mutate: mutateStats } = useAcademyStats(practiceId)
  const { mutate: mutateQuizzes } = useAcademyQuizzes(practiceId)

  const refreshAll = async () => {
    await Promise.all([
      mutateCourses(),
      mutateModules(),
      mutateLessons(),
      mutateBadges(),
      mutateStats(),
      mutateQuizzes(),
    ])
  }

  const createCourse = async (courseData: Partial<Course>) => {
    const result = await mutationFetcher<Course>(SWR_KEYS.academyCourses(practiceId), {
      method: "POST",
      body: courseData,
    })
    await Promise.all([mutateCourses(), mutateStats()])
    return result
  }

  const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
    const result = await mutationFetcher<Course>(`${SWR_KEYS.academyCourses(practiceId)}/${courseId}`, {
      method: "PUT",
      body: courseData,
    })
    await mutateCourses()
    return result
  }

  const deleteCourse = async (courseId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.academyCourses(practiceId)}/${courseId}`, { method: "DELETE" })
    await Promise.all([mutateCourses(), mutateStats()])
  }

  const createModule = async (moduleData: Partial<Module>) => {
    const result = await mutationFetcher<Module>(SWR_KEYS.academyModules(practiceId), {
      method: "POST",
      body: moduleData,
    })
    await mutateModules()
    return result
  }

  const updateModule = async (moduleId: string, moduleData: Partial<Module>) => {
    const result = await mutationFetcher<Module>(`${SWR_KEYS.academyModules(practiceId)}/${moduleId}`, {
      method: "PUT",
      body: moduleData,
    })
    await mutateModules()
    return result
  }

  const deleteModule = async (moduleId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.academyModules(practiceId)}/${moduleId}`, { method: "DELETE" })
    await Promise.all([mutateModules(), mutateStats()])
  }

  const createLesson = async (lessonData: Partial<Lesson>) => {
    const result = await mutationFetcher<Lesson>(SWR_KEYS.academyLessons(practiceId), {
      method: "POST",
      body: lessonData,
    })
    await mutateLessons()
    return result
  }

  const updateLesson = async (lessonId: string, lessonData: Partial<Lesson>) => {
    const result = await mutationFetcher<Lesson>(`${SWR_KEYS.academyLessons(practiceId)}/${lessonId}`, {
      method: "PUT",
      body: lessonData,
    })
    await mutateLessons()
    return result
  }

  const deleteLesson = async (lessonId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.academyLessons(practiceId)}/${lessonId}`, { method: "DELETE" })
    await Promise.all([mutateLessons(), mutateStats()])
  }

  const createBadge = async (badgeData: Partial<Badge>) => {
    const result = await mutationFetcher<Badge>(SWR_KEYS.academyBadges(practiceId), { method: "POST", body: badgeData })
    await mutateBadges()
    return result
  }

  const updateBadge = async (badgeId: string, badgeData: Partial<Badge>) => {
    const result = await mutationFetcher<Badge>(`${SWR_KEYS.academyBadges(practiceId)}/${badgeId}`, {
      method: "PUT",
      body: badgeData,
    })
    await mutateBadges()
    return result
  }

  const deleteBadge = async (badgeId: string) => {
    await mutationFetcher<void>(`${SWR_KEYS.academyBadges(practiceId)}/${badgeId}`, { method: "DELETE" })
    await mutateBadges()
  }

  return {
    refreshAll,
    createCourse,
    updateCourse,
    deleteCourse,
    createModule,
    updateModule,
    deleteModule,
    createLesson,
    updateLesson,
    deleteLesson,
    createBadge,
    updateBadge,
    deleteBadge,
  }
}

export const useCourses = useAcademyCourses
export const useModules = useAcademyModules
export const useLessons = useAcademyLessons
export const useBadges = useAcademyBadges
export const useQuizzes = useAcademyQuizzes
