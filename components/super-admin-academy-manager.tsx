"use client"

import { Separator } from "@/components/ui/separator"

import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  MoreHorizontal,
  GraduationCap,
  BookOpen,
  Users,
  Star,
  Clock,
  Trophy,
  Layers,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  HelpCircle,
  Award,
  Sparkles,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Medal,
  Crown,
  Flame,
  CheckCircle,
  Globe,
  Loader2,
  Wand2,
  Save,
  Heart,
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  category: string
  difficulty_level: string
  thumbnail_url: string
  featured_image_url: string
  instructor_name: string
  instructor_bio: string
  instructor_avatar_url: string
  estimated_hours: number
  xp_reward: number
  is_published: boolean
  is_featured: boolean
  is_landing_page_featured: boolean
  visibility: "public" | "logged_in" | "premium"
  target_audience: string[]
  total_enrollments: number
  average_rating: number
  total_reviews: number
  tags: string[]
  learning_objectives: string[]
  created_at: string
  updated_at: string
}

interface Module {
  id: string
  course_id: string
  title: string
  description: string
  display_order: number
  estimated_minutes: number
  is_published: boolean
  lessons?: Lesson[]
}

interface Lesson {
  id: string
  module_id: string
  course_id: string
  title: string
  description: string
  content: string
  lesson_type: string
  video_url: string
  video_duration_seconds: number
  estimated_minutes: number
  xp_reward: number
  display_order: number
  is_published: boolean
  is_free_preview: boolean
  resources: any[]
}

interface Quiz {
  id: string
  course_id: string
  module_id: string
  lesson_id: string
  title: string
  description: string
  quiz_type: string
  passing_score: number
  max_attempts: number
  time_limit_minutes: number
  xp_reward: number
  randomize_questions: boolean
  show_correct_answers: boolean
  questions?: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: string
  explanation: string
  points: number
  display_order: number
  options?: QuizOption[]
}

interface QuizOption {
  id: string
  question_id: string
  option_text: string
  is_correct: boolean
  explanation: string
  display_order: number
}

interface AcademyBadge {
  id: string
  name: string
  description: string
  badge_type: string
  icon_name: string
  icon_url: string
  color: string
  rarity: string
  xp_reward: number
  criteria: any
  is_active: boolean
  display_order: number
}

interface AcademyStats {
  totalCourses: number
  publishedCourses: number
  totalEnrollments: number
  totalLessons: number
  totalQuizzes: number
  totalBadges: number
  averageRating: number
  completionRate: number
}

const CATEGORIES = [
  { value: "praxismanagement", label: "Praxismanagement" },
  { value: "kommunikation", label: "Kommunikation" },
  { value: "digitalisierung", label: "Digitalisierung" },
  { value: "teamfuehrung", label: "Teamführung" },
  { value: "qualitaetsmanagement", label: "Qualitätsmanagement" },
  { value: "abrechnung", label: "Abrechnung" },
  { value: "patientenbetreuung", label: "Patientenbetreuung" },
  { value: "hygiene", label: "Hygiene" },
  { value: "marketing", label: "Marketing" },
  { value: "rechtliches", label: "Rechtliches" },
]

const DIFFICULTY_LEVELS = [
  { value: "beginner", label: "Einsteiger", color: "bg-green-500" },
  { value: "intermediate", label: "Fortgeschritten", color: "bg-yellow-500" },
  { value: "advanced", label: "Experte", color: "bg-red-500" },
]

const BADGE_TYPES = [
  { value: "achievement", label: "Achievement", icon: Trophy },
  { value: "milestone", label: "Meilenstein", icon: Target },
  { value: "streak", label: "Streak", icon: Flame },
  { value: "skill", label: "Skill", icon: Zap },
  { value: "completion", label: "Abschluss", icon: CheckCircle },
  { value: "special", label: "Spezial", icon: Crown },
]

const BADGE_RARITIES = [
  { value: "common", label: "Gewöhnlich", color: "text-gray-500" },
  { value: "uncommon", label: "Ungewöhnlich", color: "text-green-500" },
  { value: "rare", label: "Selten", color: "text-blue-500" },
  { value: "epic", label: "Episch", color: "text-purple-500" },
  { value: "legendary", label: "Legendär", color: "text-amber-500" },
]

const BADGE_ICONS = [
  { value: "trophy", label: "Pokal", icon: Trophy },
  { value: "award", label: "Auszeichnung", icon: Award },
  { value: "medal", label: "Medaille", icon: Medal },
  { value: "star", icon: Star },
  { value: "crown", icon: Crown },
  { value: "flame", icon: Flame },
  { value: "zap", icon: Zap },
  { value: "target", icon: Target },
  { value: "heart", icon: Heart },
  { value: "sparkles", icon: Sparkles },
]

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Öffentlich", description: "Für alle Besucher sichtbar (auch ohne Login)", icon: Globe },
  { value: "logged_in", label: "Angemeldete Nutzer", description: "Nur für eingeloggte Benutzer", icon: Users },
  { value: "premium", label: "Premium", description: "Nur für zahlende Abonnenten", icon: Crown },
]

const TARGET_AUDIENCE_OPTIONS = [
  { value: "all", label: "Alle" },
  { value: "admin", label: "Administratoren" },
  { value: "manager", label: "Praxismanager" },
  { value: "employee", label: "Mitarbeiter" },
  { value: "external", label: "Externe Benutzer" },
]

const HARDCODED_PRACTICE_ID = "1"

export function SuperAdminAcademyManager() {
  const [courses, setCourses] = useState<Course[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [badges, setBadges] = useState<AcademyBadge[]>([])
  const [stats, setStats] = useState<AcademyStats | null>(null)
  const [loading, setLoading] = useState(true)
  const fetchedRef = useRef(false)

  const fetchCourses = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/courses`)
      if (response.ok) {
        const data = await response.json()
        const coursesArray = Array.isArray(data) ? data : data.courses || []
        setCourses(coursesArray)
      }
    } catch (error) {
      console.error("[v0] Error fetching courses:", error)
    }
  }, [])

  const fetchQuizzes = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/quizzes`)
      if (response.ok) {
        const data = await response.json()
        const quizzesArray = Array.isArray(data) ? data : data.quizzes || []
        setQuizzes(quizzesArray)
      }
    } catch (error) {
      console.error("[v0] Error fetching quizzes:", error)
    }
  }, [])

  const fetchBadges = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/badges`)
      if (response.ok) {
        const data = await response.json()
        const badgesArray = Array.isArray(data) ? data : data.badges || []
        setBadges(badgesArray)
      }
    } catch (error) {
      console.error("[v0] Error fetching badges:", error)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    }
  }, [])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([fetchCourses(), fetchQuizzes(), fetchBadges(), fetchStats()])
    } finally {
      setLoading(false)
    }
  }, [fetchCourses, fetchQuizzes, fetchBadges, fetchStats])

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchAllData()
  }, [fetchAllData])

  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Dialog states
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [showModuleDialog, setShowModuleDialog] = useState(false)
  const [showLessonDialog, setShowLessonDialog] = useState(false)
  const [showQuizDialog, setShowQuizDialog] = useState(false)
  const [showBadgeDialog, setShowBadgeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAiCourseDialog, setShowAiCourseDialog] = useState(false)
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
    title: "",
    description: "",
    category: "praxismanagement",
    difficulty_level: "beginner",
    thumbnail_url: "",
    featured_image_url: "",
    instructor_name: "",
    instructor_bio: "",
    instructor_avatar_url: "",
    estimated_hours: 1,
    xp_reward: 100,
    is_published: false,
    is_featured: false,
    is_landing_page_featured: false,
    visibility: "logged_in" as "public" | "logged_in" | "premium",
    target_audience: ["all"] as string[],
    tags: [] as string[],
    learning_objectives: [],
  })

  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    estimated_minutes: 30,
    is_published: false,
  })

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    content: "",
    lesson_type: "video",
    video_url: "",
    video_duration_seconds: 0,
    estimated_minutes: 10,
    xp_reward: 25,
    is_published: false,
    is_free_preview: false,
  })

  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    quiz_type: "lesson",
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: 15,
    xp_reward: 50,
    randomize_questions: true,
    show_correct_answers: true,
    course_id: "",
    module_id: "",
    lesson_id: "",
  })

  const [badgeForm, setBadgeForm] = useState({
    name: "",
    description: "",
    badge_type: "achievement",
    icon_name: "trophy",
    color: "#3b82f6",
    rarity: "common",
    xp_reward: 50,
    is_active: true,
    criteria: {} as any,
  })

  const fetchCourseModules = useCallback(async (courseId: string) => {
    try {
      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/modules?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const modulesData = Array.isArray(data) ? data : data.modules || []

        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: Module) => {
            const lessonsResponse = await fetch(
              `/api/practices/${HARDCODED_PRACTICE_ID}/academy/lessons?module_id=${module.id}`,
            )
            if (lessonsResponse.ok) {
              const lessonsData = await lessonsResponse.json()
              const lessons = Array.isArray(lessonsData) ? lessonsData : lessonsData.lessons || []
              return { ...module, lessons }
            }
            return { ...module, lessons: [] }
          }),
        )

        setCourseModules(modulesWithLessons)
      }
    } catch (error) {
      console.error("[v0] Error fetching course modules:", error)
    }
  }, [])

  const handleSaveCourse = async () => {
    const isEditing = !!editingCourse
    const optimisticCourse: Course = {
      ...courseForm,
      id: editingCourse?.id || `temp-${Date.now()}`,
      total_enrollments: editingCourse?.total_enrollments || 0,
      average_rating: editingCourse?.average_rating || 0,
      total_reviews: editingCourse?.total_reviews || 0,
      created_at: editingCourse?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Course

    const previousCourses = [...courses]

    try {
      // Optimistic update
      if (isEditing) {
        setCourses(courses.map((c) => (c.id === editingCourse.id ? optimisticCourse : c)))
      } else {
        setCourses([...courses, optimisticCourse])
      }

      const url = isEditing
        ? `/api/practices/${HARDCODED_PRACTICE_ID}/academy/courses/${editingCourse.id}`
        : `/api/practices/${HARDCODED_PRACTICE_ID}/academy/courses`

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      })

      if (!response.ok) {
        throw new Error("Failed to save course")
      }

      toast({
        title: isEditing ? "Kurs aktualisiert" : "Kurs erstellt",
        description: `"${courseForm.title}" wurde erfolgreich ${isEditing ? "aktualisiert" : "erstellt"}.`,
      })

      setShowCourseDialog(false)
      setEditingCourse(null)
      resetCourseForm()
      fetchCourses()
    } catch (error) {
      console.error("Error saving course:", error)
      setCourses(previousCourses)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des Kurses.",
        variant: "destructive",
      })
    }
  }

  const handleSaveModule = async () => {
    if (!selectedCourse) {
      toast({ title: "Fehler", description: "Kein Kurs ausgewählt.", variant: "destructive" })
      return
    }

    const isEditing = !!editingModule
    const optimisticModule: Module = {
      ...moduleForm,
      id: editingModule?.id || `temp-${Date.now()}`,
      course_id: selectedCourse.id,
      display_order: editingModule?.display_order || courseModules.length,
      lessons: editingModule?.lessons || [],
    }

    const previousModules = [...courseModules]

    try {
      // Optimistic update
      if (isEditing) {
        setCourseModules(courseModules.map((m) => (m.id === editingModule.id ? optimisticModule : m)))
      } else {
        setCourseModules([...courseModules, optimisticModule])
      }

      const url = isEditing
        ? `/api/practices/${HARDCODED_PRACTICE_ID}/academy/modules/${editingModule.id}`
        : `/api/practices/${HARDCODED_PRACTICE_ID}/academy/modules`

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...moduleForm,
          course_id: selectedCourse.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save module")
      }

      toast({
        title: isEditing ? "Modul aktualisiert" : "Modul erstellt",
        description: `"${moduleForm.title}" wurde erfolgreich ${isEditing ? "aktualisiert" : "erstellt"}.`,
      })

      setShowModuleDialog(false)
      setEditingModule(null)
      resetModuleForm()
      // Revalidate
      fetchCourseModules(selectedCourse.id)
    } catch (error) {
      console.error("Error saving module:", error)
      setCourseModules(previousModules)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des Moduls.",
        variant: "destructive",
      })
    }
  }

  const handleSaveBadge = async () => {
    const isEditing = !!editingBadge
    const optimisticBadge: AcademyBadge = {
      ...badgeForm,
      id: editingBadge?.id || `temp-${Date.now()}`,
      icon_url: "",
      display_order: editingBadge?.display_order || badges.length,
    }

    const previousBadges = [...badges]

    try {
      // Optimistic update
      if (isEditing) {
        setBadges(badges.map((b) => (b.id === editingBadge.id ? optimisticBadge : b)))
      } else {
        setBadges([...badges, optimisticBadge])
      }

      const url = isEditing
        ? `/api/practices/${HARDCODED_PRACTICE_ID}/academy/badges/${editingBadge.id}`
        : `/api/practices/${HARDCODED_PRACTICE_ID}/academy/badges`

      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeForm),
      })

      if (!response.ok) {
        throw new Error("Failed to save badge")
      }

      toast({
        title: isEditing ? "Badge aktualisiert" : "Badge erstellt",
        description: `"${badgeForm.name}" wurde erfolgreich ${isEditing ? "aktualisiert" : "erstellt"}.`,
      })

      setShowBadgeDialog(false)
      setEditingBadge(null)
      resetBadgeForm()
      fetchBadges()
    } catch (error) {
      console.error("Error saving badge:", error)
      setBadges(previousBadges)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des Badges.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    const previousCourses = [...courses]
    const previousQuizzes = [...quizzes]
    const previousBadges = [...badges]
    const previousModules = [...courseModules]

    try {
      let endpoint = ""
      switch (deleteItem.type) {
        case "course":
          // Optimistic update
          setCourses(courses.filter((c) => c.id !== deleteItem.id))
          endpoint = `/api/practices/${HARDCODED_PRACTICE_ID}/academy/courses/${deleteItem.id}`
          break
        case "module":
          setCourseModules(courseModules.filter((m) => m.id !== deleteItem.id))
          endpoint = `/api/practices/${HARDCODED_PRACTICE_ID}/academy/modules/${deleteItem.id}`
          break
        case "lesson":
          setCourseModules(
            courseModules.map((m) => ({
              ...m,
              lessons: m.lessons?.filter((l) => l.id !== deleteItem.id) || [],
            })),
          )
          endpoint = `/api/practices/${HARDCODED_PRACTICE_ID}/academy/lessons/${deleteItem.id}`
          break
        case "quiz":
          setQuizzes(quizzes.filter((q) => q.id !== deleteItem.id))
          endpoint = `/api/practices/${HARDCODED_PRACTICE_ID}/academy/quizzes/${deleteItem.id}`
          break
        case "badge":
          setBadges(badges.filter((b) => b.id !== deleteItem.id))
          endpoint = `/api/practices/${HARDCODED_PRACTICE_ID}/academy/badges/${deleteItem.id}`
          break
      }

      const response = await fetch(endpoint, { method: "DELETE" })

      if (!response.ok) {
        throw new Error("Failed to delete")
      }

      toast({
        title: "Erfolgreich gelöscht",
        description: `"${deleteItem.name}" wurde gelöscht.`,
      })

      setShowDeleteDialog(false)
      setDeleteItem(null)

      if (deleteItem.type === "course") fetchCourses()
      if (deleteItem.type === "quiz") fetchQuizzes()
      if (deleteItem.type === "badge") fetchBadges()
      if (selectedCourse && (deleteItem.type === "module" || deleteItem.type === "lesson")) {
        fetchCourseModules(selectedCourse.id)
      }
    } catch (error) {
      console.error("Error deleting:", error)
      setCourses(previousCourses)
      setQuizzes(previousQuizzes)
      setBadges(previousBadges)
      setCourseModules(previousModules)
      toast({
        title: "Fehler beim Löschen",
        description: "Es gab ein Problem beim Löschen.",
        variant: "destructive",
      })
    }
  }

  const resetCourseForm = () => {
    setCourseForm({
      title: "",
      description: "",
      category: "praxismanagement",
      difficulty_level: "beginner",
      thumbnail_url: "",
      featured_image_url: "",
      instructor_name: "",
      instructor_bio: "",
      instructor_avatar_url: "",
      estimated_hours: 1,
      xp_reward: 100,
      is_published: false,
      is_featured: false,
      is_landing_page_featured: false,
      visibility: "logged_in",
      target_audience: ["all"],
      tags: [],
      learning_objectives: [],
    })
  }

  const resetModuleForm = () => {
    setModuleForm({
      title: "",
      description: "",
      estimated_minutes: 30,
      is_published: false,
    })
  }

  const resetLessonForm = () => {
    setLessonForm({
      title: "",
      description: "",
      content: "",
      lesson_type: "video",
      video_url: "",
      video_duration_seconds: 0,
      estimated_minutes: 10,
      xp_reward: 25,
      is_published: false,
      is_free_preview: false,
    })
  }

  const resetBadgeForm = () => {
    setBadgeForm({
      name: "",
      description: "",
      badge_type: "achievement",
      icon_name: "trophy",
      color: "#3b82f6",
      rarity: "common",
      xp_reward: 50,
      is_active: true,
      criteria: {},
    })
  }

  // AI Course generation
  const handleGenerateAiCourse = async () => {
    if (!aiCourseDescription.trim()) {
      toast({
        title: "Beschreibung fehlt",
        description: "Bitte geben Sie eine Kursbeschreibung ein.",
        variant: "destructive",
      })
      return
    }

    setAiCourseGenerating(true)
    try {
      const response = await fetch("/api/super-admin/academy/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiCourseDescription,
          category: aiCourseCategory,
          difficulty: aiCourseDifficulty,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate course")
      }

      const data = await response.json()
      setGeneratedCourse(data.course)

      toast({
        title: "Kurs generiert",
        description: "Der KI-generierte Kurs ist bereit zur Überprüfung.",
      })
    } catch (error) {
      console.error("Error generating AI course:", error)
      toast({
        title: "Fehler bei der Generierung",
        description: "Es gab ein Problem bei der KI-Generierung.",
        variant: "destructive",
      })
    } finally {
      setAiCourseGenerating(false)
    }
  }

  const handleSaveAiCourse = async () => {
    if (!generatedCourse) return

    const optimisticCourse: Course = {
      ...generatedCourse,
      id: `temp-${Date.now()}`,
      is_published: false,
      total_enrollments: 0,
      average_rating: 0,
      total_reviews: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const previousCourses = [...courses]

    try {
      // Optimistic update
      setCourses([...courses, optimisticCourse])

      const response = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...generatedCourse,
          is_published: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save AI course")
      }

      const savedCourse = await response.json()

      // Save modules and lessons if they exist
      if (generatedCourse.modules && Array.isArray(generatedCourse.modules)) {
        for (const module of generatedCourse.modules) {
          const moduleResponse = await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/modules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...module,
              course_id: savedCourse.id,
            }),
          })

          if (moduleResponse.ok && module.lessons && Array.isArray(module.lessons)) {
            const savedModule = await moduleResponse.json()
            for (const lesson of module.lessons) {
              await fetch(`/api/practices/${HARDCODED_PRACTICE_ID}/academy/lessons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ...lesson,
                  module_id: savedModule.id,
                  course_id: savedCourse.id,
                }),
              })
            }
          }
        }
      }

      toast({
        title: "Kurs gespeichert",
        description: `"${generatedCourse.title}" wurde erfolgreich erstellt.`,
      })

      setShowAiCourseDialog(false)
      setGeneratedCourse(null)
      setAiCourseDescription("")
      fetchCourses()
    } catch (error) {
      console.error("Error saving AI course:", error)
      setCourses(previousCourses)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des KI-Kurses.",
        variant: "destructive",
      })
    }
  }

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getDifficultyBadge = (level: string) => {
    const difficulty = DIFFICULTY_LEVELS.find((d) => d.value === level)
    return difficulty ? (
      <Badge className={`${difficulty.color} text-white`}>{difficulty.label}</Badge>
    ) : (
      <Badge variant="secondary">{level}</Badge>
    )
  }

  const getBadgeIcon = (iconName: string) => {
    const iconConfig = BADGE_ICONS.find((i) => i.value === iconName)
    if (iconConfig) {
      const IconComponent = iconConfig.icon
      return <IconComponent className="h-5 w-5" />
    }
    return <Trophy className="h-5 w-5" />
  }

  const openEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "praxismanagement",
      difficulty_level: course.difficulty_level || "beginner",
      thumbnail_url: course.thumbnail_url || "",
      featured_image_url: course.featured_image_url || "",
      instructor_name: course.instructor_name || "",
      instructor_bio: course.instructor_bio || "",
      instructor_avatar_url: course.instructor_avatar_url || "",
      estimated_hours: course.estimated_hours || 1,
      xp_reward: course.xp_reward || 100,
      is_published: course.is_published || false,
      is_featured: course.is_featured || false,
      is_landing_page_featured: course.is_landing_page_featured || false,
      visibility: course.visibility || "logged_in",
      target_audience: course.target_audience || ["all"],
      tags: course.tags || [],
      learning_objectives: course.learning_objectives || [],
    })
    setShowCourseDialog(true)
  }

  const openEditBadge = (badge: AcademyBadge) => {
    setEditingBadge(badge)
    setBadgeForm({
      name: badge.name || "",
      description: badge.description || "",
      badge_type: badge.badge_type || "achievement",
      icon_name: badge.icon_name || "trophy",
      color: badge.color || "#3b82f6",
      rarity: badge.rarity || "common",
      xp_reward: badge.xp_reward || 50,
      is_active: badge.is_active !== false,
      criteria: badge.criteria || {},
    })
    setShowBadgeDialog(true)
  }

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course)
    fetchCourseModules(course.id)
    setActiveTab("content")
  }

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  // Render overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kurse gesamt</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCourses || courses.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.publishedCourses || courses.filter((c) => c.is_published).length || 0} veröffentlicht
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Einschreibungen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.completionRate || 0}% Abschlussrate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lektionen</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.totalQuizzes || quizzes.length || 0} Quizze</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bewertung</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats?.averageRating?.toFixed(1) || "4.5"}
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Durchschnittliche Bewertung</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Courses & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Neueste Kurse</CardTitle>
            <CardDescription>Zuletzt erstellte oder aktualisierte Kurse</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Noch keine Kurse vorhanden</p>
            ) : (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSelectCourse(course)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
                        </p>
                      </div>
                    </div>
                    {getDifficultyBadge(course.difficulty_level)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Badges</CardTitle>
            <CardDescription>Verfügbare Gamification-Badges</CardDescription>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Noch keine Badges vorhanden</p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {badges.slice(0, 8).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => openEditBadge(badge)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: badge.color + "20", color: badge.color }}
                    >
                      {getBadgeIcon(badge.icon_name)}
                    </div>
                    <p className="text-xs font-medium mt-1 text-center truncate w-full">{badge.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Render courses tab
  const renderCourses = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kurse suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            resetCourseForm()
            setEditingCourse(null)
            setShowCourseDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kurs
        </Button>
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Kurse gefunden</h3>
            <p className="text-muted-foreground">Erstellen Sie Ihren ersten Kurs</p>
            <Button
              className="mt-4"
              onClick={() => {
                resetCourseForm()
                setEditingCourse(null)
                setShowCourseDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Kurs erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="overflow-hidden">
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url || "/placeholder.svg"}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <GraduationCap className="h-12 w-12 text-primary/40" />
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">{course.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleSelectCourse(course)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Inhalt verwalten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditCourse(course)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteItem({ type: "course", id: course.id, name: course.title })
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {getDifficultyBadge(course.difficulty_level)}
                  <Badge variant="outline">
                    {CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
                  </Badge>
                  {course.is_published ? (
                    <Badge variant="default" className="bg-green-500">
                      Veröffentlicht
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Entwurf</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {course.estimated_hours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {course.xp_reward} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {course.total_enrollments || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Render badges tab
  const renderBadges = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Gamification Badges</h3>
          <p className="text-sm text-muted-foreground">Verwalten Sie Auszeichnungen und Achievements</p>
        </div>
        <Button
          onClick={() => {
            resetBadgeForm()
            setEditingBadge(null)
            setShowBadgeDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Badge
        </Button>
      </div>

      {badges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Badges vorhanden</h3>
            <p className="text-muted-foreground">Erstellen Sie Ihr erstes Badge</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <Card key={badge.id} className="overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: badge.color + "20", color: badge.color }}
                  >
                    {getBadgeIcon(badge.icon_name)}
                  </div>
                  <h4 className="font-medium">{badge.name}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{badge.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="outline" className={BADGE_RARITIES.find((r) => r.value === badge.rarity)?.color}>
                      {BADGE_RARITIES.find((r) => r.value === badge.rarity)?.label || badge.rarity}
                    </Badge>
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      {badge.xp_reward} XP
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-center gap-2 border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => openEditBadge(badge)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Bearbeiten
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive bg-transparent"
                  onClick={() => {
                    setDeleteItem({ type: "badge", id: badge.id, name: badge.name })
                    setShowDeleteDialog(true)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Render content tab (modules/lessons for selected course)
  const renderContent = () => {
    if (!selectedCourse) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Kein Kurs ausgewählt</h3>
            <p className="text-muted-foreground">Wählen Sie einen Kurs aus der Liste aus</p>
            <Button className="mt-4 bg-transparent" variant="outline" onClick={() => setActiveTab("courses")}>
              Zur Kursliste
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {/* Course Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{selectedCourse.title}</CardTitle>
                <CardDescription>{selectedCourse.description}</CardDescription>
              </div>
              <Button variant="outline" onClick={() => setSelectedCourse(null)}>
                Zurück zur Liste
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Add Module Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetModuleForm()
              setEditingModule(null)
              setShowModuleDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neues Modul
          </Button>
        </div>

        {/* Modules & Lessons */}
        {courseModules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Keine Module vorhanden</h3>
              <p className="text-muted-foreground">Erstellen Sie das erste Modul für diesen Kurs</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {courseModules.map((module, moduleIndex) => (
              <Card key={module.id}>
                <CardHeader className="cursor-pointer" onClick={() => toggleModuleExpanded(module.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedModules.includes(module.id) ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <div>
                        <CardTitle className="text-base">
                          Modul {moduleIndex + 1}: {module.title}
                        </CardTitle>
                        <CardDescription>
                          {module.lessons?.length || 0} Lektionen • {module.estimated_minutes} Min
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {module.is_published ? (
                        <Badge variant="default" className="bg-green-500">
                          Veröffentlicht
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Entwurf</Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingModule(module)
                              setModuleForm({
                                title: module.title,
                                description: module.description,
                                estimated_minutes: module.estimated_minutes,
                                is_published: module.is_published,
                              })
                              setShowModuleDialog(true)
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteItem({ type: "module", id: module.id, name: module.title })
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>

                {expandedModules.includes(module.id) && (
                  <CardContent className="pt-0">
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      {module.lessons?.map((lesson, lessonIndex) => (
                        <div key={lesson.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            {lesson.lesson_type === "video" ? (
                              <Play className="h-4 w-4 text-primary" />
                            ) : lesson.lesson_type === "quiz" ? (
                              <HelpCircle className="h-4 w-4 text-primary" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {lessonIndex + 1}. {lesson.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {lesson.estimated_minutes} Min • {lesson.xp_reward} XP
                                {lesson.is_free_preview && " • Kostenlose Vorschau"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lesson.is_published ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Live
                              </Badge>
                            ) : (
                              <Badge variant="outline">Entwurf</Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingLesson(lesson)
                                    setLessonForm({
                                      title: lesson.title,
                                      description: lesson.description,
                                      content: lesson.content,
                                      lesson_type: lesson.lesson_type,
                                      video_url: lesson.video_url,
                                      video_duration_seconds: lesson.video_duration_seconds,
                                      estimated_minutes: lesson.estimated_minutes,
                                      xp_reward: lesson.xp_reward,
                                      is_published: lesson.is_published,
                                      is_free_preview: lesson.is_free_preview,
                                    })
                                    setShowLessonDialog(true)
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setDeleteItem({ type: "lesson", id: lesson.id, name: lesson.title })
                                    setShowDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2 bg-transparent"
                        onClick={() => {
                          resetLessonForm()
                          setEditingLesson(null)
                          setEditingModule(module)
                          setShowLessonDialog(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Lektion hinzufügen
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Render quizzes tab
  const renderQuizzes = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Quizze</h3>
          <p className="text-sm text-muted-foreground">Verwalten Sie Quizze und Tests</p>
        </div>
        <Button
          onClick={() => {
            setEditingQuiz(null)
            setShowQuizDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neues Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HelpCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Quizze vorhanden</h3>
            <p className="text-muted-foreground">Erstellen Sie Ihr erstes Quiz</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Bestehensgrenze</TableHead>
              <TableHead>Zeitlimit</TableHead>
              <TableHead>XP</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz.id}>
                <TableCell className="font-medium">{quiz.title}</TableCell>
                <TableCell>
                  <Badge variant="outline">{quiz.quiz_type}</Badge>
                </TableCell>
                <TableCell>{quiz.passing_score}%</TableCell>
                <TableCell>{quiz.time_limit_minutes} Min</TableCell>
                <TableCell>{quiz.xp_reward} XP</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingQuiz(quiz)
                          setShowQuizDialog(true)
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setDeleteItem({ type: "quiz", id: quiz.id, name: quiz.title })
                          setShowDeleteDialog(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Academy Verwaltung</h1>
          <p className="text-muted-foreground">Verwalten Sie Kurse, Lektionen, Quizze und Gamification</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetCourseForm()
              setEditingCourse(null)
              setShowCourseDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kurs
          </Button>
          <Button variant="outline" onClick={() => setShowAiCourseDialog(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Kurs mit KI erstellen
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="courses">
            <GraduationCap className="h-4 w-4 mr-2" />
            Kurse
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <HelpCircle className="h-4 w-4 mr-2" />
            Quizze
          </TabsTrigger>
          <TabsTrigger value="badges">
            <Award className="h-4 w-4 mr-2" />
            Badges
          </TabsTrigger>
          <TabsTrigger value="content" disabled={!selectedCourse}>
            <Layers className="h-4 w-4 mr-2" />
            Kursinhalt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        <TabsContent value="courses" className="mt-6">
          {renderCourses()}
        </TabsContent>
        <TabsContent value="quizzes" className="mt-6">
          {renderQuizzes()}
        </TabsContent>
        <TabsContent value="badges" className="mt-6">
          {renderBadges()}
        </TabsContent>
        <TabsContent value="content" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Kurs bearbeiten" : "Neuer Kurs"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Bearbeiten Sie die Kursdetails" : "Erstellen Sie einen neuen Kurs"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="Kursname eingeben"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Kursbeschreibung eingeben"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kategorie</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Schwierigkeitsgrad</Label>
                <Select
                  value={courseForm.difficulty_level}
                  onValueChange={(value) => setCourseForm({ ...courseForm, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label>Sichtbarkeit</Label>
              <Select
                value={courseForm.visibility}
                onValueChange={(value: "public" | "logged_in" | "premium") =>
                  setCourseForm({ ...courseForm, visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        <div>
                          <div>{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estimated_hours">Geschätzte Dauer (Stunden)</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  value={courseForm.estimated_hours}
                  onChange={(e) => setCourseForm({ ...courseForm, estimated_hours: Number(e.target.value) })}
                  min={1}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="xp_reward">XP Belohnung</Label>
                <Input
                  id="xp_reward"
                  type="number"
                  value={courseForm.xp_reward}
                  onChange={(e) => setCourseForm({ ...courseForm, xp_reward: Number(e.target.value) })}
                  min={0}
                  step={25}
                />
              </div>
            </div>

            <Separator />

            <div className="grid gap-2">
              <Label htmlFor="instructor_name">Dozent Name</Label>
              <Input
                id="instructor_name"
                value={courseForm.instructor_name}
                onChange={(e) => setCourseForm({ ...courseForm, instructor_name: e.target.value })}
                placeholder="Name des Dozenten"
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Veröffentlicht</Label>
                <p className="text-sm text-muted-foreground">Kurs für Benutzer sichtbar machen</p>
              </div>
              <Switch
                checked={courseForm.is_published}
                onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_published: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auf Landingpage anzeigen</Label>
                <p className="text-sm text-muted-foreground">Kurs auf der öffentlichen Seite hervorheben</p>
              </div>
              <Switch
                checked={courseForm.is_landing_page_featured}
                onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_landing_page_featured: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCourse}>
              <Save className="h-4 w-4 mr-2" />
              {editingCourse ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Modul bearbeiten" : "Neues Modul"}</DialogTitle>
            <DialogDescription>
              {editingModule ? "Bearbeiten Sie die Moduldetails" : "Erstellen Sie ein neues Modul"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="module_title">Titel</Label>
              <Input
                id="module_title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="Modulname eingeben"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="module_description">Beschreibung</Label>
              <Textarea
                id="module_description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Modulbeschreibung eingeben"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="module_minutes">Geschätzte Dauer (Minuten)</Label>
              <Input
                id="module_minutes"
                type="number"
                value={moduleForm.estimated_minutes}
                onChange={(e) => setModuleForm({ ...moduleForm, estimated_minutes: Number(e.target.value) })}
                min={1}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Veröffentlicht</Label>
                <p className="text-sm text-muted-foreground">Modul für Benutzer sichtbar machen</p>
              </div>
              <Switch
                checked={moduleForm.is_published}
                onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_published: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveModule}>
              <Save className="h-4 w-4 mr-2" />
              {editingModule ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBadge ? "Badge bearbeiten" : "Neues Badge"}</DialogTitle>
            <DialogDescription>
              {editingBadge ? "Bearbeiten Sie die Badge-Details" : "Erstellen Sie ein neues Badge"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="badge_name">Name</Label>
              <Input
                id="badge_name"
                value={badgeForm.name}
                onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                placeholder="Badge-Name eingeben"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="badge_description">Beschreibung</Label>
              <Textarea
                id="badge_description"
                value={badgeForm.description}
                onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                placeholder="Badge-Beschreibung eingeben"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Typ</Label>
                <Select
                  value={badgeForm.badge_type}
                  onValueChange={(value) => setBadgeForm({ ...badgeForm, badge_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Seltenheit</Label>
                <Select
                  value={badgeForm.rarity}
                  onValueChange={(value) => setBadgeForm({ ...badgeForm, rarity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_RARITIES.map((rarity) => (
                      <SelectItem key={rarity.value} value={rarity.value}>
                        {rarity.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Icon</Label>
                <Select
                  value={badgeForm.icon_name}
                  onValueChange={(value) => setBadgeForm({ ...badgeForm, icon_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_ICONS.map((icon) => {
                      const IconComponent = icon.icon
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {icon.label || icon.value}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="badge_color">Farbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="badge_color"
                    type="color"
                    value={badgeForm.color}
                    onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={badgeForm.color}
                    onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="badge_xp">XP Belohnung</Label>
              <Input
                id="badge_xp"
                type="number"
                value={badgeForm.xp_reward}
                onChange={(e) => setBadgeForm({ ...badgeForm, xp_reward: Number(e.target.value) })}
                min={0}
                step={25}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Aktiv</Label>
                <p className="text-sm text-muted-foreground">Badge kann verdient werden</p>
              </div>
              <Switch
                checked={badgeForm.is_active}
                onCheckedChange={(checked) => setBadgeForm({ ...badgeForm, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveBadge}>
              <Save className="h-4 w-4 mr-2" />
              {editingBadge ? "Speichern" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Course Dialog */}
      <Dialog open={showAiCourseDialog} onOpenChange={setShowAiCourseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Kurs mit KI erstellen
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie den gewünschten Kurs und lassen Sie die KI ihn generieren
            </DialogDescription>
          </DialogHeader>

          {!generatedCourse ? (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ai_description">Kursbeschreibung</Label>
                <Textarea
                  id="ai_description"
                  value={aiCourseDescription}
                  onChange={(e) => setAiCourseDescription(e.target.value)}
                  placeholder="Beschreiben Sie den Kurs, den Sie erstellen möchten. Z.B.: Ein Kurs über effiziente Terminplanung in der Zahnarztpraxis mit Fokus auf digitale Tools..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Kategorie</Label>
                  <Select value={aiCourseCategory} onValueChange={setAiCourseCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Schwierigkeitsgrad</Label>
                  <Select value={aiCourseDifficulty} onValueChange={setAiCourseDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <Card>
                <CardHeader>
                  <CardTitle>{generatedCourse.title}</CardTitle>
                  <CardDescription>{generatedCourse.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(generatedCourse.difficulty_level)}
                      <Badge variant="outline">
                        {CATEGORIES.find((c) => c.value === generatedCourse.category)?.label}
                      </Badge>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {generatedCourse.estimated_hours}h
                      </Badge>
                    </div>

                    {generatedCourse.modules && (
                      <div>
                        <h4 className="font-medium mb-2">Module ({generatedCourse.modules.length})</h4>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {generatedCourse.modules.map((module: any, index: number) => (
                              <div key={index} className="p-2 rounded bg-muted">
                                <p className="font-medium text-sm">
                                  {index + 1}. {module.title}
                                </p>
                                <p className="text-xs text-muted-foreground">{module.lessons?.length || 0} Lektionen</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAiCourseDialog(false)
                setGeneratedCourse(null)
              }}
            >
              Abbrechen
            </Button>
            {!generatedCourse ? (
              <Button onClick={handleGenerateAiCourse} disabled={aiCourseGenerating}>
                {aiCourseGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generieren
                  </>
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setGeneratedCourse(null)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Neu generieren
                </Button>
                <Button onClick={handleSaveAiCourse}>
                  <Save className="h-4 w-4 mr-2" />
                  Kurs speichern
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deleteItem?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
