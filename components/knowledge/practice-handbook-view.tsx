"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ChevronRight,
  Search,
  FileText,
  Download,
  FileDown,
  Loader2,
  Target,
  ClipboardList,
  Compass,
  Briefcase,
  Wrench,
  DoorOpen,
  Users,
  Network,
  GraduationCap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: string
  version: number
  created_at: string
  updated_at: string
  published_at: string | null
}

interface OrgaCategory {
  id: string
  name: string
  color: string
}

interface HandbookChapter {
  id: string
  name: string
  enabled: boolean
  icon: string
}

interface PracticeHandbookViewProps {
  articles: KnowledgeArticle[]
  orgaCategories: OrgaCategory[]
}

const DEFAULT_HANDBOOK_CHAPTERS: HandbookChapter[] = [
  { id: "leitbild", name: "Leitbild", enabled: true, icon: "Compass" },
  { id: "ziele", name: "Ziele", enabled: true, icon: "Target" },
  { id: "zustaendigkeiten", name: "Zuständigkeiten", enabled: true, icon: "ClipboardList" },
  { id: "protokolle", name: "Protokolle", enabled: true, icon: "FileText" },
  { id: "arbeitsplaetze", name: "Arbeitsplätze", enabled: true, icon: "Briefcase" },
  { id: "arbeitsmittel", name: "Arbeitsmittel", enabled: true, icon: "Wrench" },
  { id: "raeume", name: "Räume", enabled: true, icon: "DoorOpen" },
  { id: "kontakte", name: "Kontakte", enabled: true, icon: "Users" },
  { id: "organigramm", name: "Organigramm", enabled: true, icon: "Network" },
  { id: "fortbildung", name: "Fortbildung", enabled: true, icon: "GraduationCap" },
]

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target,
  ClipboardList,
  FileText,
  Compass,
  Briefcase,
  Wrench,
  DoorOpen,
  Users,
  Network,
  GraduationCap,
}

function useChapterData(chapterId: string, practiceId: string | undefined) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!practiceId) {
      setLoading(false)
      setData(null)
      return
    }

    const fetchData = async () => {
      setLoading(true)
      try {
        let endpoint = ""
        switch (chapterId) {
          case "leitbild":
            endpoint = `/api/practices/${practiceId}/leitbild`
            break
          case "ziele":
            endpoint = `/api/practices/${practiceId}/goals`
            break
          case "zustaendigkeiten":
            endpoint = `/api/practices/${practiceId}/responsibilities`
            break
          case "protokolle":
            endpoint = `/api/practices/${practiceId}/protocols`
            break
          case "arbeitsplaetze":
            endpoint = `/api/practices/${practiceId}/staffing-plans`
            break
          case "arbeitsmittel":
            setData({ items: [] })
            setLoading(false)
            return
          case "raeume":
            endpoint = `/api/practices/${practiceId}/rooms`
            break
          case "kontakte":
            setData({ contacts: [] })
            setLoading(false)
            return
          case "organigramm":
            endpoint = `/api/practices/${practiceId}/org-chart`
            break
          case "fortbildung":
            endpoint = `/api/practices/${practiceId}/training/courses`
            break
          default:
            setLoading(false)
            return
        }

        if (chapterId === "leitbild") {
          console.log("[v0] Handbook: Fetching leitbild from", endpoint)
        }

        const response = await fetch(endpoint)
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(`[v0] ${chapterId}: Response is not JSON, likely 404 or rate limit`)
          setData(null)
          setLoading(false)
          return
        }

        const result = await response.json()

        if (chapterId === "leitbild") {
          console.log("[v0] Handbook: Leitbild response:", result)
        }

        setData(result)
      } catch (error) {
        console.error(`Error fetching ${chapterId} data:`, error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [chapterId, practiceId])

  return { data, loading }
}

function ChapterContent({ chapter, practiceId }: { chapter: HandbookChapter; practiceId: string | undefined }) {
  const { data, loading } = useChapterData(chapter.id, practiceId)
  const IconComponent = ICON_MAP[chapter.icon] || FileText

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const renderContent = () => {
    switch (chapter.id) {
      case "leitbild":
        if (!data?.leitbild) return <p className="text-muted-foreground">Kein Leitbild definiert.</p>
        return (
          <div className="space-y-4">
            {data.leitbild.leitbild_one_sentence && (
              <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                <p className="text-lg font-medium italic">"{data.leitbild.leitbild_one_sentence}"</p>
              </div>
            )}
            {data.leitbild.vision_statement && (
              <div>
                <h4 className="font-semibold mb-2">Vision</h4>
                <p className="text-muted-foreground">{data.leitbild.vision_statement}</p>
              </div>
            )}
            {data.leitbild.mission_statement && (
              <div>
                <h4 className="font-semibold mb-2">Mission</h4>
                <p className="text-muted-foreground">{data.leitbild.mission_statement}</p>
              </div>
            )}
          </div>
        )

      case "ziele":
        const goals = data?.goals || data || []
        if (!Array.isArray(goals) || goals.length === 0)
          return <p className="text-muted-foreground">Keine Ziele definiert.</p>
        return (
          <div className="space-y-3">
            {goals.slice(0, 10).map((goal: any) => (
              <div key={goal.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{goal.title}</p>
                  {goal.description && <p className="text-sm text-muted-foreground line-clamp-2">{goal.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {goal.status || "Offen"}
                    </Badge>
                    {goal.priority && (
                      <Badge variant="secondary" className="text-xs">
                        {goal.priority}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {goals.length > 10 && (
              <p className="text-sm text-muted-foreground">... und {goals.length - 10} weitere Ziele</p>
            )}
          </div>
        )

      case "zustaendigkeiten":
        const responsibilities = data?.responsibilities || data || []
        if (!Array.isArray(responsibilities) || responsibilities.length === 0)
          return <p className="text-muted-foreground">Keine Zuständigkeiten definiert.</p>
        return (
          <div className="space-y-3">
            {responsibilities.slice(0, 10).map((resp: any) => (
              <div key={resp.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <ClipboardList className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{resp.name}</p>
                  {resp.description && <p className="text-sm text-muted-foreground line-clamp-2">{resp.description}</p>}
                  {resp.group_name && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {resp.group_name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {responsibilities.length > 10 && (
              <p className="text-sm text-muted-foreground">
                ... und {responsibilities.length - 10} weitere Zuständigkeiten
              </p>
            )}
          </div>
        )

      case "protokolle":
        const protocols = data?.protocols || data || []
        if (!Array.isArray(protocols) || protocols.length === 0)
          return <p className="text-muted-foreground">Keine Protokolle vorhanden.</p>
        return (
          <div className="space-y-3">
            {protocols.slice(0, 10).map((protocol: any) => (
              <div key={protocol.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{protocol.title || protocol.name}</p>
                  {protocol.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {protocol.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {protocols.length > 10 && (
              <p className="text-sm text-muted-foreground">... und {protocols.length - 10} weitere Protokolle</p>
            )}
          </div>
        )

      case "arbeitsplaetze":
        const workstations = data?.items || []
        if (!Array.isArray(workstations) || workstations.length === 0)
          return <p className="text-muted-foreground">Keine Arbeitsplätze definiert.</p>
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {workstations.map((ws: any) => (
              <div key={ws.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Briefcase className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{ws.name}</p>
                  {ws.beschreibung && <p className="text-sm text-muted-foreground line-clamp-2">{ws.beschreibung}</p>}
                </div>
              </div>
            ))}
          </div>
        )

      case "arbeitsmittel":
        const equipment = data?.items || []
        if (!Array.isArray(equipment) || equipment.length === 0)
          return <p className="text-muted-foreground">Keine Arbeitsmittel definiert.</p>
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {equipment.slice(0, 12).map((item: any) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Wrench className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{item.name}</p>
                  {item.type && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {item.type}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {equipment.length > 12 && (
              <p className="text-sm text-muted-foreground col-span-2">
                ... und {equipment.length - 12} weitere Arbeitsmittel
              </p>
            )}
          </div>
        )

      case "raeume":
        const rooms = data?.rooms || []
        if (!Array.isArray(rooms) || rooms.length === 0)
          return <p className="text-muted-foreground">Keine Räume definiert.</p>
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: any) => (
              <div key={room.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <DoorOpen className="h-5 w-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{room.name}</p>
                  {room.beschreibung && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{room.beschreibung}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case "kontakte":
        const contacts = data?.contacts || []
        if (!Array.isArray(contacts) || contacts.length === 0)
          return <p className="text-muted-foreground">Keine Kontakte vorhanden.</p>
        return (
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.slice(0, 10).map((contact: any) => (
              <div key={contact.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </p>
                  {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
                  {contact.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {contact.category}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {contacts.length > 10 && (
              <p className="text-sm text-muted-foreground col-span-2">
                ... und {contacts.length - 10} weitere Kontakte
              </p>
            )}
          </div>
        )

      case "organigramm":
        const positions = data?.positions || []
        if (!Array.isArray(positions) || positions.length === 0)
          return <p className="text-muted-foreground">Kein Organigramm definiert.</p>
        return (
          <div className="space-y-3">
            {positions.slice(0, 10).map((pos: any) => (
              <div key={pos.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Network className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{pos.position_title}</p>
                  {pos.department && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {pos.department}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )

      case "fortbildung":
        const courses = data?.courses || []
        if (!Array.isArray(courses) || courses.length === 0)
          return <p className="text-muted-foreground">Keine Fortbildungen definiert.</p>
        return (
          <div className="space-y-3">
            {courses.slice(0, 10).map((course: any) => (
              <div key={course.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <GraduationCap className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{course.name}</p>
                  {course.provider && <p className="text-sm text-muted-foreground">{course.provider}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {course.category && (
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    )}
                    {course.is_mandatory && (
                      <Badge variant="secondary" className="text-xs">
                        Pflicht
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {courses.length > 10 && (
              <p className="text-sm text-muted-foreground">... und {courses.length - 10} weitere Fortbildungen</p>
            )}
          </div>
        )

      default:
        return <p className="text-muted-foreground">Keine Daten verfügbar.</p>
    }
  }

  return <div className="space-y-4">{renderContent()}</div>
}

export function PracticeHandbookView({ articles, orgaCategories }: PracticeHandbookViewProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingWord, setExportingWord] = useState(false)
  const [handbookChapters, setHandbookChapters] = useState<HandbookChapter[]>(DEFAULT_HANDBOOK_CHAPTERS)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const { toast } = useToast()
  const { currentPractice } = usePractice()

  useEffect(() => {
    const loadHandbookSettings = async () => {
      if (!currentPractice?.id) {
        setLoadingSettings(false)
        return
      }

      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (response.ok) {
          const data = await response.json()
          if (data.settings?.system_settings?.handbookChapters) {
            setHandbookChapters(data.settings.system_settings.handbookChapters)
          }
        }
      } catch (error) {
        console.error("Error loading handbook settings:", error)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadHandbookSettings()
  }, [currentPractice?.id])

  const enabledChapters = handbookChapters.filter((c) => c.enabled)

  const publishedArticles = articles.filter((a) => a.status === "published")

  const filteredArticles = searchQuery
    ? publishedArticles.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : publishedArticles

  const groupedArticles = filteredArticles.reduce(
    (acc, article) => {
      const category = article.category || "Ohne Kategorie"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(article)
      return acc
    },
    {} as Record<string, KnowledgeArticle[]>,
  )

  const sortedCategories = Object.keys(groupedArticles).sort((a, b) => a.localeCompare(b, "de-DE"))

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const formatContent = (content: string) => {
    return content
      .split("\n")
      .map((line) => {
        if (line.startsWith("### ")) {
          return `<h4 class="text-base font-semibold mt-4 mb-2">${line.substring(4)}</h4>`
        }
        if (line.startsWith("## ")) {
          return `<h3 class="text-lg font-semibold mt-5 mb-3">${line.substring(3)}</h3>`
        }
        if (line.startsWith("# ")) {
          return `<h2 class="text-xl font-bold mt-6 mb-4">${line.substring(2)}</h2>`
        }
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        if (line.trim().startsWith("• ") || line.trim().startsWith("- ")) {
          return `<li class="ml-4">${line.trim().substring(2)}</li>`
        }
        if (line.trim()) {
          return `<p class="mb-2">${line}</p>`
        }
        return ""
      })
      .join("")
  }

  const handleExportPdf = async () => {
    setExportingPdf(true)
    try {
      const response = await fetch("/api/knowledge-base/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: publishedArticles,
          categories: orgaCategories,
        }),
      })

      if (!response.ok) throw new Error("Export fehlgeschlagen")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Praxis-Handbuch-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "PDF erfolgreich erstellt",
        description: "Das Praxis Handbuch wurde als PDF heruntergeladen.",
      })
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Das PDF konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setExportingPdf(false)
    }
  }

  const handleExportWord = async () => {
    setExportingWord(true)
    try {
      const response = await fetch("/api/knowledge-base/export/word", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: publishedArticles,
          categories: orgaCategories,
        }),
      })

      if (!response.ok) throw new Error("Export fehlgeschlagen")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Praxis-Handbuch-${new Date().toISOString().split("T")[0]}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Word-Dokument erfolgreich erstellt",
        description: "Das Praxis Handbuch wurde als Word-Datei heruntergeladen.",
      })
    } catch (error) {
      toast({
        title: "Export fehlgeschlagen",
        description: "Das Word-Dokument konnte nicht erstellt werden.",
        variant: "destructive",
      })
    } finally {
      setExportingWord(false)
    }
  }

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header Card */}
      <Card className="border-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-blue-500 p-3">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-balance">Praxis Handbuch</h1>
              <p className="text-muted-foreground mt-1">
                Vollständige Dokumentation Ihrer Qualitätsmanagement-Prozesse
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleExportWord}
                disabled={exportingWord || (publishedArticles.length === 0 && enabledChapters.length === 0)}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                {exportingWord ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Word
              </Button>
              <Button
                onClick={handleExportPdf}
                disabled={exportingPdf || (publishedArticles.length === 0 && enabledChapters.length === 0)}
                variant="outline"
                className="gap-2 bg-transparent"
              >
                {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                PDF
              </Button>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Im Handbuch suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                <strong>{publishedArticles.length}</strong> veröffentlichte Artikel
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-blue-500" />
              <span className="text-sm">
                <strong>{sortedCategories.length}</strong> Kategorien
              </span>
            </div>
            {enabledChapters.length > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <span className="text-sm">
                  <strong>{enabledChapters.length}</strong> Praxis-Kapitel
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Table of Contents */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Inhaltsverzeichnis</h2>
          <div className="space-y-2">
            {enabledChapters.map((chapter) => {
              const IconComponent = ICON_MAP[chapter.icon] || FileText
              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    const element = document.getElementById(`chapter-${chapter.id}`)
                    element?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium">{chapter.name}</span>
                  <Badge variant="secondary" className="ml-auto">
                    Praxis
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              )
            })}

            {/* Article categories */}
            {sortedCategories.map((category) => {
              const categoryData = orgaCategories.find((cat) => cat.name === category)
              return (
                <button
                  key={category}
                  onClick={() => {
                    const element = document.getElementById(`category-${category}`)
                    element?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                >
                  {categoryData && (
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoryData.color }}
                    />
                  )}
                  <span className="font-medium">{category}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedArticles[category].length}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {enabledChapters.length > 0 && (
        <div className="space-y-6">
          {enabledChapters.map((chapter) => {
            const IconComponent = ICON_MAP[chapter.icon] || FileText
            return (
              <Card key={chapter.id} id={`chapter-${chapter.id}`} className="scroll-mt-6 overflow-hidden">
                <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{chapter.name}</h2>
                      <p className="text-sm text-muted-foreground">Automatisch generiert aus Praxisdaten</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ChapterContent chapter={chapter} practiceId={currentPractice?.id} />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Article sections */}
      {sortedCategories.length > 0 ? (
        <div className="space-y-8">
          {sortedCategories.map((category) => {
            const categoryData = orgaCategories.find((cat) => cat.name === category)
            const isExpanded = expandedCategories.has(category)

            return (
              <Card key={category} id={`category-${category}`} className="scroll-mt-6">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                    {categoryData && (
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: categoryData.color }} />
                    )}
                    <h2 className="text-2xl font-bold">{category}</h2>
                    <Badge variant="secondary">{groupedArticles[category].length} Artikel</Badge>
                  </div>

                  <div className="space-y-8">
                    {groupedArticles[category].map((article, index) => (
                      <div
                        key={article.id}
                        className="border-l-4 pl-6 py-2"
                        style={{ borderColor: categoryData?.color || "#94a3b8" }}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h3 className="text-xl font-semibold text-balance">{article.title}</h3>
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            Version {article.version}
                          </Badge>
                        </div>

                        <div
                          className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
                        />

                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {article.tags.map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                          Zuletzt aktualisiert:{" "}
                          {new Date(article.updated_at).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : enabledChapters.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Inhalte</h3>
            <p className="text-muted-foreground">
              Veröffentlichen Sie Artikel oder aktivieren Sie Praxis-Kapitel in den Einstellungen.
            </p>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
