"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import {
  Search,
  FileText,
  Video,
  ChevronRight,
  Clock,
  Play,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Sparkles,
  Bot,
  User,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Zap,
  Shield,
  Users,
  Calendar,
  BarChart3,
  FileQuestion,
  GraduationCap,
  BookOpen,
  Rocket,
  Brain,
  Database,
  Mail,
  Phone,
  HelpCircle,
  RotateCcw,
  Maximize2,
  Minimize2,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Bookmark,
  Share2,
  Printer,
  Eye,
  Home,
  Command,
  Workflow,
  MessageSquare,
  Upload,
  UserPlus,
  ClipboardCheck,
  MousePointerClick,
  MonitorPlay,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { LandingPageLayout } from "@/components/landing-page-layout"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/hooks/use-toast"

// Types
interface HelpArticle {
  id: string
  title: string
  description: string
  category: string
  categoryId: string
  content: string
  readTime: number
  difficulty: "beginner" | "intermediate" | "advanced"
  tags: string[]
  views: number
  helpful: number
  lastUpdated: string
  author?: string
  relatedArticles?: string[]
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

interface VideoTutorial {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  videoUrl?: string
  category: string
  categoryId: string
  views: number
  chapters: { title: string; time: string }[]
  transcript?: string
}

interface LearningPath {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  gradient: string
  modules: {
    id: string
    title: string
    type: "article" | "video" | "quiz" | "practice"
    duration: string
    completed: boolean
    description?: string
  }[]
  progress: number
  estimatedTime: string
  difficulty: "beginner" | "intermediate" | "advanced"
  enrolledCount: number
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  sources?: { title: string; url: string; type: string }[]
  isStreaming?: boolean
  practiceContext?: boolean
  suggestions?: string[]
}

interface ContextData {
  practiceInfo?: {
    name: string
    type: string
    teamSize: number
    features: string[]
  }
  recentActivity?: string[]
  commonIssues?: string[]
}

// Help Categories Data
const helpCategories = [
  {
    id: "getting-started",
    name: "Erste Schritte",
    icon: Rocket,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    gradient: "from-blue-500 to-cyan-500",
    description: "Grundlagen und schneller Einstieg",
    articleCount: 12,
  },
  {
    id: "team",
    name: "Team & Mitarbeiter",
    icon: Users,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    gradient: "from-emerald-500 to-teal-500",
    description: "Mitarbeiterverwaltung & Rollen",
    articleCount: 18,
  },
  {
    id: "calendar",
    name: "Kalender & Termine",
    icon: Calendar,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
    description: "Terminplanung & Ressourcen",
    articleCount: 15,
  },
  {
    id: "workflows",
    name: "Workflows & Aufgaben",
    icon: Workflow,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    gradient: "from-purple-500 to-pink-500",
    description: "Automatisierung & Prozesse",
    articleCount: 22,
  },
  {
    id: "documents",
    name: "Dokumente & Vorlagen",
    icon: FileText,
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    gradient: "from-rose-500 to-red-500",
    description: "Dokumentenverwaltung & Signaturen",
    articleCount: 14,
  },
  {
    id: "analytics",
    name: "Analysen & Berichte",
    icon: BarChart3,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    gradient: "from-indigo-500 to-violet-500",
    description: "KPIs & Auswertungen",
    articleCount: 10,
  },
  {
    id: "ai",
    name: "KI-Funktionen",
    icon: Brain,
    color: "text-fuchsia-500",
    bgColor: "bg-fuchsia-500/10",
    borderColor: "border-fuchsia-500/20",
    gradient: "from-fuchsia-500 to-purple-500",
    description: "Intelligente Assistenz",
    articleCount: 8,
  },
  {
    id: "settings",
    name: "Einstellungen & Sicherheit",
    icon: Shield,
    color: "text-slate-500",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/20",
    gradient: "from-slate-500 to-gray-500",
    description: "Konfiguration & Datenschutz",
    articleCount: 16,
  },
]

// Sample Help Articles
const helpArticles: HelpArticle[] = [
  {
    id: "1",
    title: "Schnellstart: Ihre erste Praxis einrichten",
    description:
      "Lernen Sie in 10 Minuten die wichtigsten Grundlagen zur Einrichtung Ihrer Praxis in Effizienz Praxis.",
    category: "Erste Schritte",
    categoryId: "getting-started",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 10,
    difficulty: "beginner",
    tags: ["Einrichtung", "Grundlagen", "Start"],
    views: 4521,
    helpful: 342,
    lastUpdated: "2025-01-15",
    author: "Effizienz Team",
  },
  {
    id: "2",
    title: "Mitarbeiter einladen und Rollen zuweisen",
    description: "So fügen Sie Teammitglieder hinzu und konfigurieren deren Zugriffsrechte.",
    category: "Team & Mitarbeiter",
    categoryId: "team",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 8,
    difficulty: "beginner",
    tags: ["Team", "Einladung", "Rollen", "Berechtigungen"],
    views: 3892,
    helpful: 289,
    lastUpdated: "2025-01-12",
  },
  {
    id: "3",
    title: "Kalender optimal nutzen: Tipps & Tricks",
    description: "Fortgeschrittene Techniken zur effizienten Terminplanung und Ressourcenverwaltung.",
    category: "Kalender & Termine",
    categoryId: "calendar",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 15,
    difficulty: "intermediate",
    tags: ["Kalender", "Termine", "Ressourcen", "Planung"],
    views: 2845,
    helpful: 198,
    lastUpdated: "2025-01-10",
  },
  {
    id: "4",
    title: "Workflow-Automatisierung für Fortgeschrittene",
    description: "Erstellen Sie komplexe automatisierte Abläufe für wiederkehrende Praxisprozesse.",
    category: "Workflows & Aufgaben",
    categoryId: "workflows",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 20,
    difficulty: "advanced",
    tags: ["Workflow", "Automatisierung", "Prozesse"],
    views: 1923,
    helpful: 156,
    lastUpdated: "2025-01-08",
  },
  {
    id: "5",
    title: "KI-gestützte Dokumentenanalyse",
    description: "Nutzen Sie die KI um Dokumente automatisch zu analysieren und zusammenzufassen.",
    category: "KI-Funktionen",
    categoryId: "ai",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 12,
    difficulty: "intermediate",
    tags: ["KI", "Dokumente", "Analyse", "Automatisierung"],
    views: 2156,
    helpful: 187,
    lastUpdated: "2025-01-05",
  },
  {
    id: "6",
    title: "Zwei-Faktor-Authentifizierung einrichten",
    description: "Schützen Sie Ihren Account mit zusätzlicher Sicherheit durch 2FA.",
    category: "Einstellungen & Sicherheit",
    categoryId: "settings",
    content: "Vollständiger Artikel-Inhalt hier...",
    readTime: 5,
    difficulty: "beginner",
    tags: ["Sicherheit", "2FA", "Authentifizierung"],
    views: 3241,
    helpful: 267,
    lastUpdated: "2025-01-03",
  },
]

// Video Tutorials
const videoTutorials: VideoTutorial[] = [
  {
    id: "v1",
    title: "Komplette Einführung in Effizienz Praxis",
    description: "Ein umfassender Überblick über alle Funktionen und Möglichkeiten.",
    duration: "18:45",
    thumbnail: "/medical-practice-setup-tutorial.jpg",
    category: "Erste Schritte",
    categoryId: "getting-started",
    views: 12453,
    chapters: [
      { title: "Einleitung", time: "0:00" },
      { title: "Dashboard Übersicht", time: "2:30" },
      { title: "Erste Schritte", time: "5:45" },
      { title: "Wichtige Funktionen", time: "10:20" },
      { title: "Tipps & Tricks", time: "15:00" },
    ],
  },
  {
    id: "v2",
    title: "Team-Management Masterclass",
    description: "Alles über Mitarbeiterverwaltung, Rollen und Berechtigungen.",
    duration: "24:30",
    thumbnail: "/team-management-tutorial.jpg",
    category: "Team & Mitarbeiter",
    categoryId: "team",
    views: 8921,
    chapters: [
      { title: "Team anlegen", time: "0:00" },
      { title: "Rollen verstehen", time: "6:00" },
      { title: "Berechtigungen", time: "12:00" },
      { title: "Best Practices", time: "18:00" },
    ],
  },
  {
    id: "v3",
    title: "Kalender & Terminplanung",
    description: "Effiziente Terminverwaltung und Ressourcenplanung.",
    duration: "15:20",
    thumbnail: "/calendar-scheduling-tutorial.jpg",
    category: "Kalender & Termine",
    categoryId: "calendar",
    views: 7634,
    chapters: [
      { title: "Kalender-Basics", time: "0:00" },
      { title: "Termine erstellen", time: "4:00" },
      { title: "Wiederkehrende Termine", time: "8:00" },
      { title: "Ressourcen verwalten", time: "12:00" },
    ],
  },
  {
    id: "v4",
    title: "KI-Features optimal nutzen",
    description: "Entdecken Sie die Möglichkeiten der integrierten KI-Assistenz.",
    duration: "21:15",
    thumbnail: "/ai-features-tutorial.png",
    category: "KI-Funktionen",
    categoryId: "ai",
    views: 5892,
    chapters: [
      { title: "KI-Übersicht", time: "0:00" },
      { title: "Textgenerierung", time: "5:00" },
      { title: "Dokumentenanalyse", time: "10:00" },
      { title: "Intelligente Vorschläge", time: "15:00" },
    ],
  },
]

// Learning Paths
const learningPaths: LearningPath[] = [
  {
    id: "lp1",
    title: "Einsteiger-Kurs",
    description: "Perfekt für neue Nutzer - lernen Sie alle Grundlagen in strukturierten Lektionen.",
    icon: GraduationCap,
    color: "text-blue-500",
    gradient: "from-blue-500 to-cyan-500",
    difficulty: "beginner",
    estimatedTime: "2 Stunden",
    enrolledCount: 1234,
    progress: 0,
    modules: [
      { id: "m1", title: "Willkommen & Überblick", type: "video", duration: "10 min", completed: false },
      { id: "m2", title: "Praxis einrichten", type: "article", duration: "15 min", completed: false },
      { id: "m3", title: "Erste Schritte Quiz", type: "quiz", duration: "5 min", completed: false },
      { id: "m4", title: "Team anlegen", type: "practice", duration: "20 min", completed: false },
      { id: "m5", title: "Dashboard verstehen", type: "video", duration: "12 min", completed: false },
    ],
  },
  {
    id: "lp2",
    title: "Team-Manager Zertifikat",
    description: "Werden Sie zum Experten für Teamverwaltung und Mitarbeiterführung.",
    icon: Users,
    color: "text-emerald-500",
    gradient: "from-emerald-500 to-teal-500",
    difficulty: "intermediate",
    estimatedTime: "4 Stunden",
    enrolledCount: 856,
    progress: 0,
    modules: [
      { id: "m1", title: "Rollen & Berechtigungen", type: "video", duration: "20 min", completed: false },
      { id: "m2", title: "Schichtplanung", type: "article", duration: "25 min", completed: false },
      { id: "m3", title: "Urlaubsmanagement", type: "practice", duration: "30 min", completed: false },
      { id: "m4", title: "Kommunikation im Team", type: "video", duration: "15 min", completed: false },
      { id: "m5", title: "Abschlussprüfung", type: "quiz", duration: "20 min", completed: false },
    ],
  },
  {
    id: "lp3",
    title: "KI Power-User",
    description: "Maximieren Sie die KI-Funktionen für höchste Effizienz in Ihrer Praxis.",
    icon: Brain,
    color: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
    difficulty: "advanced",
    estimatedTime: "3 Stunden",
    enrolledCount: 543,
    progress: 0,
    modules: [
      { id: "m1", title: "KI-Grundlagen", type: "video", duration: "15 min", completed: false },
      { id: "m2", title: "Textgenerierung meistern", type: "practice", duration: "30 min", completed: false },
      { id: "m3", title: "Dokumentenanalyse", type: "article", duration: "20 min", completed: false },
      { id: "m4", title: "Automatisierung mit KI", type: "video", duration: "25 min", completed: false },
      { id: "m5", title: "KI-Experten Quiz", type: "quiz", duration: "15 min", completed: false },
    ],
  },
]

// FAQs
const faqs: FAQ[] = [
  {
    id: "faq1",
    question: "Wie kann ich mein Passwort zurücksetzen?",
    answer:
      "Klicken Sie auf der Login-Seite auf 'Passwort vergessen'. Sie erhalten eine E-Mail mit einem Link zum Zurücksetzen. Alternativ können Sie in Ihrem Profil unter Sicherheit Ihr Passwort ändern.",
    category: "Account & Sicherheit",
    helpful: 234,
  },
  {
    id: "faq2",
    question: "Kann ich Mitarbeiter mit eingeschränkten Rechten einladen?",
    answer:
      "Ja, Sie können bei der Einladung eine spezifische Rolle auswählen oder individuelle Berechtigungen vergeben. Gehen Sie zu Einstellungen > Team > Mitarbeiter einladen.",
    category: "Team & Mitarbeiter",
    helpful: 189,
  },
  {
    id: "faq3",
    question: "Wie funktionieren wiederkehrende Termine?",
    answer:
      "Beim Erstellen eines Termins können Sie unter 'Wiederholung' verschiedene Muster wählen: täglich, wöchentlich, monatlich oder benutzerdefiniert. Sie können auch Ausnahmen und ein Enddatum festlegen.",
    category: "Kalender & Termine",
    helpful: 167,
  },
  {
    id: "faq4",
    question: "Welche Dateiformate werden für Dokumente unterstützt?",
    answer:
      "Effizienz Praxis unterstützt PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX), Bilder (JPG, PNG, GIF) und viele weitere gängige Formate.",
    category: "Dokumente",
    helpful: 145,
  },
  {
    id: "faq5",
    question: "Ist meine Daten DSGVO-konform gespeichert?",
    answer:
      "Ja, alle Daten werden DSGVO-konform in deutschen Rechenzentren gespeichert. Wir setzen modernste Verschlüsselung ein und Sie haben jederzeit die volle Kontrolle über Ihre Daten.",
    category: "Datenschutz",
    helpful: 198,
  },
  {
    id: "faq6",
    question: "Wie aktiviere ich die KI-Funktionen?",
    answer:
      "KI-Funktionen können unter Einstellungen > Praxis > System aktiviert werden. Nach der Aktivierung finden Sie KI-Assistenten in verschiedenen Bereichen wie Dokumenten, Workflows und dem Dashboard.",
    category: "KI-Funktionen",
    helpful: 156,
  },
]

// Suggested Questions for AI
const suggestedQuestions = [
  "Wie richte ich meine Praxis ein?",
  "Wie lade ich Teammitglieder ein?",
  "Wie erstelle ich wiederkehrende Termine?",
  "Wie funktioniert die Dokumentenanalyse?",
  "Wie aktiviere ich Zwei-Faktor-Auth?",
  "Wie exportiere ich meine Daten?",
]

// Quick Actions
const quickActions = [
  { label: "Mitarbeiter einladen", icon: UserPlus, href: "/team", color: "text-emerald-500" },
  { label: "Termin erstellen", icon: Calendar, href: "/calendar", color: "text-amber-500" },
  { label: "Dokument hochladen", icon: Upload, href: "/documents", color: "text-blue-500" },
  { label: "Workflow anlegen", icon: Workflow, href: "/workflows", color: "text-purple-500" },
]

export default function HelpPage() {
  const { toast } = useToast()

  // State
  const [activeTab, setActiveTab] = useState("overview")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [isChatExpanded, setIsChatExpanded] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"popular" | "recent" | "alphabetical">("popular")
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [contextData, setContextData] = useState<ContextData | null>(null)

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch context data on mount
  useEffect(() => {
    // Removed context fetching and usage as hooks were removed
    // if (currentPractice) {
    //   setContextData({
    //     practiceInfo: {
    //       name: currentPractice.name || "Ihre Praxis",
    //       type: currentPractice.type || "Allgemeinmedizin",
    //       teamSize: 0,
    //       features: [],
    //     },
    //   })
    // }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Filter articles
  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || article.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Sort articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === "popular") return b.views - a.views
    if (sortBy === "recent") return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    return a.title.localeCompare(b.title)
  })

  // Filter videos
  const filteredVideos = videoTutorials.filter((video) => {
    const matchesSearch =
      searchQuery === "" ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || video.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Send message to AI
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isAiTyping) return

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: message,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, userMessage])
      setChatInput("")
      setIsAiTyping(true)

      try {
        const response = await fetch("/api/help/ai-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            message,
            history: chatMessages.slice(-10),
            // Removed practiceId, practiceName, and other context data as hooks were removed
            // context: {
            //   practiceId: currentPractice?.id,
            //   practiceName: currentPractice?.name,
            //   practiceType: currentPractice?.type,
            //   userName: currentUser?.name,
            //   userRole: currentUser?.role,
            // },
          }),
        })

        if (!response.ok) throw new Error("Fehler bei der KI-Anfrage")

        const data = await response.json()

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
          sources: data.sources,
          suggestions: data.suggestions,
          practiceContext: data.usedPracticeContext,
        }

        setChatMessages((prev) => [...prev, assistantMessage])
      } catch (error) {
        console.error("AI error:", error)
        toast({
          title: "Fehler",
          description: "Die KI konnte nicht antworten. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        })
      } finally {
        setIsAiTyping(false)
      }
    },
    [chatMessages, isAiTyping, toast],
  )

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(chatInput)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Kopiert", description: "Text wurde in die Zwischenablage kopiert." })
  }

  const getDifficultyBadge = (difficulty: string) => {
    const config = {
      beginner: { label: "Einsteiger", className: "bg-green-500/10 text-green-600 border-green-500/20" },
      intermediate: { label: "Fortgeschritten", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
      advanced: { label: "Experte", className: "bg-red-500/10 text-red-600 border-red-500/20" },
    }
    const { label, className } = config[difficulty as keyof typeof config] || config.beginner
    return (
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
    )
  }

  const getModuleIcon = (type: string) => {
    const icons = {
      article: FileText,
      video: Play,
      quiz: ClipboardCheck,
      practice: MousePointerClick,
    }
    return icons[type as keyof typeof icons] || FileText
  }

  return (
    <LandingPageLayout>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="container max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Badge className="px-4 py-1.5 text-sm bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary">
                  <Sparkles className="w-3.5 h-3.5 mr-2" />
                  KI-gestütztes Hilfecenter
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
              >
                Wie können wir{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  helfen
                </span>
                ?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8"
              >
                Durchsuchen Sie unsere Wissensdatenbank, schauen Sie Video-Tutorials oder fragen Sie unseren
                KI-Assistenten.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-2xl"
              >
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Suchen Sie nach Artikeln, Videos oder Themen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-24 h-14 text-base rounded-2xl border-2 focus:border-primary shadow-lg shadow-primary/5 bg-background/80 backdrop-blur-sm"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 font-mono text-xs text-muted-foreground">
                      <Command className="h-3 w-3" />K
                    </kbd>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-6 mt-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>120+ Artikel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span>45+ Videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>KI-Assistent 24/7</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <TabsList className="bg-muted/50 p-1.5 rounded-xl h-auto flex-wrap">
                <TabsTrigger
                  value="overview"
                  className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Übersicht</span>
                </TabsTrigger>
                <TabsTrigger
                  value="articles"
                  className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">Artikel</span>
                </TabsTrigger>
                <TabsTrigger value="videos" className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5">
                  <MonitorPlay className="h-4 w-4" />
                  <span className="hidden sm:inline">Videos</span>
                </TabsTrigger>
                <TabsTrigger
                  value="learning"
                  className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Lernpfade</span>
                </TabsTrigger>
                <TabsTrigger value="faq" className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">FAQ</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai-assistant"
                  className="gap-2 data-[state=active]:bg-background rounded-lg px-4 py-2.5 relative"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">KI-Assistent</span>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 mt-0">
              {/* Categories Grid */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Kategorien durchsuchen</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {helpCategories.map((category) => {
                    const Icon = category.icon
                    return (
                      <Card
                        key={category.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group border-2",
                          selectedCategory === category.id
                            ? "border-primary"
                            : "border-transparent hover:border-primary/20",
                        )}
                        onClick={() => {
                          setSelectedCategory(category.id)
                          setActiveTab("articles")
                        }}
                      >
                        <CardContent className="p-5">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                              category.bgColor,
                            )}
                          >
                            <Icon className={cn("h-6 w-6", category.color)} />
                          </div>
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                          <Badge variant="secondary" className="text-xs">
                            {category.articleCount} Artikel
                          </Badge>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Popular Articles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Beliebte Artikel</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("articles")}>
                    Alle anzeigen <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {helpArticles.slice(0, 3).map((article) => (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          {getDifficultyBadge(article.difficulty)}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {article.views.toLocaleString()}
                          </div>
                        </div>
                        <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{article.readTime} Min. Lesezeit</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Schnellaktionen</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickActions.map((action) => {
                    const Icon = action.icon
                    return (
                      <Button
                        key={action.label}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 bg-transparent"
                        onClick={() => (window.location.href = action.href)}
                      >
                        <Icon className={cn("h-5 w-5", action.color)} />
                        <span className="text-sm">{action.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* AI Assistant Promo */}
              <Card className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardContent className="p-8 relative">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-xl shadow-primary/25">
                      <Bot className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold mb-2">KI-Assistent</h3>
                      <p className="text-muted-foreground mb-4">
                        Stellen Sie Ihre Fragen in natürlicher Sprache. Unser KI-Assistent kennt alle Funktionen und
                        kann personalisierte Hilfe basierend auf Ihrer Praxiskonfiguration geben.
                      </p>
                      <Button
                        onClick={() => setActiveTab("ai-assistant")}
                        className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Jetzt fragen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-6 mt-0">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedCategory || "all"}
                    onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Kategorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Kategorien</SelectItem>
                      {helpCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={(v: "popular" | "recent" | "alphabetical") => setSortBy(v)}>
                    <SelectTrigger className="w-[160px]">
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Beliebteste</SelectItem>
                      <SelectItem value="recent">Neueste</SelectItem>
                      <SelectItem value="alphabetical">A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Articles Grid/List */}
              <div className={cn(viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3")}>
                {sortedArticles.map((article) => (
                  <Card
                    key={article.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all group",
                      viewMode === "list" && "flex items-center",
                    )}
                    onClick={() => setSelectedArticle(article)}
                  >
                    <CardContent className={cn("p-5", viewMode === "list" && "flex items-center gap-4 w-full")}>
                      {viewMode === "grid" ? (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            {getDifficultyBadge(article.difficulty)}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {article.views.toLocaleString()}
                            </div>
                          </div>
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{article.readTime} Min.</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {article.category}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                                {article.title}
                              </h3>
                              {getDifficultyBadge(article.difficulty)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{article.description}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-shrink-0">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.readTime} Min.
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.views.toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {sortedArticles.length === 0 && (
                <div className="text-center py-12">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Artikel gefunden</h3>
                  <p className="text-muted-foreground">Versuchen Sie eine andere Suche oder Kategorie.</p>
                </div>
              )}
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-6 mt-0">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((video) => (
                  <Card
                    key={video.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="relative aspect-video bg-muted">
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-8 w-8 text-primary ml-1" />
                        </div>
                      </div>
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white">{video.duration}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views.toLocaleString()} Aufrufe
                        </span>
                        <span>{video.chapters.length} Kapitel</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Learning Paths Tab */}
            <TabsContent value="learning" className="space-y-6 mt-0">
              <div className="grid md:grid-cols-3 gap-6">
                {learningPaths.map((path) => {
                  const Icon = path.icon
                  const completedModules = path.modules.filter((m) => m.completed).length
                  return (
                    <Card key={path.id} className="overflow-hidden hover:shadow-lg transition-all">
                      <div className={cn("h-2 bg-gradient-to-r", path.gradient)} />
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
                              path.gradient,
                            )}
                          >
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          {getDifficultyBadge(path.difficulty)}
                        </div>
                        <CardTitle className="text-lg">{path.title}</CardTitle>
                        <CardDescription>{path.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {completedModules}/{path.modules.length} Module
                            </span>
                            <span className="font-medium">
                              {Math.round((completedModules / path.modules.length) * 100)}%
                            </span>
                          </div>
                          <Progress value={(completedModules / path.modules.length) * 100} className="h-2" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {path.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {path.enrolledCount.toLocaleString()} Teilnehmer
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button className="w-full" variant={path.progress > 0 ? "default" : "outline"}>
                          {path.progress > 0 ? "Fortsetzen" : "Starten"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Häufig gestellte Fragen</CardTitle>
                  <CardDescription>Schnelle Antworten auf die wichtigsten Fragen</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left hover:no-underline">
                          <span className="flex items-center gap-3">
                            <HelpCircle className="h-4 w-4 text-primary flex-shrink-0" />
                            {faq.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pl-7">
                          <p className="text-muted-foreground mb-3">{faq.answer}</p>
                          <div className="flex items-center gap-4">
                            <span className="text-xs text-muted-foreground">War das hilfreich?</span>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              {faq.helpful}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Assistant Tab */}
            <TabsContent value="ai-assistant" className="space-y-6 mt-0">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Chat Area */}
                <div className="lg:col-span-2">
                  <Card
                    className={cn(
                      "flex flex-col transition-all",
                      isChatExpanded ? "fixed inset-4 z-50 rounded-2xl" : "h-[700px]",
                    )}
                  >
                    {/* Chat Header */}
                    <CardHeader className="border-b flex-shrink-0 py-4 bg-gradient-to-r from-primary/5 to-purple-500/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Bot className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Praxis KI-Assistent
                              <Badge className="bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary border-0">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Intelligent
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              Online • Kennt Ihre Praxisdaten
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setChatMessages([])}
                                  disabled={chatMessages.length === 0}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Chat leeren</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Button variant="ghost" size="icon" onClick={() => setIsChatExpanded(!isChatExpanded)}>
                            {isChatExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Chat Messages */}
                    <ScrollArea ref={chatScrollRef} className="flex-1 p-4">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
                            <Sparkles className="h-12 w-12 text-primary" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">
                            Hallo{/* Removed currentUser name interpolation */}!
                          </h3>
                          <p className="text-muted-foreground mb-8 max-w-md">
                            Ich bin Ihr persönlicher KI-Assistent für Effizienz Praxis.
                            {/* Removed practice name interpolation */}
                          </p>
                          <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                            {suggestedQuestions.map((question, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-sm text-left h-auto py-3 px-4 justify-start hover:bg-primary/5 hover:border-primary/50 bg-transparent"
                                onClick={() => sendMessage(question)}
                              >
                                <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 text-amber-500" />
                                <span className="line-clamp-2">{question}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <AnimatePresence mode="popLayout">
                            {chatMessages.map((message) => (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "")}
                              >
                                <Avatar
                                  className={cn(
                                    "w-9 h-9 flex-shrink-0",
                                    message.role === "assistant" && "bg-gradient-to-br from-primary to-purple-500",
                                  )}
                                >
                                  <AvatarFallback
                                    className={message.role === "assistant" ? "text-white bg-transparent" : ""}
                                  >
                                    {message.role === "assistant" ? (
                                      <Bot className="h-5 w-5" />
                                    ) : (
                                      <User className="h-5 w-5" />
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <div
                                  className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-3",
                                    message.role === "user"
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted/80 border",
                                  )}
                                >
                                  {message.practiceContext && message.role === "assistant" && (
                                    <div className="flex items-center gap-1.5 mb-2 text-xs text-primary">
                                      <Database className="h-3 w-3" />
                                      <span>Basierend auf Ihren Praxisdaten</span>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                    {message.isStreaming && (
                                      <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                                    )}
                                  </p>
                                  {message.role === "assistant" && message.sources && !message.isStreaming && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <p className="text-xs text-muted-foreground mb-2">Quellen:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {message.sources.map((source, i) => (
                                          <Badge
                                            key={i}
                                            variant="secondary"
                                            className="text-xs cursor-pointer hover:bg-primary/10"
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            {source.title}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {message.role === "assistant" && message.suggestions && !message.isStreaming && (
                                    <div className="mt-3 pt-3 border-t border-border/50">
                                      <p className="text-xs text-muted-foreground mb-2">Weiterführende Fragen:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {message.suggestions.map((suggestion, i) => (
                                          <Button
                                            key={i}
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto py-1 px-2 text-xs"
                                            onClick={() => sendMessage(suggestion)}
                                          >
                                            {suggestion}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {message.role === "assistant" && !message.isStreaming && (
                                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border/50">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => copyToClipboard(message.content)}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <ThumbsUp className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <ThumbsDown className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {isAiTyping && chatMessages[chatMessages.length - 1]?.role === "user" && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                              <Avatar className="w-9 h-9 bg-gradient-to-br from-primary to-purple-500">
                                <AvatarFallback className="text-white bg-transparent">
                                  <Bot className="h-5 w-5" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="bg-muted/80 border rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                  />
                                  <span
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                  />
                                  <span
                                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      )}
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="border-t p-4 flex-shrink-0 bg-muted/30">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Stellen Sie Ihre Frage..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={handleKeyPress}
                          className="min-h-[48px] max-h-32 resize-none rounded-xl"
                          rows={1}
                        />
                        <Button
                          onClick={() => sendMessage(chatInput)}
                          disabled={!chatInput.trim() || isAiTyping}
                          className="flex-shrink-0 rounded-xl h-12 w-12"
                        >
                          {isAiTyping ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Der KI-Assistent kann Fehler machen. Überprüfen Sie wichtige Informationen.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* AI Sidebar */}
                <div className="space-y-4">
                  {/* Context Card */}
                  {/* Removed context card as hooks were removed */}
                  {/* {currentPractice && (
                    <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Database className="h-4 w-4 text-primary" />
                          Ihr Praxiskontext
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Praxis:</span>
                          <span className="font-medium">{currentPractice.name}</span>
                        </div>
                        {currentPractice.type && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Typ:</span>
                            <span className="font-medium">{currentPractice.type}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          Der KI-Assistent berücksichtigt Ihre Praxiskonfiguration für personalisierte Antworten.
                        </p>
                      </CardContent>
                    </Card>
                  )} */}

                  {/* Quick Questions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Schnellfragen
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {suggestedQuestions.map((question, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2 px-3 text-sm hover:bg-primary/5"
                          onClick={() => sendMessage(question)}
                        >
                          <ChevronRight className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="line-clamp-1">{question}</span>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* AI Features */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        KI-Fähigkeiten
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Praxisspezifische Antworten</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Schritt-für-Schritt Anleitungen</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Best-Practice Empfehlungen</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Fehlerbehebung & Troubleshooting</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Contact Section */}
        <div className="border-t bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Brauchen Sie weitere Hilfe?</h2>
              <p className="text-muted-foreground">Unser Support-Team ist für Sie da</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mb-4">Mo-Fr 9-18 Uhr</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Chat starten
                  </Button>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">E-Mail Support</h3>
                  <p className="text-sm text-muted-foreground mb-4">support@effizienz-praxis.de</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    E-Mail senden
                  </Button>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-all">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Phone className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Telefon</h3>
                  <p className="text-sm text-muted-foreground mb-4">+49 123 456 789</p>
                  <Button variant="outline" className="w-full bg-transparent">
                    Anrufen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Article Dialog */}
        <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedArticle && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getDifficultyBadge(selectedArticle.difficulty)}
                    <Badge variant="outline">{selectedArticle.category}</Badge>
                  </div>
                  <DialogTitle className="text-2xl">{selectedArticle.title}</DialogTitle>
                  <DialogDescription>{selectedArticle.description}</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-4 text-sm text-muted-foreground py-4 border-y">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedArticle.readTime} Min. Lesezeit
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedArticle.views.toLocaleString()} Aufrufe
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-4 w-4" />
                    {selectedArticle.helpful} hilfreich
                  </span>
                </div>
                <div className="prose prose-sm max-w-none py-4">
                  <p>{selectedArticle.content}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">War dieser Artikel hilfreich?</span>
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Ja
                    </Button>
                    <Button variant="outline" size="sm">
                      <ThumbsDown className="h-4 w-4 mr-1" />
                      Nein
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Video Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            {selectedVideo && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedVideo.title}</DialogTitle>
                  <DialogDescription>{selectedVideo.description}</DialogDescription>
                </DialogHeader>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm opacity-75">Video-Player Platzhalter</p>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Kapitel</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedVideo.chapters.map((chapter, i) => (
                      <Button key={i} variant="ghost" className="justify-start h-auto py-2">
                        <span className="text-xs text-muted-foreground mr-2">{chapter.time}</span>
                        {chapter.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LandingPageLayout>
  )
}
