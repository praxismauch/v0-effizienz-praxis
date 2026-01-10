"use client"

import { Separator } from "@/components/ui/separator"

import { useState, useCallback, useEffect } from "react"
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
  is_landing_page_featured: boolean // Added visibility setting
  visibility: "public" | "logged_in" | "premium" // Added visibility setting
  target_audience: string[] // Added target audience
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

export function SuperAdminAcademyManager() {
  const getEffectivePracticeId = () => {
    return "1" // Hardcoded for super-admin academy management
  }

  const [activeTab, setActiveTab] = useState("overview")
  const [courses, setCourses] = useState<Course[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [badges, setBadges] = useState<AcademyBadge[]>([])
  const [stats, setStats] = useState<AcademyStats | null>(null)
  const [loading, setLoading] = useState(true)
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
  const [aiCourseCategory, setAiCourseCategory] = useState("praxismanagement") // Changed default to match constant
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
    is_landing_page_featured: false, // Added
    visibility: "logged_in" as "public" | "logged_in" | "premium", // Added
    target_audience: ["all"] as string[], // Added
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const practiceId = getEffectivePracticeId()

      console.log("[v0] Academy: Fetching data for practice", practiceId)

      // Fetch stats from the new stats API
      const statsResponse = await fetch(`/api/practices/${practiceId}/academy/stats`)
      console.log("[v0] Academy: Stats response status", statsResponse.status)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        console.log("[v0] Academy: Stats data received", statsData)
        setStats(statsData)
      }

      // Fetch courses from the new API
      const coursesResponse = await fetch(`/api/practices/${practiceId}/academy/courses`)
      console.log("[v0] Academy: Courses response status", coursesResponse.status)
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        console.log("[v0] Academy: Courses data received", coursesData)
        console.log("[v0] Academy: Courses array", coursesData.courses)
        setCourses(coursesData.courses || [])
      } else {
        const errorText = await coursesResponse.text()
        console.error("[v0] Academy: Courses fetch error", coursesResponse.status, errorText)
      }

      // Fetch quizzes from the new API
      const quizzesResponse = await fetch(`/api/practices/${practiceId}/academy/quizzes`)
      console.log("[v0] Academy: Quizzes response status", quizzesResponse.status)
      if (quizzesResponse.ok) {
        const quizzesData = await quizzesResponse.json()
        console.log("[v0] Academy: Quizzes data received", quizzesData)
        setQuizzes(quizzesData.quizzes || [])
      }

      // Fetch badges from the new API
      const badgesResponse = await fetch(`/api/practices/${practiceId}/academy/badges`)
      console.log("[v0] Academy: Badges response status", badgesResponse.status)
      if (badgesResponse.ok) {
        const badgesData = await badgesResponse.json()
        console.log("[v0] Academy: Badges data received", badgesData)
        setBadges(badgesData.badges || [])
      }
    } catch (error) {
      console.error("[v0] Academy: Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchCourseModules = useCallback(async (courseId: string) => {
    const practiceId = getEffectivePracticeId()

    try {
      const response = await fetch(`/api/practices/${practiceId}/academy/modules?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const modulesData = data.modules || []

        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          modulesData.map(async (module: Module) => {
            const lessonsResponse = await fetch(`/api/practices/${practiceId}/academy/lessons?module_id=${module.id}`)
            if (lessonsResponse.ok) {
              const lessonsData = await lessonsResponse.json()
              return { ...module, lessons: lessonsData.lessons || [] }
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

  // Updated handleSaveCourse to include visibility
  const handleSaveCourse = async () => {
    const practiceId = getEffectivePracticeId()

    try {
      const url = editingCourse
        ? `/api/practices/${practiceId}/academy/courses/${editingCourse.id}`
        : `/api/practices/${practiceId}/academy/courses`

      const method = editingCourse ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(courseForm),
      })

      if (!response.ok) {
        throw new Error("Failed to save course")
      }

      toast({
        title: editingCourse ? "Kurs aktualisiert" : "Kurs erstellt",
        description: `"${courseForm.title}" wurde erfolgreich ${editingCourse ? "aktualisiert" : "erstellt"}.`,
      })

      setShowCourseDialog(false)
      setEditingCourse(null)
      resetCourseForm()
      fetchData()
    } catch (error) {
      console.error("Error saving course:", error)
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

    const practiceId = getEffectivePracticeId() // Get practiceId here

    const moduleData = {
      ...moduleForm,
      course_id: selectedCourse.id,
      updated_at: new Date().toISOString(),
    }

    try {
      // Assuming a new API route for saving modules
      const url = editingModule
        ? `/api/practices/${practiceId}/academy/modules/${editingModule.id}`
        : `/api/practices/${practiceId}/academy/modules`
      const method = editingModule ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      })

      if (!response.ok) {
        throw new Error(editingModule ? "Failed to update module" : "Failed to create module")
      }

      const savedModule = await response.json() // Assuming API returns the saved module

      toast({
        title: editingModule ? "Modul aktualisiert" : "Modul erstellt",
        description: `"${moduleForm.title}" wurde erfolgreich ${editingModule ? "aktualisiert" : "erstellt"}.`,
      })

      setShowModuleDialog(false)
      setEditingModule(null)
      resetModuleForm()
      fetchCourseModules(selectedCourse.id)
    } catch (error) {
      console.error("Error saving module:", error)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des Moduls.",
        variant: "destructive",
      })
    }
  }

  const handleSaveLesson = async () => {
    if (!selectedCourse || !editingModule) {
      toast({ title: "Fehler", description: "Kurs oder Modul nicht ausgewählt.", variant: "destructive" })
      return
    }

    const practiceId = getEffectivePracticeId() // Get practiceId here

    const lessonData = {
      ...lessonForm,
      course_id: selectedCourse.id,
      module_id: editingModule.id,
      updated_at: new Date().toISOString(),
    }

    try {
      // Assuming a new API route for saving lessons
      const url = editingLesson
        ? `/api/practices/${practiceId}/academy/lessons/${editingLesson.id}`
        : `/api/practices/${practiceId}/academy/lessons`
      const method = editingLesson ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lessonData),
      })

      if (!response.ok) {
        throw new Error(editingLesson ? "Failed to update lesson" : "Failed to create lesson")
      }

      const savedLesson = await response.json() // Assuming API returns the saved lesson

      toast({
        title: editingLesson ? "Lektion aktualisiert" : "Lektion erstellt",
        description: `"${lessonForm.title}" wurde erfolgreich ${editingLesson ? "aktualisiert" : "erstellt"}.`,
      })

      setShowLessonDialog(false)
      setEditingLesson(null)
      resetLessonForm()
      fetchCourseModules(selectedCourse.id)
    } catch (error) {
      console.error("Error saving lesson:", error)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern der Lektion.",
        variant: "destructive",
      })
    }
  }

  const handleSaveBadge = async () => {
    const practiceId = getEffectivePracticeId() // Get practiceId here

    const badgeData = {
      ...badgeForm,
      updated_at: new Date().toISOString(),
    }

    try {
      // Assuming a new API route for saving badges
      const url = editingBadge
        ? `/api/practices/${practiceId}/academy/badges/${editingBadge.id}`
        : `/api/practices/${practiceId}/academy/badges`
      const method = editingBadge ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeData),
      })

      if (!response.ok) {
        throw new Error(editingBadge ? "Failed to update badge" : "Failed to create badge")
      }

      toast({
        title: editingBadge ? "Badge aktualisiert" : "Badge erstellt",
        description: `"${badgeForm.name}" wurde erfolgreich ${editingBadge ? "aktualisiert" : "erstellt"}.`,
      })

      setShowBadgeDialog(false)
      setEditingBadge(null)
      resetBadgeForm()
      fetchData()
    } catch (error) {
      console.error("Error saving badge:", error)
      toast({
        title: "Fehler beim Speichern",
        description: "Es gab ein Problem beim Speichern des Badges.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateAiCourse = async () => {
    if (!aiCourseDescription.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Kursbeschreibung ein.",
        variant: "destructive",
      })
      return
    }

    setAiCourseGenerating(true)
    setGeneratedCourse(null)

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
        description: "Der Kurs wurde erfolgreich generiert. Überprüfen Sie die Details und speichern Sie.",
      })
    } catch (error) {
      console.error("Error generating course:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Generieren des Kurses. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    } finally {
      setAiCourseGenerating(false)
    }
  }

  const handleSaveGeneratedCourse = async () => {
    if (!generatedCourse) return

    const practiceId = getEffectivePracticeId()

    try {
      // Create the course
      const courseResponse = await fetch(`/api/practices/${practiceId}/academy/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generatedCourse.title,
          description: generatedCourse.description,
          category: aiCourseCategory,
          difficulty_level: aiCourseDifficulty,
          learning_objectives: generatedCourse.learning_objectives,
          target_audience: generatedCourse.target_audience || ["all"],
          estimated_hours: generatedCourse.estimated_hours,
          xp_reward: generatedCourse.xp_reward,
          instructor_name: generatedCourse.instructor_name,
          instructor_bio: generatedCourse.instructor_bio,
          is_published: false,
          is_featured: false,
          is_landing_page_featured: false,
          visibility: "logged_in",
        }),
      })

      if (!courseResponse.ok) {
        throw new Error("Failed to create course")
      }

      const { course } = await courseResponse.json()
      const courseId = course.id

      // Create modules and lessons
      for (let i = 0; i < generatedCourse.modules.length; i++) {
        const module = generatedCourse.modules[i]

        const moduleResponse = await fetch(`/api/practices/${practiceId}/academy/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            title: module.title,
            description: module.description,
            estimated_minutes: module.estimated_minutes,
            display_order: i + 1,
            is_published: false,
          }),
        })

        if (!moduleResponse.ok) {
          throw new Error(`Failed to create module: ${module.title}`)
        }

        const { module: createdModule } = await moduleResponse.json()
        const moduleId = createdModule.id

        // Create lessons for this module
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j]

          await fetch(`/api/practices/${practiceId}/academy/lessons`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              module_id: moduleId,
              course_id: courseId,
              title: lesson.title,
              description: lesson.description,
              content: lesson.content,
              lesson_type: lesson.lesson_type || "text",
              estimated_minutes: lesson.estimated_minutes,
              xp_reward: lesson.xp_reward,
              display_order: j + 1,
              is_published: false,
              is_free_preview: false,
            }),
          })
        }
      }

      toast({
        title: "KI-Kurs gespeichert",
        description: `Der generierte Kurs "${generatedCourse.title}" wurde erfolgreich gespeichert.`,
      })

      setShowAiCourseDialog(false)
      setGeneratedCourse(null)
      setAiCourseDescription("")
      fetchData()
    } catch (error) {
      console.error("[v0] Error saving generated course:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des generierten Kurses",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    const practiceId = getEffectivePracticeId() // Get practiceId here

    try {
      let url
      const method = "DELETE" // Assuming DELETE method for deletion

      switch (deleteItem.type) {
        case "course":
          url = `/api/practices/${practiceId}/academy/courses/${deleteItem.id}`
          break
        case "module":
          url = `/api/practices/${practiceId}/academy/modules/${deleteItem.id}`
          break
        case "lesson":
          url = `/api/practices/${practiceId}/academy/lessons/${deleteItem.id}`
          break
        case "quiz":
          url = `/api/practices/${practiceId}/academy/quizzes/${deleteItem.id}`
          break
        case "badge":
          url = `/api/practices/${practiceId}/academy/badges/${deleteItem.id}`
          break
        default:
          throw new Error("Unknown item type to delete")
      }

      const response = await fetch(url, { method })

      if (!response.ok) {
        throw new Error(`Failed to delete ${deleteItem.type}`)
      }

      toast({ title: "Erfolg", description: `"${deleteItem.name}" wurde erfolgreich gelöscht.` })
      setShowDeleteDialog(false)
      setDeleteItem(null)
      fetchData()
      if (selectedCourse) {
        fetchCourseModules(selectedCourse.id)
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      toast({ title: "Fehler", description: `Fehler beim Löschen von "${deleteItem.name}".`, variant: "destructive" })
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
      is_landing_page_featured: false, // Added
      visibility: "logged_in", // Added
      target_audience: ["all"], // Added
      tags: [],
      learning_objectives: [],
    })
    setEditingCourse(null) // Reset editing state as well
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
      is_landing_page_featured: course.is_landing_page_featured || false, // Added
      visibility: course.visibility || "logged_in", // Added
      target_audience: course.target_audience || ["all"], // Added
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
      is_active: badge.is_active ?? true,
      criteria: badge.criteria || {},
    })
    setShowBadgeDialog(true)
  }

  const openCourseDetails = async (course: Course) => {
    setSelectedCourse(course)
    await fetchCourseModules(course.id)
    setActiveTab("course-detail")
  }

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules((prev) => (prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]))
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || course.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getDifficultyBadge = (level: string) => {
    const config = DIFFICULTY_LEVELS.find((d) => d.value === level)
    return (
      <Badge variant="outline" className={`${config?.color} text-white border-0`}>
        {config?.label || level}
      </Badge>
    )
  }

  const getBadgeIcon = (iconName: string) => {
    const iconConfig = BADGE_ICONS.find((i) => i.value === iconName)
    const Icon = iconConfig?.icon || Trophy
    return <Icon className="h-5 w-5" />
  }

  const getRarityColor = (rarity: string) => {
    return BADGE_RARITIES.find((r) => r.value === rarity)?.color || "text-gray-500"
  }

  const getVisibilityBadge = (visibility: string) => {
    const config = VISIBILITY_OPTIONS.find((v) => v.value === visibility)
    const Icon = config?.icon || Users
    const colors = {
      public: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      logged_in: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      premium: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    }
    return (
      <Badge
        variant="outline"
        className={`${colors[visibility as keyof typeof colors] || colors.logged_in} border-0 gap-1`}
      >
        <Icon className="h-3 w-3" />
        {config?.label || visibility}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Academy Verwaltung</h1>
          <p className="text-muted-foreground mt-1">Verwalten Sie Kurse, Lektionen, Quizze und Gamification</p>
        </div>
        <Button onClick={() => setShowCourseDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Kurs
        </Button>
        <Button
          onClick={() => setShowAiCourseDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Kurs mit KI erstellen
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Übersicht</span>
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Kurse</span>
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Quizze</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Badges</span>
          </TabsTrigger>
          <TabsTrigger value="course-detail" className="gap-2" disabled={!selectedCourse}>
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">Kursinhalt</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kurse gesamt</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.publishedCourses || 0} veröffentlicht</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Einschreibungen</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.completionRate?.toFixed(1)}% Abschlussrate</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lektionen</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
                <p className="text-xs text-muted-foreground">{stats?.totalQuizzes || 0} Quizze</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bewertung</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {stats?.averageRating?.toFixed(1) || "0.0"}
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">Durchschnittliche Bewertung</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Neueste Kurse</CardTitle>
                <CardDescription>Zuletzt erstellte oder aktualisierte Kurse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <div key={course.id} className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{course.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant={course.is_published ? "default" : "secondary"} className="text-xs">
                            {course.is_published ? "Veröffentlicht" : "Entwurf"}
                          </Badge>
                          {getDifficultyBadge(course.difficulty_level)}
                          {getVisibilityBadge(course.visibility)} {/* Display visibility badge */}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openCourseDetails(course)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Noch keine Kurse vorhanden</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Verfügbare Gamification-Badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {badges.slice(0, 6).map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: badge.color + "20", color: badge.color }}
                      >
                        {getBadgeIcon(badge.icon_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{badge.name}</p>
                        <p className={`text-xs ${getRarityColor(badge.rarity)}`}>
                          {BADGE_RARITIES.find((r) => r.value === badge.rarity)?.label}
                        </p>
                      </div>
                    </div>
                  ))}
                  {badges.length === 0 && (
                    <p className="col-span-2 text-center text-muted-foreground py-4">Noch keine Badges vorhanden</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kurse suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <GraduationCap className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openCourseDetails(course)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditCourse(course)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteItem({ type: "course", id: course.id, name: course.title })
                            setShowDeleteDialog(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {course.description || "Keine Beschreibung"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {getVisibilityBadge(course.visibility || "logged_in")}
                    {getDifficultyBadge(course.difficulty_level)}
                    <Badge variant={course.is_published ? "default" : "secondary"}>
                      {course.is_published ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                    {course.is_landing_page_featured && (
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-0">
                        <Star className="h-3 w-3 mr-1 fill-amber-500" />
                        Landing Page
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.total_enrollments || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.estimated_hours}h
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.average_rating?.toFixed(1) || "0.0"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full bg-transparent" onClick={() => openCourseDetails(course)}>
                    Kursinhalt verwalten
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {filteredCourses.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Keine Kurse gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || categoryFilter !== "all"
                      ? "Keine Kurse entsprechen Ihren Filterkriterien"
                      : "Erstellen Sie Ihren ersten Kurs"}
                  </p>
                  <Button
                    onClick={() => {
                      resetCourseForm()
                      setShowCourseDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Kurs erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Course Detail Tab */}
        <TabsContent value="course-detail" className="space-y-4">
          {selectedCourse && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => setActiveTab("courses")}>
                    <ChevronRight className="h-4 w-4 rotate-180 mr-2" />
                    Zurück
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <div>
                    <h2 className="text-xl font-semibold">{selectedCourse.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {courseModules.length} Module •{" "}
                      {courseModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0)} Lektionen
                    </p>
                  </div>
                </div>
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

              <div className="space-y-4">
                {courseModules.map((module, moduleIndex) => (
                  <Card key={module.id}>
                    <CardHeader className="cursor-pointer" onClick={() => toggleModuleExpand(module.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {moduleIndex + 1}
                          </div>
                          <div>
                            <CardTitle className="text-base">{module.title}</CardTitle>
                            <CardDescription>
                              {module.lessons?.length || 0} Lektionen • {module.estimated_minutes} Min.
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Badge variant={module.is_published ? "default" : "secondary"}>
                            {module.is_published ? "Veröffentlicht" : "Entwurf"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingModule(module)
                                  setShowLessonDialog(true)
                                  resetLessonForm()
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Lektion hinzufügen
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingModule(module)
                                  setModuleForm({
                                    title: module.title,
                                    description: module.description || "",
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
                                onClick={() => {
                                  setDeleteItem({ type: "module", id: module.id, name: module.title })
                                  setShowDeleteDialog(true)
                                }}
                                className="text-destructive"
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
                        <div className="space-y-2 ml-11">
                          {module.lessons?.map((lesson, lessonIndex) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                                  {lesson.lesson_type === "video" ? (
                                    <Play className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{lesson.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {lesson.estimated_minutes} Min. • {lesson.xp_reward} XP
                                    {lesson.is_free_preview && " • Vorschau"}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={lesson.is_published ? "outline" : "secondary"} className="text-xs">
                                  {lesson.is_published ? "Live" : "Entwurf"}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingModule(module)
                                        setEditingLesson(lesson)
                                        setLessonForm({
                                          title: lesson.title,
                                          description: lesson.description || "",
                                          content: lesson.content || "",
                                          lesson_type: lesson.lesson_type,
                                          video_url: lesson.video_url || "",
                                          video_duration_seconds: lesson.video_duration_seconds || 0,
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
                                      onClick={() => {
                                        setDeleteItem({ type: "lesson", id: lesson.id, name: lesson.title })
                                        setShowDeleteDialog(true)
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Löschen
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                          {(!module.lessons || module.lessons.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              Noch keine Lektionen in diesem Modul
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                {courseModules.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Keine Module vorhanden</h3>
                      <p className="text-muted-foreground mb-4">Erstellen Sie das erste Modul für diesen Kurs</p>
                      <Button
                        onClick={() => {
                          resetModuleForm()
                          setEditingModule(null)
                          setShowModuleDialog(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Modul erstellen
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          <div className="flex justify-between items-center">
            <CardDescription>Verwalten Sie Quiz-Assessments für Ihre Kurse</CardDescription>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-center">Bestehensgrenze</TableHead>
                    <TableHead className="text-center">Zeitlimit</TableHead>
                    <TableHead className="text-center">XP</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quizzes.map((quiz) => (
                    <TableRow key={quiz.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{quiz.title}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {quiz.description || "Keine Beschreibung"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{quiz.quiz_type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{quiz.passing_score}%</TableCell>
                      <TableCell className="text-center">
                        {quiz.time_limit_minutes ? `${quiz.time_limit_minutes} Min.` : "Unbegrenzt"}
                      </TableCell>
                      <TableCell className="text-center">{quiz.xp_reward}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteItem({ type: "quiz", id: quiz.id, name: quiz.title })
                                setShowDeleteDialog(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {quizzes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Keine Quizze vorhanden. Erstellen Sie Quizze innerhalb der Kursmodule.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badges Tab */}
        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-between items-center">
            <CardDescription>Verwalten Sie Achievements und Gamification-Badges</CardDescription>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => (
              <Card key={badge.id} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: badge.color }} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: badge.color + "20", color: badge.color }}
                    >
                      {getBadgeIcon(badge.icon_name)}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditBadge(badge)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setDeleteItem({ type: "badge", id: badge.id, name: badge.name })
                            setShowDeleteDialog(true)
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {badge.description || "Keine Beschreibung"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {BADGE_TYPES.find((t) => t.value === badge.badge_type)?.label || badge.badge_type}
                      </Badge>
                      <span className={getRarityColor(badge.rarity)}>
                        {BADGE_RARITIES.find((r) => r.value === badge.rarity)?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      {badge.xp_reward} XP
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Badge variant={badge.is_active ? "default" : "secondary"} className="w-full justify-center">
                    {badge.is_active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
            {badges.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Keine Badges vorhanden</h3>
                  <p className="text-muted-foreground mb-4">Erstellen Sie Badges, um Benutzer zu motivieren</p>
                  <Button
                    onClick={() => {
                      resetBadgeForm()
                      setEditingBadge(null)
                      setShowBadgeDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Badge erstellen
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Kurs bearbeiten" : "Neuer Kurs"}</DialogTitle>
            <DialogDescription>Füllen Sie die Kursinformationen aus</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-10rem)] pr-2">
            <div className="space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Titel *</Label>
                  <Input
                    value={courseForm.title}
                    onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                    placeholder="z.B. Praxismanagement für Einsteiger"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Kurze Beschreibung des Kursinhalts..."
                    rows={3}
                  />
                </div>

                <div className="col-span-2 space-y-3 p-4 rounded-lg border bg-muted/50">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Sichtbarkeit & Zielgruppe
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {VISIBILITY_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = courseForm.visibility === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setCourseForm({
                              ...courseForm,
                              visibility: option.value as "public" | "logged_in" | "premium",
                            })
                          }
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-transparent bg-background hover:border-muted-foreground/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`font-medium text-sm ${isSelected ? "text-primary" : ""}`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </button>
                      )
                    })}
                  </div>

                  {courseForm.visibility === "public" && (
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="landing-featured"
                        checked={courseForm.is_landing_page_featured}
                        onCheckedChange={(checked) =>
                          setCourseForm({ ...courseForm, is_landing_page_featured: checked })
                        }
                      />
                      <Label htmlFor="landing-featured" className="text-sm">
                        Auf Landing Page anzeigen
                      </Label>
                    </div>
                  )}

                  <div className="pt-2">
                    <Label className="text-sm">Zielgruppe</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {TARGET_AUDIENCE_OPTIONS.map((option) => {
                        const isSelected = courseForm.target_audience.includes(option.value)
                        return (
                          <Badge
                            key={option.value}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              if (option.value === "all") {
                                setCourseForm({ ...courseForm, target_audience: ["all"] })
                              } else {
                                const newAudience = isSelected
                                  ? courseForm.target_audience.filter((a) => a !== option.value)
                                  : [...courseForm.target_audience.filter((a) => a !== "all"), option.value]
                                setCourseForm({
                                  ...courseForm,
                                  target_audience: newAudience.length === 0 ? ["all"] : newAudience,
                                })
                              }
                            }}
                          >
                            {option.label}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Kategorie</Label>
                  <Select
                    value={courseForm.category}
                    onValueChange={(v) => setCourseForm({ ...courseForm, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Schwierigkeitsgrad</Label>
                  <Select
                    value={courseForm.difficulty_level}
                    onValueChange={(v) => setCourseForm({ ...courseForm, difficulty_level: v })}
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

                <div>
                  <Label>Geschätzte Dauer (Stunden)</Label>
                  <Input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={courseForm.estimated_hours}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, estimated_hours: Number.parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <Label>XP-Belohnung</Label>
                  <Input
                    type="number"
                    min={0}
                    step={25}
                    value={courseForm.xp_reward}
                    onChange={(e) => setCourseForm({ ...courseForm, xp_reward: Number.parseInt(e.target.value) })}
                  />
                </div>
                <Separator className="col-span-2" />
                <div className="col-span-2">
                  <Label>Instructor Name</Label>
                  <Input
                    value={courseForm.instructor_name}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor_name: e.target.value })}
                    placeholder="Name des Dozenten"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Instructor Bio</Label>
                  <Textarea
                    value={courseForm.instructor_bio}
                    onChange={(e) => setCourseForm({ ...courseForm, instructor_bio: e.target.value })}
                    placeholder="Kurze Biografie des Dozenten..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Thumbnail URL</Label>
                  <Input
                    value={courseForm.thumbnail_url}
                    onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label>Featured Image URL</Label>
                  <Input
                    value={courseForm.featured_image_url}
                    onChange={(e) => setCourseForm({ ...courseForm, featured_image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <Separator className="col-span-2" />

                <div className="col-span-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Veröffentlicht</Label>
                    <p className="text-sm text-muted-foreground">Kurs für Benutzer sichtbar machen</p>
                  </div>
                  <Switch
                    checked={courseForm.is_published}
                    onCheckedChange={(v) => setCourseForm({ ...courseForm, is_published: v })}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Featured</Label>
                    <p className="text-sm text-muted-foreground">Kurs auf der Startseite hervorheben</p>
                  </div>
                  <Switch
                    checked={courseForm.is_featured}
                    onCheckedChange={(v) => setCourseForm({ ...courseForm, is_featured: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCourseDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCourse} disabled={!courseForm.title}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Modul bearbeiten" : "Neues Modul"}</DialogTitle>
            <DialogDescription>Erstellen Sie ein Modul für den Kurs</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={moduleForm.title}
                onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                placeholder="z.B. Einführung in das Thema"
              />
            </div>
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Was wird in diesem Modul behandelt?"
                rows={3}
              />
            </div>
            <div>
              <Label>Geschätzte Dauer (Minuten)</Label>
              <Input
                type="number"
                min={5}
                step={5}
                value={moduleForm.estimated_minutes}
                onChange={(e) => setModuleForm({ ...moduleForm, estimated_minutes: Number.parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Veröffentlicht</Label>
                <p className="text-sm text-muted-foreground">Modul sichtbar machen</p>
              </div>
              <Switch
                checked={moduleForm.is_published}
                onCheckedChange={(v) => setModuleForm({ ...moduleForm, is_published: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModuleDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveModule} disabled={!moduleForm.title}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Lektion bearbeiten" : "Neue Lektion"}</DialogTitle>
            <DialogDescription>Erstellen Sie eine Lektion für das Modul</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-10rem)] pr-2">
            <div className="space-y-4 pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Titel *</Label>
                  <Input
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="z.B. Was ist Praxismanagement?"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    placeholder="Kurze Beschreibung der Lektion..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Typ</Label>
                  <Select
                    value={lessonForm.lesson_type}
                    onValueChange={(v) => setLessonForm({ ...lessonForm, lesson_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="interactive">Interaktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Geschätzte Dauer (Min.)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={lessonForm.estimated_minutes}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, estimated_minutes: Number.parseInt(e.target.value) })
                    }
                  />
                </div>
                {lessonForm.lesson_type === "video" && (
                  <>
                    <div className="col-span-2">
                      <Label>Video URL</Label>
                      <Input
                        value={lessonForm.video_url}
                        onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <Label>Video Dauer (Sekunden)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={lessonForm.video_duration_seconds}
                        onChange={(e) =>
                          setLessonForm({ ...lessonForm, video_duration_seconds: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label>XP-Belohnung</Label>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={lessonForm.xp_reward}
                    onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Inhalt</Label>
                  <Textarea
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder="Lektionsinhalt (Markdown unterstützt)..."
                    rows={6}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Veröffentlicht</Label>
                    <p className="text-sm text-muted-foreground">Lektion sichtbar machen</p>
                  </div>
                  <Switch
                    checked={lessonForm.is_published}
                    onCheckedChange={(v) => setLessonForm({ ...lessonForm, is_published: v })}
                  />
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Kostenlose Vorschau</Label>
                    <p className="text-sm text-muted-foreground">Lektion als Vorschau freigeben</p>
                  </div>
                  <Switch
                    checked={lessonForm.is_free_preview}
                    onCheckedChange={(v) => setLessonForm({ ...lessonForm, is_free_preview: v })}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLessonDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveLesson} disabled={!lessonForm.title}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={showBadgeDialog} onOpenChange={setShowBadgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBadge ? "Badge bearbeiten" : "Neues Badge"}</DialogTitle>
            <DialogDescription>Erstellen Sie ein Gamification-Badge</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[calc(90vh-10rem)] pr-2">
            <div className="space-y-4 pr-2">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: badgeForm.color + "20", color: badgeForm.color }}
                >
                  {getBadgeIcon(badgeForm.icon_name)}
                </div>
                <div className="flex-1 space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={badgeForm.name}
                    onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                    placeholder="z.B. Schnelllerner"
                  />
                </div>
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  placeholder="Wofür wird dieses Badge verliehen?"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <Select
                    value={badgeForm.badge_type}
                    onValueChange={(v) => setBadgeForm({ ...badgeForm, badge_type: v })}
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
                <div>
                  <Label>Seltenheit</Label>
                  <Select value={badgeForm.rarity} onValueChange={(v) => setBadgeForm({ ...badgeForm, rarity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_RARITIES.map((rarity) => (
                        <SelectItem key={rarity.value} value={rarity.value}>
                          <span className={rarity.color}>{rarity.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={badgeForm.icon_name}
                    onValueChange={(v) => setBadgeForm({ ...badgeForm, icon_name: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BADGE_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <icon.icon className="h-4 w-4" />
                            {icon.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Farbe</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={badgeForm.color}
                      onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={badgeForm.color}
                      onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>XP-Belohnung</Label>
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    value={badgeForm.xp_reward}
                    onChange={(e) => setBadgeForm({ ...badgeForm, xp_reward: Number.parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={badgeForm.is_active}
                    onCheckedChange={(v) => setBadgeForm({ ...badgeForm, is_active: v })}
                  />
                  <Label>Aktiv</Label>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBadgeDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveBadge} disabled={!badgeForm.name}>
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie "{deleteItem?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/80">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAiCourseDialog} onOpenChange={setShowAiCourseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Kurs mit KI generieren
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie den gewünschten Kurs und lassen Sie die KI einen vollständigen Kurs mit Modulen und
              Lektionen erstellen.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(90vh-10rem)] pr-2">
            <div className="space-y-6 py-4 pr-2">
              {!generatedCourse ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ai-course-description">Kursbeschreibung</Label>
                    <Textarea
                      id="ai-course-description"
                      placeholder="Beschreiben Sie den Kurs, den Sie erstellen möchten. z.B. 'Ein Kurs über effektive Patientenkommunikation für MFA, der Themen wie aktives Zuhören, Umgang mit schwierigen Patienten und telefonische Kommunikation abdeckt.'"
                      value={aiCourseDescription}
                      onChange={(e) => setAiCourseDescription(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-course-category">Kategorie</Label>
                      <Select value={aiCourseCategory} onValueChange={setAiCourseCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-course-difficulty">Schwierigkeitsgrad</Label>
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

                  <Button
                    onClick={handleGenerateAiCourse}
                    disabled={aiCourseGenerating || !aiCourseDescription.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {aiCourseGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generiere Kurs...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Kurs generieren
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 p-4 dark:from-purple-950/20 dark:to-pink-950/20">
                    <h3 className="font-semibold text-lg">{generatedCourse.title}</h3>
                    <p className="text-muted-foreground mt-1">{generatedCourse.description}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {generatedCourse.estimated_hours} Stunden
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        {generatedCourse.xp_reward} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {generatedCourse.modules?.length || 0} Module
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Lernziele:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {generatedCourse.learning_objectives?.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Module & Lektionen:</h4>
                    {generatedCourse.modules?.map((module: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="font-medium">
                          {i + 1}. {module.title}
                        </div>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <div className="mt-2 pl-4 space-y-1">
                          {module.lessons?.map((lesson: any, j: number) => (
                            <div key={j} className="text-sm flex items-center gap-2">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              {lesson.title}
                              <span className="text-muted-foreground">({lesson.estimated_minutes} Min.)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGeneratedCourse(null)
                      }}
                      className="flex-1"
                    >
                      Neu generieren
                    </Button>
                    <Button onClick={handleSaveGeneratedCourse} className="flex-1">
                      <Save className="mr-2 h-4 w-4" />
                      Kurs speichern
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SuperAdminAcademyManager
