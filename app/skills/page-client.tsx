"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, Award, Sparkles, List, LayoutGrid, FolderOpen } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { AppLayout } from "@/components/app-layout"

import type { Skill, Arbeitsplatz } from "./types"
import { categoryLabels } from "./types"
import { SkillsListView } from "./components/skills-list-view"
import { SkillsGridView } from "./components/skills-grid-view"
import { CreateSkillDialog } from "./components/create-skill-dialog"
import { EditSkillDialog } from "./components/edit-skill-dialog"
import { AiGeneratorDialog } from "./components/ai-generator-dialog"

export default function SkillsPageClient() {
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { isAiEnabled } = useAiEnabled()

  const [mounted, setMounted] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [arbeitsplatzFilter, setArbeitsplatzFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skills-view-mode")
      if (saved === "list" || saved === "grid") return saved
    }
    return "list"
  })

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

  // Category expansion state
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [initialExpandDone, setInitialExpandDone] = useState(false)

  const practiceId = currentPractice?.id

  // Ensure arbeitsplaetze is always an array for safe access
  const safeArbeitsplaetze = Array.isArray(arbeitsplaetze) ? arbeitsplaetze : []

  // Persist view mode
  useEffect(() => {
    localStorage.setItem("skills-view-mode", viewMode)
  }, [viewMode])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch skills
  const fetchSkills = useCallback(async () => {
    if (!practiceId) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/skills`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data.skills || [])
      }
    } catch (error) {
      toast.error("Fehler beim Laden der Kompetenzen")
    } finally {
      setIsLoading(false)
    }
  }, [practiceId])

  // Fetch arbeitsplaetze
  const fetchArbeitsplaetze = useCallback(async () => {
    if (!practiceId) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze`)
      if (response.ok) {
        const data = await response.json()
        setArbeitsplaetze(data.arbeitsplaetze || [])
      }
    } catch (error) {
      console.error("Error fetching arbeitsplaetze:", error)
    }
  }, [practiceId])

  useEffect(() => {
    if (practiceId) {
      fetchSkills()
      fetchArbeitsplaetze()
    }
  }, [practiceId, fetchSkills, fetchArbeitsplaetze])

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      const matchesSearch =
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [skills, searchTerm, categoryFilter])

  // Group skills by category
  const groupedSkills = useMemo(() => {
    return filteredSkills.reduce(
      (acc, skill) => {
        const category = skill.category || "other"
        if (!acc[category]) acc[category] = []
        acc[category].push(skill)
        return acc
      },
      {} as Record<string, Skill[]>
    )
  }, [filteredSkills])

  // Expand all categories by default when skills are first loaded
  useEffect(() => {
    if (!initialExpandDone && skills.length > 0) {
      const allCategories = new Set(skills.map((s) => s.category || "other"))
      setExpandedCategories(allCategories)
      setInitialExpandDone(true)
    }
  }, [skills, initialExpandDone])

  const stats = {
    total: skills.length,
    categories: Object.keys(groupedSkills).length,
  }

  const loading = !mounted || practiceLoading

  // Handlers
  const handleToggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSkill = async (skill: Skill) => {
    if (!confirm(`Möchten Sie "${skill.name}" wirklich löschen?`)) return
    try {
      const response = await fetch(`/api/practices/${practiceId}/skills/${skill.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Kompetenz gelöscht")
        fetchSkills()
      } else {
        toast.error("Fehler beim Löschen")
      }
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Kompetenzen</h1>
            <p className="text-muted-foreground">Verwalten Sie die Kompetenzen Ihrer Praxis</p>
          </div>
          <div className="flex gap-2">
            {isAiEnabled && (
              <Button variant="outline" onClick={() => setIsAiDialogOpen(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                KI-Generator
              </Button>
            )}
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Kompetenz
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Gesamt Skills</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-600 font-medium">Kategorien</p>
                  <p className="text-3xl font-bold">{stats.categories}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Kompetenzen durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={arbeitsplatzFilter} onValueChange={setArbeitsplatzFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Arbeitsplatz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Arbeitsplätze</SelectItem>
              {safeArbeitsplaetze.map((ap) => (
                <SelectItem key={ap.id} value={ap.id}>
                  {ap.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ansicht:</span>
          <div className="flex rounded-lg border bg-muted p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              Liste
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Gitter
            </Button>
          </div>
        </div>

        {/* Skills Display */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : filteredSkills.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Kompetenzen gefunden</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Versuchen Sie andere Suchkriterien"
                  : "Erstellen Sie Ihre erste Kompetenz"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Kompetenz erstellen
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <SkillsListView
            groupedSkills={groupedSkills}
            expandedCategories={expandedCategories}
            onToggleCategory={handleToggleCategory}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        ) : (
          <SkillsGridView
            skills={filteredSkills}
            onEditSkill={handleEditSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        )}

        {/* Dialogs */}
        <CreateSkillDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          practiceId={practiceId?.toString() || ""}
          onSuccess={fetchSkills}
        />

        {editingSkill && (
          <EditSkillDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            skill={editingSkill}
            practiceId={practiceId?.toString() || ""}
            onSuccess={() => {
              fetchSkills()
              setEditingSkill(null)
            }}
          />
        )}

        <AiGeneratorDialog
          open={isAiDialogOpen}
          onOpenChange={setIsAiDialogOpen}
          practiceId={practiceId?.toString() || ""}
          onSuccess={fetchSkills}
        />
      </div>
    </AppLayout>
  )
}
