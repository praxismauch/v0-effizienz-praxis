"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Edit, Sparkles, TrendingUp, Target, AlertCircle, Wand2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SEOKeyword {
  id: string
  keyword: string
  target_url?: string
  priority: "high" | "medium" | "low"
  monthly_search_volume?: number
  difficulty?: number
  current_position?: number
  target_position?: number
  status: "active" | "paused" | "achieved"
  notes?: string
  ai_suggestions?: any
  created_at: string
}

const SEOKeywordsManagerComponent = () => {
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<SEOKeyword[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isOptimizeDialogOpen, setIsOptimizeDialogOpen] = useState(false)
  const [isAiSuggestionsOpen, setIsAiSuggestionsOpen] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [generatingAi, setGeneratingAi] = useState(false)
  const [editingKeyword, setEditingKeyword] = useState<SEOKeyword | null>(null)
  const [optimizingKeyword, setOptimizingKeyword] = useState<SEOKeyword | null>(null)
  const [aiOptimization, setAiOptimization] = useState<any>(null)
  const [optimizing, setOptimizing] = useState(false)

  const [formData, setFormData] = useState({
    keyword: "",
    target_url: "",
    priority: "medium" as "high" | "medium" | "low",
    monthly_search_volume: "",
    difficulty: "",
    current_position: "",
    target_position: "",
    status: "active" as "active" | "paused" | "achieved",
    notes: "",
  })

  useEffect(() => {
    fetchKeywords()
  }, [])

  const fetchKeywords = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/super-admin/seo/keywords/manage")
      const data = await response.json()
      setKeywords(data.keywords || [])
    } catch (error) {
      console.error("[v0] Error fetching keywords:", error)
      toast({
        title: "Fehler",
        description: "Keywords konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        monthly_search_volume: formData.monthly_search_volume ? Number.parseInt(formData.monthly_search_volume) : null,
        difficulty: formData.difficulty ? Number.parseInt(formData.difficulty) : null,
        current_position: formData.current_position ? Number.parseInt(formData.current_position) : null,
        target_position: formData.target_position ? Number.parseInt(formData.target_position) : null,
      }

      console.log("[v0] Submitting keyword:", payload)

      if (editingKeyword) {
        // Update
        const response = await fetch(`/api/super-admin/seo/keywords/manage/${editingKeyword.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("[v0] Update failed:", response.status, errorData)
          throw new Error(`Update failed: ${errorData.error || response.statusText}`)
        }

        toast({
          title: "Keyword aktualisiert",
          description: "Das Keyword wurde erfolgreich aktualisiert",
        })
      } else {
        // Create
        const response = await fetch("/api/super-admin/seo/keywords/manage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("[v0] Creation failed:", response.status, errorData)
          throw new Error(`Creation failed: ${errorData.error || response.statusText}`)
        }

        toast({
          title: "Keyword hinzugefügt",
          description: "Das Keyword wurde erfolgreich hinzugefügt",
        })
      }

      setIsDialogOpen(false)
      resetForm()
      fetchKeywords()
    } catch (error) {
      console.error("[v0] Error saving keyword:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Keyword konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie dieses Keyword wirklich löschen?")) return

    try {
      const response = await fetch(`/api/super-admin/seo/keywords/manage/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Delete failed")

      toast({
        title: "Keyword gelöscht",
        description: "Das Keyword wurde erfolgreich gelöscht",
      })

      fetchKeywords()
    } catch (error) {
      console.error("[v0] Error deleting keyword:", error)
      toast({
        title: "Fehler",
        description: "Keyword konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleOptimize = async (keyword: SEOKeyword) => {
    setOptimizingKeyword(keyword)
    setOptimizing(true)
    setIsOptimizeDialogOpen(true)

    try {
      const response = await fetch("/api/super-admin/seo/ai-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.keyword,
          targetUrl: keyword.target_url,
        }),
      })

      const data = await response.json()
      setAiOptimization(data.optimization)

      // Save AI suggestions to the keyword
      await fetch(`/api/super-admin/seo/keywords/manage/${keyword.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_suggestions: data.optimization,
        }),
      })
    } catch (error) {
      console.error("[v0] Error optimizing keyword:", error)
      toast({
        title: "Fehler",
        description: "KI-Optimierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setOptimizing(false)
    }
  }

  const openEditDialog = (keyword: SEOKeyword) => {
    setEditingKeyword(keyword)
    setFormData({
      keyword: keyword.keyword,
      target_url: keyword.target_url || "",
      priority: keyword.priority,
      monthly_search_volume: keyword.monthly_search_volume?.toString() || "",
      difficulty: keyword.difficulty?.toString() || "",
      current_position: keyword.current_position?.toString() || "",
      target_position: keyword.target_position?.toString() || "",
      status: keyword.status,
      notes: keyword.notes || "",
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingKeyword(null)
    setFormData({
      keyword: "",
      target_url: "",
      priority: "medium",
      monthly_search_volume: "",
      difficulty: "",
      current_position: "",
      target_position: "",
      status: "active",
      notes: "",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500"
      case "paused":
        return "bg-gray-500"
      case "achieved":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const generateAiKeywords = async () => {
    try {
      setGeneratingAi(true)
      const response = await fetch("/api/super-admin/seo/keywords/ai-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error("Failed to generate keywords")
      }

      const data = await response.json()
      setAiSuggestions(data.suggestions || [])
      setIsAiSuggestionsOpen(true)
    } catch (error) {
      console.error("[v0] Error generating AI keywords:", error)
      toast({
        title: "Fehler",
        description: "KI-Keywords konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setGeneratingAi(false)
    }
  }

  const addSuggestedKeyword = (keyword: string) => {
    setFormData({
      keyword,
      target_url: "",
      priority: "medium",
      monthly_search_volume: "",
      difficulty: "",
      current_position: "",
      target_position: "",
      status: "active",
      notes: "Von KI vorgeschlagen",
    })
    setIsAiSuggestionsOpen(false)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">SEO Keywords verwalten</h3>
          <p className="text-muted-foreground">
            Fügen Sie relevante Keywords hinzu und nutzen Sie KI für Optimierungsvorschläge
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateAiKeywords} disabled={generatingAi} variant="outline">
            <Wand2 className="h-4 w-4 mr-2" />
            {generatingAi ? "Generiere..." : "KI-Vorschläge"}
          </Button>
          <Button
            onClick={() => {
              resetForm()
              setIsDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Keyword hinzufügen
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keywords.map((keyword) => (
          <Card key={keyword.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{keyword.keyword}</CardTitle>
                  {keyword.target_url && (
                    <CardDescription className="text-xs mt-1">{keyword.target_url}</CardDescription>
                  )}
                </div>
                <TooltipProvider>
                  <div className="flex gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-950"
                          onClick={() => handleOptimize(keyword)}
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>KI-Optimierung</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-950"
                          onClick={() => openEditDialog(keyword)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Keyword bearbeiten</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950"
                          onClick={() => handleDelete(keyword.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Keyword löschen</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Badge className={getPriorityColor(keyword.priority)}>{keyword.priority}</Badge>
                <Badge className={getStatusColor(keyword.status)}>{keyword.status}</Badge>
              </div>

              {keyword.monthly_search_volume && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>{keyword.monthly_search_volume.toLocaleString("de-DE")} Suchvolumen/Monat</span>
                </div>
              )}

              {keyword.current_position && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Position {keyword.current_position}
                    {keyword.target_position && ` → Ziel: ${keyword.target_position}`}
                  </span>
                </div>
              )}

              {keyword.difficulty && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <span>Schwierigkeit: {keyword.difficulty}/100</span>
                </div>
              )}

              {keyword.ai_suggestions && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  KI-Optimiert
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingKeyword ? "Keyword bearbeiten" : "Neues Keyword hinzufügen"}</DialogTitle>
            <DialogDescription>
              Fügen Sie ein SEO-relevantes Keyword hinzu, um die Website-Optimierung zu verfolgen
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword *</Label>
                <Input
                  id="keyword"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="z.B. Praxissoftware"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_url">Ziel-URL</Label>
                <Input
                  id="target_url"
                  value={formData.target_url}
                  onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                  placeholder="/produkt oder https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="paused">Pausiert</SelectItem>
                    <SelectItem value="achieved">Erreicht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Schwierigkeit (0-100)</Label>
                <Input
                  id="difficulty"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  placeholder="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthly_search_volume">Suchvolumen/Monat</Label>
                <Input
                  id="monthly_search_volume"
                  type="number"
                  value={formData.monthly_search_volume}
                  onChange={(e) => setFormData({ ...formData, monthly_search_volume: e.target.value })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_position">Aktuelle Position</Label>
                <Input
                  id="current_position"
                  type="number"
                  value={formData.current_position}
                  onChange={(e) => setFormData({ ...formData, current_position: e.target.value })}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_position">Ziel-Position</Label>
                <Input
                  id="target_position"
                  type="number"
                  value={formData.target_position}
                  onChange={(e) => setFormData({ ...formData, target_position: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Zusätzliche Informationen..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.keyword}>
              {editingKeyword ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isOptimizeDialogOpen} onOpenChange={setIsOptimizeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              KI-Optimierungsvorschläge für "{optimizingKeyword?.keyword}"
            </DialogTitle>
            <DialogDescription>
              Nutzen Sie diese KI-generierten Vorschläge zur Optimierung Ihrer SEO-Strategie
            </DialogDescription>
          </DialogHeader>

          {optimizing ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium">KI analysiert Keyword...</p>
              </div>
            </div>
          ) : aiOptimization ? (
            <div className="space-y-6">
              {aiOptimization.contentSuggestions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Content-Vorschläge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiOptimization.contentSuggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {aiOptimization.onPageOptimization && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">On-Page-Optimierung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {aiOptimization.onPageOptimization.titleTag && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Title-Tag</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                          {aiOptimization.onPageOptimization.titleTag}
                        </p>
                      </div>
                    )}
                    {aiOptimization.onPageOptimization.metaDescription && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta-Description</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                          {aiOptimization.onPageOptimization.metaDescription}
                        </p>
                      </div>
                    )}
                    {aiOptimization.onPageOptimization.h1 && (
                      <div>
                        <Label className="text-xs text-muted-foreground">H1-Überschrift</Label>
                        <p className="text-sm font-mono bg-muted p-2 rounded mt-1">
                          {aiOptimization.onPageOptimization.h1}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {aiOptimization.keywordVariants && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Keyword-Varianten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aiOptimization.keywordVariants.map((variant: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {variant}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {aiOptimization.contentStructure && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Empfohlene Content-Struktur</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-2">
                      {aiOptimization.contentStructure.map((section: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-medium text-primary">{i + 1}.</span>
                          <span className="text-sm">{section}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {aiOptimization.internalLinking && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Interne Verlinkung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {aiOptimization.internalLinking.map((link: string, i: number) => (
                        <Badge key={i} variant="secondary">
                          {link}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                {aiOptimization.priorityScore && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Priorität</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary">{aiOptimization.priorityScore}/10</div>
                    </CardContent>
                  </Card>
                )}
                {aiOptimization.difficulty && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Schwierigkeit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-primary capitalize">{aiOptimization.difficulty}</div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOptimizeDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiSuggestionsOpen} onOpenChange={setIsAiSuggestionsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              KI-Keyword-Vorschläge
            </DialogTitle>
            <DialogDescription>
              Basierend auf Ihrer Praxis und Branche haben wir diese relevanten Keywords identifiziert
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{suggestion}</span>
                </div>
                <Button size="sm" onClick={() => addSuggestedKeyword(suggestion)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Hinzufügen
                </Button>
              </div>
            ))}
            {aiSuggestions.length === 0 && !generatingAi && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Keine Vorschläge verfügbar</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAiSuggestionsOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const SEOKeywordsManager = SEOKeywordsManagerComponent

export default SEOKeywordsManager
