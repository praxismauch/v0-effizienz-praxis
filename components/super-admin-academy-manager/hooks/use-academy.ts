"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import type { Course, Module, Lesson, Quiz, AcademyBadge, AcademyStats } from "../types"

const PRACTICE_ID = "1" // Placeholder for super admin context

export function useAcademy() {
  const [courses, setCourses] = useState<Course[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [badges, setBadges] = useState<AcademyBadge[]>([])
  const [stats, setStats] = useState<AcademyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAiCourseDialog, setShowAiCourseDialog] = useState(false)

  // AI states
  const [aiCourseDescription, setAiCourseDescription] = useState("")
  const [aiCourseCategory, setAiCourseCategory] = useState("praxismanagement")
  const [aiCourseDifficulty, setAiCourseDifficulty] = useState("beginner")
  const [aiCourseGenerating, setAiCourseGenerating] = useState(false)
  const [generatedCourse, setGeneratedCourse] = useState<any>(null)

  // Edit states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingModule, setEditingModule] = useState<Module | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editingBadge, setEditingBadge] = useState<AcademyBadge | null>(null)
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string; name: string } | null>(null)

  // Selected course for modules/lessons
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseModules, setCourseModules] = useState<Module[]>([])
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: "", description: "", category: "praxismanagement", difficulty_level: "beginner",
    thumbnail_url: "", featured_image_url: "", instructor_name: "", instructor_bio: "",
    instructor_avatar_url: "", estimated_hours: 1, xp_reward: 100,
    is_published: false, is_featured: false, is_landing_page_featured: false,
    visibility: "logged_in" as "public" | "logged_in" | "premium",
    target_audience: ["all"] as string[], tags: [] as string[], learning_objectives: [] as string[],
  })

  const [moduleForm, setModuleForm] = useState({
    title: "", description: "", estimated_minutes: 30, is_published: false,
  })

  const [lessonForm, setLessonForm] = useState({
    title: "", description: "", content: "", lesson_type: "video",
    video_url: "", video_duration_seconds: 0, estimated_minutes: 10,
    xp_reward: 25, is_published: false, is_free_preview: false,
  })

  const [badgeForm, setBadgeForm] = useState({
    name: "", description: "", badge_type: "achievement", icon_name: "trophy",
    color: "#3b82f6", rarity: "common", xp_reward: 50, is_active: true, criteria: {} as any,
    criteria_type: "", criteria_value: "",
  })

  const [quizForm, setQuizForm] = useState({
    title: "", description: "", quiz_type: "multiple_choice",
    passing_score: 70, max_attempts: 3, time_limit_minutes: 15,
    xp_reward: 50, randomize_questions: false, show_correct_answers: true,
    course_id: "", module_id: "", lesson_id: "",
  })

  // Fetch functions
  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/courses`)
      if (response.ok) {
        const data = await response.json()
        setCourses(Array.isArray(data) ? data : data.courses || [])
      }
    } catch (error) { console.error("[v0] Error fetching courses:", error) }
  }, [])

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/quizzes`)
      if (response.ok) {
        const data = await response.json()
        setQuizzes(Array.isArray(data) ? data : data.quizzes || [])
      }
    } catch (error) { console.error("[v0] Error fetching quizzes:", error) }
  }, [])

  const fetchBadges = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/badges`)
      if (response.ok) {
        const data = await response.json()
        setBadges(Array.isArray(data) ? data : data.badges || [])
      }
    } catch (error) { console.error("[v0] Error fetching badges:", error) }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/stats`)
      if (response.ok) setStats(await response.json())
    } catch (error) { console.error("[v0] Error fetching stats:", error) }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try { await Promise.all([fetchCourses(), fetchQuizzes(), fetchBadges(), fetchStats()]) }
    finally { setLoading(false) }
  }, [fetchCourses, fetchQuizzes, fetchBadges, fetchStats])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchAllData()
  }, [fetchAllData])

  const fetchCourseModules = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/modules?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const modulesData = Array.isArray(data) ? data : data.modules || []
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: Module) => {
            const lr = await fetch(`/api/practices/${PRACTICE_ID}/academy/lessons?module_id=${module.id}`)
            if (lr.ok) {
              const ld = await lr.json()
              return { ...module, lessons: Array.isArray(ld) ? ld : ld.lessons || [] }
            }
            return { ...module, lessons: [] }
          }),
        )
        setCourseModules(modulesWithLessons)
      }
    } catch (error) { console.error("[v0] Error fetching modules:", error) }
  }, [])

  // Reset functions
  const resetCourseForm = () => setCourseForm({
    title: "", description: "", category: "praxismanagement", difficulty_level: "beginner",
    thumbnail_url: "", featured_image_url: "", instructor_name: "", instructor_bio: "",
    instructor_avatar_url: "", estimated_hours: 1, xp_reward: 100,
    is_published: false, is_featured: false, is_landing_page_featured: false,
    visibility: "logged_in", target_audience: ["all"], tags: [], learning_objectives: [],
  })

  const resetModuleForm = () => setModuleForm({ title: "", description: "", estimated_minutes: 30, is_published: false })

  const resetLessonForm = () => setLessonForm({
    title: "", description: "", content: "", lesson_type: "video",
    video_url: "", video_duration_seconds: 0, estimated_minutes: 10,
    xp_reward: 25, is_published: false, is_free_preview: false,
  })

  const resetBadgeForm = () => setBadgeForm({
    name: "", description: "", badge_type: "achievement", icon_name: "trophy",
    color: "#3b82f6", rarity: "common", xp_reward: 50, is_active: true, criteria: {},
    criteria_type: "", criteria_value: "",
  })

  const resetQuizForm = () => setQuizForm({
    title: "", description: "", quiz_type: "multiple_choice",
    passing_score: 70, max_attempts: 3, time_limit_minutes: 15,
    xp_reward: 50, randomize_questions: false, show_correct_answers: true,
    course_id: "", module_id: "", lesson_id: "",
  })

  // Save handlers
  const handleSaveCourse = async () => {
    const isEditing = !!editingCourse
    const previousCourses = [...courses]
    try {
      const optimistic = { ...courseForm, id: editingCourse?.id || `temp-${Date.now()}`,
        total_enrollments: editingCourse?.total_enrollments || 0, average_rating: editingCourse?.average_rating || 0,
        total_reviews: editingCourse?.total_reviews || 0, created_at: editingCourse?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString() } as Course
      setCourses(isEditing ? courses.map((c) => (c.id === editingCourse!.id ? optimistic : c)) : [...courses, optimistic])
      const url = isEditing ? `/api/practices/${PRACTICE_ID}/academy/courses/${editingCourse!.id}` : `/api/practices/${PRACTICE_ID}/academy/courses`
      const response = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(courseForm) })
      if (!response.ok) throw new Error("Failed")
      toast({ title: isEditing ? "Kurs aktualisiert" : "Kurs erstellt", description: `"${courseForm.title}" erfolgreich.` })
      setShowCourseDialog(false); setEditingCourse(null); resetCourseForm(); fetchCourses()
    } catch {
      setCourses(previousCourses)
      toast({ title: "Fehler", description: "Problem beim Speichern.", variant: "destructive" })
    }
  }

  const handleSaveModule = async () => {
    if (!selectedCourse) return
    const isEditing = !!editingModule
    const previousModules = [...courseModules]
    try {
      const optimistic = { ...moduleForm, id: editingModule?.id || `temp-${Date.now()}`, course_id: selectedCourse.id,
        display_order: editingModule?.display_order || courseModules.length, lessons: editingModule?.lessons || [] }
      setCourseModules(isEditing ? courseModules.map((m) => (m.id === editingModule!.id ? optimistic : m)) : [...courseModules, optimistic])
      const url = isEditing ? `/api/practices/${PRACTICE_ID}/academy/modules/${editingModule!.id}` : `/api/practices/${PRACTICE_ID}/academy/modules`
      const response = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...moduleForm, course_id: selectedCourse.id }) })
      if (!response.ok) throw new Error("Failed")
      toast({ title: isEditing ? "Modul aktualisiert" : "Modul erstellt", description: `"${moduleForm.title}" erfolgreich.` })
      setShowModuleDialog(false); setEditingModule(null); resetModuleForm(); fetchCourseModules(selectedCourse.id)
    } catch {
      setCourseModules(previousModules)
      toast({ title: "Fehler", description: "Problem beim Speichern.", variant: "destructive" })
    }
  }

  const handleSaveBadge = async () => {
    const isEditing = !!editingBadge
    const previousBadges = [...badges]
    try {
      const optimistic = { ...badgeForm, id: editingBadge?.id || `temp-${Date.now()}`, icon_url: "", display_order: editingBadge?.display_order || badges.length }
      setBadges(isEditing ? badges.map((b) => (b.id === editingBadge!.id ? optimistic : b)) : [...badges, optimistic])
      const url = isEditing ? `/api/practices/${PRACTICE_ID}/academy/badges/${editingBadge!.id}` : `/api/practices/${PRACTICE_ID}/academy/badges`
      const response = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(badgeForm) })
      if (!response.ok) throw new Error("Failed")
      toast({ title: isEditing ? "Badge aktualisiert" : "Badge erstellt", description: `"${badgeForm.name}" erfolgreich.` })
      setShowBadgeDialog(false); setEditingBadge(null); resetBadgeForm(); fetchBadges()
    } catch {
      setBadges(previousBadges)
      toast({ title: "Fehler", description: "Problem beim Speichern.", variant: "destructive" })
    }
  }

  const handleSaveQuiz = async () => {
    const isEditing = !!editingQuiz
    const previousQuizzes = [...quizzes]
    try {
      const optimistic = { ...quizForm, id: editingQuiz?.id || `temp-${Date.now()}`, questions: editingQuiz?.questions || [] } as Quiz
      setQuizzes(isEditing ? quizzes.map((q) => (q.id === editingQuiz!.id ? optimistic : q)) : [...quizzes, optimistic])
      const url = isEditing
        ? `/api/practices/${PRACTICE_ID}/academy/quizzes/${editingQuiz!.id}`
        : `/api/practices/${PRACTICE_ID}/academy/quizzes`
      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizForm),
      })
      if (!response.ok) throw new Error("Failed")
      toast({ title: isEditing ? "Quiz aktualisiert" : "Quiz erstellt", description: `"${quizForm.title}" erfolgreich.` })
      setShowQuizDialog(false); setEditingQuiz(null); resetQuizForm(); fetchQuizzes()
    } catch {
      setQuizzes(previousQuizzes)
      toast({ title: "Fehler", description: "Problem beim Speichern des Quiz.", variant: "destructive" })
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return
    const prev = { courses: [...courses], quizzes: [...quizzes], badges: [...badges], modules: [...courseModules] }
    try {
      let endpoint = ""
      switch (deleteItem.type) {
        case "course": setCourses(courses.filter((c) => c.id !== deleteItem.id)); endpoint = `/api/practices/${PRACTICE_ID}/academy/courses/${deleteItem.id}`; break
        case "module": setCourseModules(courseModules.filter((m) => m.id !== deleteItem.id)); endpoint = `/api/practices/${PRACTICE_ID}/academy/modules/${deleteItem.id}`; break
        case "lesson": setCourseModules(courseModules.map((m) => ({ ...m, lessons: m.lessons?.filter((l) => l.id !== deleteItem.id) || [] }))); endpoint = `/api/practices/${PRACTICE_ID}/academy/lessons/${deleteItem.id}`; break
        case "quiz": setQuizzes(quizzes.filter((q) => q.id !== deleteItem.id)); endpoint = `/api/practices/${PRACTICE_ID}/academy/quizzes/${deleteItem.id}`; break
        case "badge": setBadges(badges.filter((b) => b.id !== deleteItem.id)); endpoint = `/api/practices/${PRACTICE_ID}/academy/badges/${deleteItem.id}`; break
      }
      const response = await fetch(endpoint, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed")
      toast({ title: "Gelöscht", description: `"${deleteItem.name}" wurde gelöscht.` })
      setShowDeleteDialog(false); setDeleteItem(null)
      if (deleteItem.type === "course") fetchCourses()
      if (deleteItem.type === "quiz") fetchQuizzes()
      if (deleteItem.type === "badge") fetchBadges()
      if (selectedCourse && (deleteItem.type === "module" || deleteItem.type === "lesson")) fetchCourseModules(selectedCourse.id)
    } catch {
      setCourses(prev.courses); setQuizzes(prev.quizzes); setBadges(prev.badges); setCourseModules(prev.modules)
      toast({ title: "Fehler", description: "Problem beim Löschen.", variant: "destructive" })
    }
  }

  const handleGenerateAiCourse = async () => {
    if (!aiCourseDescription.trim()) { toast({ title: "Beschreibung fehlt", variant: "destructive" }); return }
    setAiCourseGenerating(true)
    try {
      const response = await fetch("/api/super-admin/academy/generate-course", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiCourseDescription, category: aiCourseCategory, difficulty: aiCourseDifficulty }),
      })
      if (!response.ok) throw new Error("Failed")
      const data = await response.json()
      setGeneratedCourse(data.course)
      toast({ title: "Kurs generiert", description: "Der KI-generierte Kurs ist bereit." })
    } catch { toast({ title: "Fehler bei der Generierung", variant: "destructive" }) }
    finally { setAiCourseGenerating(false) }
  }

  const handleSaveAiCourse = async () => {
    if (!generatedCourse) return
    const previousCourses = [...courses]
    try {
      setCourses([...courses, { ...generatedCourse, id: `temp-${Date.now()}`, is_published: false, total_enrollments: 0, average_rating: 0, total_reviews: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
      const response = await fetch(`/api/practices/${PRACTICE_ID}/academy/courses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...generatedCourse, is_published: false }),
      })
      if (!response.ok) throw new Error("Failed")
      const savedCourse = await response.json()
      if (generatedCourse.modules?.length) {
        for (const mod of generatedCourse.modules) {
          const mr = await fetch(`/api/practices/${PRACTICE_ID}/academy/modules`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...mod, course_id: savedCourse.id }),
          })
          if (mr.ok && mod.lessons?.length) {
            const sm = await mr.json()
            for (const lesson of mod.lessons) {
              await fetch(`/api/practices/${PRACTICE_ID}/academy/lessons`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...lesson, module_id: sm.id, course_id: savedCourse.id }),
              })
            }
          }
        }
      }
      toast({ title: "Kurs gespeichert", description: `"${generatedCourse.title}" erstellt.` })
      setShowAiCourseDialog(false); setGeneratedCourse(null); setAiCourseDescription(""); fetchCourses()
    } catch {
      setCourses(previousCourses)
      toast({ title: "Fehler", description: "Problem beim Speichern.", variant: "destructive" })
    }
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title || "", description: course.description || "",
      category: course.category || "praxismanagement", difficulty_level: course.difficulty_level || "beginner",
      thumbnail_url: course.thumbnail_url || "", featured_image_url: course.featured_image_url || "",
      instructor_name: course.instructor_name || "", instructor_bio: course.instructor_bio || "",
      instructor_avatar_url: course.instructor_avatar_url || "",
      estimated_hours: course.estimated_hours || 1, xp_reward: course.xp_reward || 100,
      is_published: course.is_published || false, is_featured: course.is_featured || false,
      is_landing_page_featured: course.is_landing_page_featured || false,
      visibility: course.visibility || "logged_in", target_audience: course.target_audience || ["all"],
      tags: course.tags || [], learning_objectives: course.learning_objectives || [],
    })
    setShowCourseDialog(true)
  }

  const openEditBadge = (badge: AcademyBadge) => {
    setEditingBadge(badge)
    setBadgeForm({
      name: badge.name || "", description: badge.description || "",
      badge_type: badge.badge_type || "achievement", icon_name: badge.icon_name || "trophy",
      color: badge.color || "#3b82f6", rarity: badge.rarity || "common",
      xp_reward: badge.xp_reward || 50, is_active: badge.is_active !== false, criteria: badge.criteria || {},
      criteria_type: badge.criteria_type || "", criteria_value: badge.criteria_value || "",
    })
    setShowBadgeDialog(true)
  }

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setQuizForm({
      title: quiz.title || "", description: quiz.description || "",
      quiz_type: quiz.quiz_type || "multiple_choice",
      passing_score: quiz.passing_score || 70, max_attempts: quiz.max_attempts || 3,
      time_limit_minutes: quiz.time_limit_minutes || 15, xp_reward: quiz.xp_reward || 50,
      randomize_questions: quiz.randomize_questions || false,
      show_correct_answers: quiz.show_correct_answers !== false,
      course_id: quiz.course_id || "", module_id: quiz.module_id || "", lesson_id: quiz.lesson_id || "",
    })
    setShowQuizDialog(true)
  }

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course)
    fetchCourseModules(course.id)
    setActiveTab("content")
  }

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId])
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) || course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return {
    // Data
    courses, quizzes, badges, stats, loading, filteredCourses,
    courseModules, expandedModules, selectedCourse,
    // Tab
    activeTab, setActiveTab, searchTerm, setSearchTerm, categoryFilter, setCategoryFilter,
    // Dialogs
    showCourseDialog, setShowCourseDialog, showModuleDialog, setShowModuleDialog,
    showLessonDialog, setShowLessonDialog, showQuizDialog, setShowQuizDialog,
    showBadgeDialog, setShowBadgeDialog, showDeleteDialog, setShowDeleteDialog,
    showAiCourseDialog, setShowAiCourseDialog,
    // AI
    aiCourseDescription, setAiCourseDescription, aiCourseCategory, setAiCourseCategory,
    aiCourseDifficulty, setAiCourseDifficulty, aiCourseGenerating, generatedCourse, setGeneratedCourse,
    // Editing
    editingCourse, setEditingCourse, editingModule, setEditingModule,
    editingLesson, setEditingLesson, editingQuiz, setEditingQuiz,
    editingBadge, setEditingBadge, deleteItem, setDeleteItem,
    // Forms
    courseForm, setCourseForm, moduleForm, setModuleForm, lessonForm, setLessonForm, badgeForm, setBadgeForm,
    quizForm, setQuizForm,
    // Actions
    handleSaveCourse, handleSaveModule, handleSaveBadge, handleSaveQuiz, handleDelete,
    handleGenerateAiCourse, handleSaveAiCourse,
    openEditCourse, openEditBadge, openEditQuiz, handleSelectCourse, toggleModuleExpanded,
    resetCourseForm, resetModuleForm, resetLessonForm, resetBadgeForm, resetQuizForm,
    setSelectedCourse, fetchCourseModules,
  }
}
