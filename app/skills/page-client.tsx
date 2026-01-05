"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Plus,
  Search,
  Award,
  Edit,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Wand2,
  CheckCircle2,
  Loader2,
  Building2,
  MapPin,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { AppLayout } from "@/components/app-layout"

interface Skill {
  id: string
  name: string
  description: string | null
  category: string | null
  team_id: string | null
  is_active: boolean
  display_order: number
  level_0_description: string | null
  level_1_description: string | null
  level_2_description: string | null
  level_3_description: string | null
  created_at: string
  updated_at: string
}

interface GeneratedSkill {
  name: string
  description: string
  category: string
  level_0_description: string
  level_1_description: string
  level_2_description: string
  level_3_description: string
  selected?: boolean
}

// Added Arbeitsplatz interface
interface Arbeitsplatz {
  id: string
  name: string
  beschreibung?: string
}

const categoryLabels: Record<string, string> = {
  medical: "Medizinisch",
  administrative: "Administrativ",
  communication: "Kommunikation",
  technical: "Technisch",
  leadership: "Führung",
  soft_skills: "Soft Skills",
  quality: "Qualität",
  hygiene: "Hygiene",
  emergency: "Notfall",
  other: "Sonstiges",
}

const categoryColors: Record<string, string> = {
  medical: "bg-red-100 text-red-800 border-red-200",
  administrative: "bg-blue-100 text-blue-800 border-blue-200",
  communication: "bg-green-100 text-green-800 border-green-200",
  technical: "bg-purple-100 text-purple-800 border-purple-200",
  leadership: "bg-orange-100 text-orange-800 border-orange-200",
  soft_skills: "bg-pink-100 text-pink-800 border-pink-200",
  quality: "bg-cyan-100 text-cyan-800 border-cyan-200",
  hygiene: "bg-teal-100 text-teal-800 border-teal-200",
  emergency: "bg-amber-100 text-amber-800 border-amber-200",
  other: "bg-gray-100 text-gray-800 border-gray-200",
}

const LEVEL_INFO = [
  {
    level: 0,
    title: "Kein Skill",
    color: "bg-gray-100 text-gray-700",
    description: "Keine Erfahrung, benötigt vollständige Anleitung",
  },
  {
    level: 1,
    title: "Basis",
    color: "bg-amber-100 text-amber-700",
    description: "Kann einfache Aufgaben mit Anleitung ausführen",
  },
  {
    level: 2,
    title: "Selbstständig",
    color: "bg-blue-100 text-blue-700",
    description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
  },
  {
    level: 3,
    title: "Experte",
    color: "bg-emerald-100 text-emerald-700",
    description: "Beherrscht komplexe Situationen, kann andere anleiten",
  },
]

export default function SkillsPageClient() {
  const { user } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  // Delete or comment out: const { toast } = useToast()
  const { isAiEnabled } = useAiEnabled()

  const [mounted, setMounted] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [arbeitsplatzFilter, setArbeitsplatzFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [expandedGeneratedSkill, setExpandedGeneratedSkill] = useState<string | null>(null)

  // AI Generator State
  const [aiKeywords, setAiKeywords] = useState("")
  const [aiCount, setAiCount] = useState(10)
  const [generatedSkills, setGeneratedSkills] = useState<GeneratedSkill[]>([])
  const [isSavingGenerated, setIsSavingGenerated] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "other",
    level_0_description: "Keine Erfahrung, benötigt vollständige Anleitung",
    level_1_description: "Kann einfache Aufgaben mit Anleitung ausführen",
    level_2_description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
    level_3_description: "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
  })

  // Added state for Arbeitsplätze
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [selectedArbeitsplaetze, setSelectedArbeitsplaetze] = useState<string[]>([])
  const [skillArbeitsplaetzeMap, setSkillArbeitsplaetzeMap] = useState<Record<string, string[]>>({})
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set()) // State to track expanded categories

  const practiceId = currentPractice?.id

  // Function to fetch skills, renamed from loadSkills for consistency with new fetch patterns
  const fetchSkills = useCallback(async () => {
    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      setSkills([])
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/skills`)
      const text = await response.text()

      if (text.includes("Too Many") || text.includes("rate limit")) {
        toast.error("Rate Limit", {
          description: "Zu viele Anfragen. Bitte warten Sie einen Moment.",
        })
        setSkills([])
        return
      }

      try {
        const data = JSON.parse(text)
        const skillsArray = Array.isArray(data) ? data : data.skills || []
        setSkills(skillsArray)
      } catch (parseError) {
        setSkills([])
      }
    } catch (error) {
      toast.error("Fehler", {
        description: "Kompetenzen konnten nicht geladen werden.",
      })
      setSkills([])
    } finally {
      setIsLoading(false)
    }
  }, [practiceId])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !practiceLoading && currentPractice?.id) {
      fetchSkills()
    }
  }, [mounted, fetchSkills, practiceLoading, currentPractice?.id])

  const fetchArbeitsplaetze = useCallback(async () => {
    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }

    try {
      const response = await fetch(`/api/practices/${practiceId}/arbeitsplaetze`)
      if (response.ok) {
        const data = await response.json()
        setArbeitsplaetze(data || [])
      }
    } catch (error) {
      console.error("Error fetching Arbeitsplätze:", error)
    }
  }, [practiceId])

  const fetchSkillArbeitsplaetze = useCallback(
    async (skillId?: string) => {
      if (!practiceId) {
        toast.error("Fehler", {
          description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
        })
        return []
      }
      if (skillId) {
        try {
          const response = await fetch(`/api/practices/${practiceId}/skills/${skillId}/arbeitsplaetze`)
          if (response.ok) {
            const data = await response.json()
            return data.arbeitsplaetzeIds || []
          }
        } catch (error) {
          // Silent fail for individual skill
        }
        return []
      }

      const map: Record<string, string[]> = {}
      await Promise.all(
        skills.map(async (skill) => {
          try {
            const response = await fetch(`/api/practices/${practiceId}/skills/${skill.id}/arbeitsplaetze`)
            if (response.ok) {
              const data = await response.json()
              map[skill.id] = data.arbeitsplaetzeIds || []
            }
          } catch (error) {
            // Silent fail for individual skill
          }
        }),
      )
      setSkillArbeitsplaetzeMap(map)
      return [] // Return empty array when fetching for all skills
    },
    [practiceId, skills],
  )

  useEffect(() => {
    fetchArbeitsplaetze()
  }, [fetchArbeitsplaetze])

  // Fetch arbeitsplaetze associations when skills change
  useEffect(() => {
    fetchSkillArbeitsplaetze()
  }, [fetchSkillArbeitsplaetze])

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error("Validierungsfehler", {
        description: "Bitte geben Sie einen Namen ein.",
      })
      return
    }

    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          created_by: user?.id,
        }),
      })

      if (!response.ok) throw new Error("Fehler beim Erstellen")

      const newSkill = await response.json()

      // Save arbeitsplätze associations
      if (selectedArbeitsplaetze.length > 0) {
        await fetch(`/api/practices/${practiceId}/skills/${newSkill.id}/arbeitsplaetze`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ arbeitsplatz_ids: selectedArbeitsplaetze }),
        })
      }

      toast.success("Skill-Anforderung erstellt") // Changed to sonner toast
      setIsCreateDialogOpen(false)
      fetchSkills() // Renamed from loadSkills
    } catch (error) {
      toast.error("Fehler beim Erstellen") // Changed to sonner toast
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedSkill) {
      toast.error("Fehler", {
        description: "Kein Skill ausgewählt.",
      })
      return
    }

    if (!formData.name.trim()) {
      toast.error("Validierungsfehler", {
        description: "Bitte geben Sie einen Namen ein.",
      })
      return
    }

    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/skills/${selectedSkill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          changed_by: user?.id,
        }),
      })

      if (!response.ok) throw new Error("Fehler beim Aktualisieren")

      // Update arbeitsplätze associations
      await fetch(`/api/practices/${practiceId}/skills/${selectedSkill.id}/arbeitsplaetze`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arbeitsplatz_ids: selectedArbeitsplaetze }),
      })

      toast.success("Skill-Anforderung aktualisiert") // Changed to sonner toast
      setIsEditDialogOpen(false)
      fetchSkills() // Renamed from loadSkills
    } catch (error) {
      toast.error("Fehler beim Aktualisieren") // Changed to sonner toast
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (skill: Skill) => {
    if (!currentPractice?.id) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/skills/${skill.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setSkills((prev) => prev.filter((s) => s.id !== skill.id))
        toast.success("Kompetenz gelöscht", {
          description: "Die Kompetenz wurde erfolgreich gelöscht.",
        })
      }
    } catch (error) {
      toast.error("Fehler", {
        description: "Die Kompetenz konnte nicht gelöscht werden.",
      })
    }
  }

  const handleGenerateWithAI = async () => {
    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }

    if (!aiKeywords.trim()) {
      toast.error("Fehler", {
        description: "Bitte geben Sie Stichworte ein.",
      })
      return
    }

    setIsGeneratingAI(true)
    setGeneratedSkills([])

    try {
      const existingSkillNames = skills.map((s) => s.name)

      const response = await fetch(`/api/practices/${practiceId}/skills/generate-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: aiKeywords,
          count: aiCount,
          existingSkillNames,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler bei der KI-Generierung")
      }

      const data = await response.json()
      const skillsWithSelection = (data.skills || []).map((skill: GeneratedSkill) => ({
        ...skill,
        selected: true,
      }))

      setGeneratedSkills(skillsWithSelection)

      toast.success("Skills generiert", {
        description: `${skillsWithSelection.length} Skills wurden generiert. Wählen Sie die gewünschten aus.`,
      })
    } catch (error: any) {
      toast.error("Fehler", {
        description: error.message || "KI-Generierung fehlgeschlagen.",
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSaveGeneratedSkills = async () => {
    if (!practiceId) {
      toast.error("Fehler", {
        description: "Keine Praxis-ID gefunden. Bitte Seite neu laden.",
      })
      return
    }

    const selectedSkills = generatedSkills.filter((s) => s.selected)
    if (selectedSkills.length === 0) {
      toast.info("Bitte wählen Sie mindestens einen Skill aus.")
      return
    }

    setIsSavingGenerated(true)
    let savedCount = 0

    try {
      for (const skill of selectedSkills) {
        const response = await fetch(`/api/practices/${practiceId}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: skill.name,
            description: skill.description,
            category: skill.category,
            level_0_description: skill.level_0_description,
            level_1_description: skill.level_1_description,
            level_2_description: skill.level_2_description,
            level_3_description: skill.level_3_description,
          }),
        })
        if (response.ok) savedCount++
      }

      toast.success("Skills gespeichert", {
        description: `${savedCount} von ${selectedSkills.length} Skills wurden erfolgreich gespeichert.`,
      })

      setIsAIGeneratorOpen(false)
      setGeneratedSkills([])
      setAiKeywords("")
      fetchSkills() // Renamed from loadSkills
    } catch (error) {
      toast.error("Fehler", {
        description: "Einige Skills konnten nicht gespeichert werden.",
      })
    } finally {
      setIsSavingGenerated(false)
    }
  }

  const toggleGeneratedSkillSelection = (index: number) => {
    setGeneratedSkills((prev) =>
      prev.map((skill, i) => (i === index ? { ...skill, selected: !skill.selected } : skill)),
    )
  }

  const toggleAllGeneratedSkills = (selected: boolean) => {
    setGeneratedSkills((prev) => prev.map((skill) => ({ ...skill, selected })))
  }

  const openEditDialog = async (skill: Skill) => {
    setSelectedSkill(skill)
    setFormData({
      name: skill.name,
      description: skill.description || "",
      category: skill.category || "other",
      level_0_description: skill.level_0_description || "Keine Erfahrung, benötigt vollständige Anleitung",
      level_1_description: skill.level_1_description || "Kann einfache Aufgaben mit Anleitung ausführen",
      level_2_description: skill.level_2_description || "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
      level_3_description:
        skill.level_3_description || "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
    })
    // Load arbeitsplätze associations
    const skillArbeitsplaetzeIds = await fetchSkillArbeitsplaetze(skill.id)
    setSelectedArbeitsplaetze(skillArbeitsplaetzeIds)
    setIsEditDialogOpen(true)
  }

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      category: "other",
      level_0_description: "Keine Erfahrung, benötigt vollständige Anleitung",
      level_1_description: "Kann einfache Aufgaben mit Anleitung ausführen",
      level_2_description: "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
      level_3_description: "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
    })
    setSelectedArbeitsplaetze([])
    setIsCreateDialogOpen(true)
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleArbeitsplatz = (arbeitsplatzId: string) => {
    setSelectedArbeitsplaetze((prev) =>
      prev.includes(arbeitsplatzId) ? prev.filter((id) => id !== arbeitsplatzId) : [...prev, arbeitsplatzId],
    )
  }

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter
    // Filter by Arbeitsplatz
    const matchesArbeitsplatz =
      arbeitsplatzFilter === "all" || skillArbeitsplaetzeMap[skill.id]?.includes(arbeitsplatzFilter)
    return matchesSearch && matchesCategory && matchesArbeitsplatz
  })

  const groupedSkills = filteredSkills.reduce(
    (acc, skill) => {
      const category = skill.category || "other"
      if (!acc[category]) acc[category] = []
      acc[category].push(skill)
      return acc
    },
    {} as Record<string, Skill[]>,
  )

  const stats = {
    total: skills.length,
    categories: Object.keys(groupedSkills).length,
  }

  const loading = !mounted || practiceLoading

  if (loading) {
    return (
      <AppLayout loading={true} loadingMessage="Lade Kompetenzen...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!currentPractice) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">Keine Praxis ausgewählt. Bitte wählen Sie eine Praxis aus.</p>
        </div>
      </AppLayout>
    )
  }

  const ArbeitsplaetzeSelect = () => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Arbeitsplätze
      </Label>
      <p className="text-xs text-muted-foreground mb-2">
        Wählen Sie die Arbeitsplätze, an denen diese Kompetenz benötigt wird.
      </p>
      {arbeitsplaetze.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Keine Arbeitsplätze vorhanden</p>
      ) : (
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
          {arbeitsplaetze.map((ap) => (
            <div
              key={ap.id}
              className="flex items-center space-x-2 hover:bg-muted/50 p-1 rounded cursor-pointer"
              onClick={() => toggleArbeitsplatz(ap.id)}
            >
              <Checkbox
                id={`ap-${ap.id}`}
                checked={selectedArbeitsplaetze.includes(ap.id)}
                onCheckedChange={() => toggleArbeitsplatz(ap.id)}
              />
              <label htmlFor={`ap-${ap.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                {ap.name}
              </label>
            </div>
          ))}
        </div>
      )}
      {selectedArbeitsplaetze.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedArbeitsplaetze.map((id) => {
            const ap = arbeitsplaetze.find((a) => a.id === id)
            return ap ? (
              <Badge key={id} variant="secondary" className="text-xs">
                {ap.name}
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )

  const getSkillArbeitsplaetzeNames = (skillId: string): Arbeitsplatz[] => {
    const arbeitsplatzIds = skillArbeitsplaetzeMap[skillId] || []
    return arbeitsplaetze.filter((ap) => arbeitsplatzIds.includes(ap.id))
  }

  return (
    <AppLayout loading={isLoading} loadingMessage="Lade Kompetenzen...">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Skill-Anforderungen</h1>
            <p className="text-muted-foreground">Definieren Sie die Kompetenzen, die Ihre Praxis benötigt</p>
          </div>
          <div className="flex gap-2">
            {isAiEnabled && (
              <Button
                variant="outline"
                onClick={() => setIsAIGeneratorOpen(true)}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
              >
                <Wand2 className="mr-2 h-4 w-4 text-purple-600" />
                KI Skill-System generieren
              </Button>
            )}
            <Button onClick={openCreateDialog}>
              {" "}
              {/* Changed to openCreateDialog */}
              <Plus className="mr-2 h-4 w-4" />
              Neue Kompetenz
            </Button>
          </div>
        </div>

        {/* Level Legend */}
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Skill-Level Übersicht</CardTitle>
            <CardDescription>Jeder Skill hat 4 Level mit klaren, messbaren Kriterien</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {LEVEL_INFO.map((level) => (
                <div key={level.level} className={`p-3 rounded-lg ${level.color}`}>
                  <div className="font-semibold text-sm">
                    Level {level.level}: {level.title}
                  </div>
                  <div className="text-xs mt-1 opacity-80">{level.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600">Gesamt Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-600">Kategorien</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-900">{stats.categories}</div>
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
              {arbeitsplaetze.map((ap) => (
                <SelectItem key={ap.id} value={ap.id}>
                  {ap.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Skills by Category */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : Object.keys(groupedSkills).length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Keine Kompetenzen gefunden</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm
                ? "Versuchen Sie eine andere Suche."
                : "Erstellen Sie Ihre erste Kompetenz oder nutzen Sie den KI-Generator."}
            </p>
            {isAiEnabled && !searchTerm && (
              <Button onClick={() => setIsAIGeneratorOpen(true)} className="mt-4" variant="outline">
                <Wand2 className="mr-2 h-4 w-4" />
                Mit KI generieren
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(category) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <CardTitle className="text-base">{categoryLabels[category] || category}</CardTitle>
                          <Badge variant="secondary">{categorySkills.length}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid gap-2">
                        {categorySkills.map((skill) => (
                          <div
                            key={skill.id}
                            className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Award className="h-4 w-4 text-primary shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{skill.name}</p>
                                {skill.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{skill.description}</p>
                                )}
                                {getSkillArbeitsplaetzeNames(skill.id).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {getSkillArbeitsplaetzeNames(skill.id).map((ap) => (
                                      <Badge
                                        key={ap.id}
                                        variant="outline"
                                        className="text-xs bg-violet-50 text-violet-700 border-violet-200"
                                      >
                                        <MapPin className="h-2.5 w-2.5 mr-1" />
                                        {ap.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={categoryColors[skill.category || "other"] || categoryColors.other}>
                                {categoryLabels[skill.category || "other"] || skill.category}
                              </Badge>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => openEditDialog(skill)}
                                >
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDelete(skill)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Skill-Anforderung</DialogTitle> {/* Changed Title */}
              <DialogDescription>
                Definieren Sie eine neue Kompetenz mit klaren, messbaren Level-Kriterien. {/* Changed Description */}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Grunddaten</TabsTrigger>
                <TabsTrigger value="levels">Level-Definitionen</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Blutabnahme" // Changed placeholder
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Beschreiben Sie die Kompetenz..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Added Arbeitsplätze multi-select */}
                <ArbeitsplaetzeSelect />
              </TabsContent>
              <TabsContent value="levels" className="space-y-4 mt-4">
                {LEVEL_INFO.map((level) => (
                  <div key={level.level} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${level.color}`}>
                        Level {level.level}
                      </span>
                      {level.title}
                    </Label>
                    <Textarea
                      value={formData[`level_${level.level}_description` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`level_${level.level}_description`]: e.target.value,
                        }))
                      }
                      placeholder={level.description}
                      rows={2}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={isSaving || !formData.name.trim()}>
                {isSaving ? "Erstelle..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kompetenz bearbeiten</DialogTitle>
              <DialogDescription>Bearbeiten Sie die Details und Level-Definitionen.</DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Grunddaten</TabsTrigger>
                <TabsTrigger value="levels">Level-Definitionen</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Beschreibung</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Kategorie</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Added Arbeitsplätze multi-select */}
                <ArbeitsplaetzeSelect />
              </TabsContent>
              <TabsContent value="levels" className="space-y-4 mt-4">
                {LEVEL_INFO.map((level) => (
                  <div key={level.level} className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${level.color}`}>
                        Level {level.level}
                      </span>
                      {level.title}
                    </Label>
                    <Textarea
                      value={formData[`level_${level.level}_description` as keyof typeof formData]}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [`level_${level.level}_description`]: e.target.value,
                        }))
                      }
                      placeholder={level.description}
                      rows={2}
                    />
                  </div>
                ))}
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdate} disabled={isSaving || !formData.name.trim()}>
                {isSaving ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Generator Dialog */}
        <Dialog open={isAIGeneratorOpen} onOpenChange={setIsAIGeneratorOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                KI Skill-System Generator
              </DialogTitle>
              <DialogDescription>
                Lassen Sie die KI ein komplettes Skill-System für Ihre Praxis generieren. Beschreiben Sie Ihre Praxis
                und die gewünschten Kompetenzbereiche.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-4">
              {generatedSkills.length === 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Beschreibung / Stichworte *</Label>
                    <Textarea
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder="z.B. Hausarztpraxis, Blutentnahme, EKG, Patientenaufnahme, Abrechnung, Hygiene, Notfallmanagement..."
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Je detaillierter Ihre Beschreibung, desto passender die generierten Skills.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Anzahl Skills: {aiCount}</Label>
                    <Input
                      type="range"
                      min={5}
                      max={30}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>5</span>
                      <span>30</span>
                    </div>
                  </div>

                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-purple-900 mb-2">Was wird generiert?</h4>
                      <ul className="text-sm text-purple-700 space-y-1">
                        <li>• Skill-Namen mit passender Kategorie</li>
                        <li>• Detaillierte Beschreibungen</li>
                        <li>• Klare, messbare Level-Definitionen (0-3)</li>
                        <li>• Praxisspezifische Kriterien</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {generatedSkills.filter((s) => s.selected).length} von {generatedSkills.length} ausgewählt
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleAllGeneratedSkills(true)}>
                        Alle auswählen
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAllGeneratedSkills(false)}>
                        Alle abwählen
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {generatedSkills.map((skill, index) => (
                        <Card
                          key={index}
                          className={`transition-all ${skill.selected ? "border-primary bg-primary/5" : "opacity-60"}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={skill.selected}
                                onCheckedChange={() => toggleGeneratedSkillSelection(index)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{skill.name}</h4>
                                  <Badge
                                    className={categoryColors[skill.category] || categoryColors.other}
                                    variant="outline"
                                  >
                                    {categoryLabels[skill.category] || skill.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{skill.description}</p>

                                <Collapsible
                                  open={expandedGeneratedSkill === skill.name}
                                  onOpenChange={() =>
                                    setExpandedGeneratedSkill(expandedGeneratedSkill === skill.name ? null : skill.name)
                                  }
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                      {expandedGeneratedSkill === skill.name ? (
                                        <>
                                          <ChevronDown className="h-3 w-3 mr-1" /> Level-Details ausblenden
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="h-3 w-3 mr-1" /> Level-Details anzeigen
                                        </>
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2">
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {LEVEL_INFO.map((level) => (
                                        <div key={level.level} className={`p-2 rounded ${level.color}`}>
                                          <div className="font-medium">
                                            Level {level.level}: {level.title}
                                          </div>
                                          <div className="mt-1 opacity-80">
                                            {skill[`level_${level.level}_description` as keyof GeneratedSkill]}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <DialogFooter className="border-t pt-4">
              {generatedSkills.length === 0 ? (
                <>
                  <Button variant="outline" onClick={() => setIsAIGeneratorOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAI || !aiKeywords.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generiere...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Skills generieren
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setGeneratedSkills([])}>
                    Zurück
                  </Button>
                  <Button
                    onClick={handleSaveGeneratedSkills}
                    disabled={isSavingGenerated || generatedSkills.filter((s) => s.selected).length === 0}
                  >
                    {isSavingGenerated ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Speichere...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" /> {generatedSkills.filter((s) => s.selected).length}{" "}
                        Skills speichern
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
