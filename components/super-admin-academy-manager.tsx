"use client"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Trophy,
  BarChart3,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Search,
  Filter,
  Users,
  Star,
  Award,
  Layers,
  FileText,
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle2,
  Sparkles,
  Target,
  Flame,
  Zap,
  Medal,
  Crown,
  Heart,
  Save,
  RefreshCw,
  Loader2,
  Wand2,
  Clock,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

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
  { value: "completion", label: "Abschluss", icon: CheckCircle2 },
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
  { value: "star", label: "Stern", icon: Star },
  { value: "crown", label: "Krone", icon: Crown },
  { value: "flame", label: "Flamme", icon: Flame },
  { value: "zap", label: "Blitz", icon: Zap },
  { value: "target", icon: Target },
  { value: "heart", icon: Heart },
  { value: "sparkles", icon: Sparkles },
]

export function SuperAdminAcademyManager() {
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
  const [aiCourseCategory, setAiCourseCategory] = useState("praxis-management")
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
    tags: [] as string[],
    learning_objectives: [] as string[],
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
      const supabase = createBrowserClient() // Use browser client

      if (!supabase) {
        console.error("[v0] Supabase client not available")
        toast({
          title: "Fehler",
          description: "Datenbankverbindung nicht verfügbar",
          variant: "destructive",
        })
        return
      }

      // Fetch courses
      const { data: coursesData } = await supabase
        .from("academy_courses")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      setCourses(coursesData || [])

      // Fetch quizzes
      const { data: quizzesData } = await supabase
        .from("academy_quizzes")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })

      setQuizzes(quizzesData || [])

      // Fetch badges
      const { data: badgesData } = await supabase
        .from("academy_badges")
        .select("*")
        .is("deleted_at", null)
        .order("display_order", { ascending: true })

      setBadges(badgesData || [])

      // Calculate stats
      const { data: enrollmentsData } = await supabase
        .from("academy_enrollments")
        .select("id, progress_percentage")
        .is("deleted_at", null)

      const { data: lessonsData } = await supabase.from("academy_lessons").select("id").is("deleted_at", null)

      const totalEnrollments = enrollmentsData?.length || 0
      const completedEnrollments = enrollmentsData?.filter((e) => e.progress_percentage === 100).length || 0
      const completionRate = totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0

      const publishedCourses = coursesData?.filter((c) => c.is_published).length || 0
      const avgRating = coursesData?.reduce((sum, c) => sum + (c.average_rating || 0), 0) / (coursesData?.length || 1)

      setStats({
        totalCourses: coursesData?.length || 0,
        publishedCourses,
        totalEnrollments,
        totalLessons: lessonsData?.length || 0,
        totalQuizzes: quizzesData?.length || 0,
        totalBadges: badgesData?.length || 0,
        averageRating: avgRating || 0,
        completionRate,
      })
    } catch (error) {
      console.error("Error fetching academy data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchCourseModules = useCallback(async (courseId: string) => {
    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      console.error("[v0] Supabase client not available in fetchCourseModules")
      return
    }

    const { data: modulesData } = await supabase
      .from("academy_modules")
      .select("*")
      .eq("course_id", courseId)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })

    if (modulesData) {
      // Fetch lessons for each module
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module) => {
          const { data: lessonsData } = await supabase
            .from("academy_lessons")
            .select("*")
            .eq("module_id", module.id)
            .is("deleted_at", null)
            .order("display_order", { ascending: true })

          return { ...module, lessons: lessonsData || [] }
        }),
      )

      setCourseModules(modulesWithLessons)
    }
  }, [])

  const handleSaveCourse = async () => {
    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }

    const courseData = {
      ...courseForm,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingCourse) {
        await supabase.from("academy_courses").update(courseData).eq("id", editingCourse.id)
        toast({ title: "Kurs aktualisiert", description: `"${courseForm.title}" wurde erfolgreich aktualisiert.` })
      } else {
        await supabase.from("academy_courses").insert({
          ...courseData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          total_enrollments: 0,
          average_rating: 0,
          total_reviews: 0,
        })
        toast({ title: "Kurs erstellt", description: `"${courseForm.title}" wurde erfolgreich erstellt.` })
      }

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

    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }

    const moduleData = {
      ...moduleForm,
      course_id: selectedCourse.id,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingModule) {
        await supabase.from("academy_modules").update(moduleData).eq("id", editingModule.id)
        toast({ title: "Modul aktualisiert", description: `"${moduleForm.title}" wurde erfolgreich aktualisiert.` })
      } else {
        const nextOrder = courseModules.length + 1
        await supabase.from("academy_modules").insert({
          ...moduleData,
          id: crypto.randomUUID(),
          display_order: nextOrder,
          created_at: new Date().toISOString(),
        })
        toast({ title: "Modul erstellt", description: `"${moduleForm.title}" wurde erfolgreich erstellt.` })
      }

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

    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }

    const lessonData = {
      ...lessonForm,
      course_id: selectedCourse.id,
      module_id: editingModule.id,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingLesson) {
        await supabase.from("academy_lessons").update(lessonData).eq("id", editingLesson.id)
        toast({ title: "Lektion aktualisiert", description: `"${lessonForm.title}" wurde erfolgreich aktualisiert.` })
      } else {
        const currentModule = courseModules.find((m) => m.id === editingModule.id)
        const nextOrder = (currentModule?.lessons?.length || 0) + 1
        await supabase.from("academy_lessons").insert({
          ...lessonData,
          id: crypto.randomUUID(),
          display_order: nextOrder,
          created_at: new Date().toISOString(),
          resources: [],
        })
        toast({ title: "Lektion erstellt", description: `"${lessonForm.title}" wurde erfolgreich erstellt.` })
      }

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
    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }

    const badgeData = {
      ...badgeForm,
      updated_at: new Date().toISOString(),
    }

    try {
      if (editingBadge) {
        await supabase.from("academy_badges").update(badgeData).eq("id", editingBadge.id)
        toast({ title: "Badge aktualisiert", description: `"${badgeForm.name}" wurde erfolgreich aktualisiert.` })
      } else {
        const nextOrder = badges.length + 1
        await supabase.from("academy_badges").insert({
          ...badgeData,
          id: crypto.randomUUID(),
          display_order: nextOrder,
          created_at: new Date().toISOString(),
        })
        toast({ title: "Badge erstellt", description: `"${badgeForm.name}" wurde erfolgreich erstellt.` })
      }

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

    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }

    try {
      // Create the course
      const courseId = crypto.randomUUID()
      const { error: courseError } = await supabase.from("academy_courses").insert({
        id: courseId,
        title: generatedCourse.title,
        description: generatedCourse.description,
        category: aiCourseCategory,
        difficulty_level: aiCourseDifficulty,
        learning_objectives: generatedCourse.learning_objectives,
        target_audience: generatedCourse.target_audience,
        estimated_hours: generatedCourse.estimated_hours,
        xp_reward: generatedCourse.xp_reward,
        instructor_name: generatedCourse.instructor_name,
        instructor_bio: generatedCourse.instructor_bio,
        is_published: false,
        is_featured: false,
        total_enrollments: 0,
        average_rating: 0,
        total_reviews: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (courseError) throw courseError

      // Create modules and lessons
      for (let i = 0; i < generatedCourse.modules.length; i++) {
        const module = generatedCourse.modules[i]
        const moduleId = crypto.randomUUID()

        const { error: moduleError } = await supabase.from("academy_modules").insert({
          id: moduleId,
          course_id: courseId,
          title: module.title,
          description: module.description,
          estimated_minutes: module.estimated_minutes,
          display_order: i + 1,
          is_published: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (moduleError) throw moduleError

        // Create lessons
        for (let j = 0; j < module.lessons.length; j++) {
          const lesson = module.lessons[j]
          const { error: lessonError } = await supabase.from("academy_lessons").insert({
            id: crypto.randomUUID(),
            course_id: courseId,
            module_id: moduleId,
            title: lesson.title,
            description: lesson.description,
            content: lesson.content,
            lesson_type: lesson.lesson_type || "text",
            estimated_minutes: lesson.estimated_minutes,
            xp_reward: lesson.xp_reward,
            display_order: j + 1,
            is_published: false,
            is_free_preview: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (lessonError) throw lessonError
        }
      }

      toast({
        title: "Kurs gespeichert",
        description: "Der Kurs wurde erfolgreich mit allen Modulen und Lektionen gespeichert.",
      })

      setShowAiCourseDialog(false)
      setGeneratedCourse(null)
      setAiCourseDescription("")
      fetchData()
    } catch (error) {
      console.error("Error saving course:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern des Kurses.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteItem) return

    const supabase = createBrowserClient() // Use browser client
    if (!supabase) {
      toast({ title: "Fehler", description: "Datenbankverbindung nicht verfügbar", variant: "destructive" })
      return
    }
    const now = new Date().toISOString()

    try {
      switch (deleteItem.type) {
        case "course":
          await supabase.from("academy_courses").update({ deleted_at: now }).eq("id", deleteItem.id)
          break
        case "module":
          await supabase.from("academy_modules").update({ deleted_at: now }).eq("id", deleteItem.id)
          break
        case "lesson":
          await supabase.from("academy_lessons").update({ deleted_at: now }).eq("id", deleteItem.id)
          break
        case "quiz":
          await supabase.from("academy_quizzes").update({ deleted_at: now }).eq("id", deleteItem.id)
          break
        case "badge":
          await supabase.from("academy_badges").update({ deleted_at: now }).eq("id", deleteItem.id)
          break
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
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kurse suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
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

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kurs</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead className="text-center">Einschreibungen</TableHead>
                    <TableHead className="text-center">Bewertung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {course.thumbnail_url ? (
                              <img
                                src={course.thumbnail_url || "/placeholder.svg"}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{course.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {course.instructor_name || "Kein Instructor"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{getDifficultyBadge(course.difficulty_level)}</TableCell>
                      <TableCell className="text-center">{course.total_enrollments || 0}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(course.average_rating || 0).toFixed(1)}
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={course.is_published ? "default" : "secondary"}>
                            {course.is_published ? "Veröffentlicht" : "Entwurf"}
                          </Badge>
                          {course.is_featured && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCourseDetails(course)}>
                              <Layers className="h-4 w-4 mr-2" />
                              Inhalte verwalten
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
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCourses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Keine Kurse gefunden
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                      className="h-14 w-14 rounded-xl flex items-center justify-center"
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
          <div className="space-y-4">
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
                  onChange={(e) => setCourseForm({ ...courseForm, estimated_hours: Number.parseFloat(e.target.value) })}
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
          <div className="space-y-4">
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
                  onChange={(e) => setLessonForm({ ...lessonForm, estimated_minutes: Number.parseInt(e.target.value) })}
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
          <div className="space-y-4">
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
                <Select value={badgeForm.icon_name} onValueChange={(v) => setBadgeForm({ ...badgeForm, icon_name: v })}>
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
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Löschen bestätigen</DialogTitle>
            <DialogDescription>
              Möchten Sie "{deleteItem?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          <div className="space-y-6 py-4">
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
                        <SelectItem value="praxis-management">Praxis-Management</SelectItem>
                        <SelectItem value="kommunikation">Kommunikation</SelectItem>
                        <SelectItem value="medizinisches-wissen">Medizinisches Wissen</SelectItem>
                        <SelectItem value="qualitaetsmanagement">Qualitätsmanagement</SelectItem>
                        <SelectItem value="digitalisierung">Digitalisierung</SelectItem>
                        <SelectItem value="personal">Personal & Führung</SelectItem>
                        <SelectItem value="abrechnung">Abrechnung</SelectItem>
                        <SelectItem value="recht">Recht & Datenschutz</SelectItem>
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
                        <SelectItem value="beginner">Anfänger</SelectItem>
                        <SelectItem value="intermediate">Fortgeschritten</SelectItem>
                        <SelectItem value="advanced">Experte</SelectItem>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SuperAdminAcademyManager
