"use client"

import type React from "react"
import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Plus,
  Search,
  Filter,
  X,
  ChevronDown,
  MessageSquare,
  Clock,
  Lightbulb,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react"
import { formatDateDE } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useUser } from "@/contexts/user-context"
import { usePracticeContext } from "@/contexts/practice-context"

export const dynamic = "force-dynamic"

interface CIRSIncident {
  id: string
  incident_type: "error" | "near_error" | "adverse_event"
  severity: "low" | "medium" | "high" | "critical"
  category: string
  title: string
  description: string
  contributing_factors?: string
  immediate_actions?: string
  is_anonymous: boolean
  reporter_name?: string
  reporter_role?: string
  created_at: string
  status: "submitted" | "under_review" | "analyzed" | "closed"
  ai_suggestions?: string
  comment_count?: number
}

export default function CIRSPageClient() {
  const { toast } = useToast()
  const { currentUser } = useUser()
  const { currentPractice } = usePracticeContext()

  const [incidents, setIncidents] = useState<CIRSIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<CIRSIncident | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  // Form state
  const [incidentType, setIncidentType] = useState<"error" | "near_error" | "adverse_event">("near_error")
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [category, setCategory] = useState<string>("medication")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [contributingFactors, setContributingFactors] = useState("")
  const [immediateActions, setImmediateActions] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [generateAISuggestions, setGenerateAISuggestions] = useState(true)
  const [addToKnowledge, setAddToKnowledge] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const categories = [
    { value: "medication", label: "Medikation" },
    { value: "diagnosis", label: "Diagnose" },
    { value: "treatment", label: "Behandlung" },
    { value: "documentation", label: "Dokumentation" },
    { value: "communication", label: "Kommunikation" },
    { value: "hygiene", label: "Hygiene" },
    { value: "equipment", label: "Geräte/Ausstattung" },
    { value: "organization", label: "Organisation" },
    { value: "other", label: "Sonstiges" },
  ]

  useEffect(() => {
    if (currentPractice?.id) {
      fetchIncidents()
    }
  }, [currentPractice?.id, activeTab])

  const fetchIncidents = async () => {
    if (!currentPractice?.id) return

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        params.append("status", activeTab)
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/cirs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setIncidents(data.incidents || [])
      } else {
        throw new Error("Failed to fetch incidents")
      }
    } catch (error) {
      console.error("Error fetching incidents:", error)
      toast({
        title: "Fehler beim Laden",
        description: "Vorfälle konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setIncidentType("near_error")
    setSeverity("medium")
    setCategory("medication")
    setTitle("")
    setDescription("")
    setContributingFactors("")
    setImmediateActions("")
    setIsAnonymous(false)
    setGenerateAISuggestions(true)
    setAddToKnowledge(true)
  }

  const handleSubmitIncident = async () => {
    if (!currentPractice?.id) return
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Unvollständige Angaben",
        description: "Bitte füllen Sie mindestens Titel und Beschreibung aus.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/cirs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_type: incidentType,
          severity,
          category,
          title,
          description,
          contributing_factors: contributingFactors,
          immediate_actions: immediateActions,
          is_anonymous: isAnonymous,
          generate_ai_suggestions: generateAISuggestions,
          add_to_knowledge: addToKnowledge,
        }),
      })

      if (response.ok) {
        toast({
          title: "Vorfall gemeldet",
          description: isAnonymous
            ? "Ihr anonymer Bericht wurde erfolgreich übermittelt."
            : "Ihr Bericht wurde erfolgreich übermittelt.",
        })
        setShowReportDialog(false)
        resetForm()
        fetchIncidents()
      } else {
        throw new Error("Failed to submit incident")
      }
    } catch (error) {
      console.error("Error submitting incident:", error)
      toast({
        title: "Fehler",
        description: "Der Vorfall konnte nicht gemeldet werden.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    const passesSearch =
      searchQuery === "" ||
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase())

    const passesSeverity = filterSeverity === "all" || incident.severity === filterSeverity
    const passesCategory = filterCategory === "all" || incident.category === filterCategory

    return passesSearch && passesSeverity && passesCategory
  })

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "bg-green-100 text-green-800 border-green-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      high: "bg-orange-100 text-orange-800 border-orange-200",
      critical: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[severity as keyof typeof colors] || colors.medium
  }

  const getSeverityLabel = (severity: string) => {
    const labels = {
      low: "Niedrig",
      medium: "Mittel",
      high: "Hoch",
      critical: "Kritisch",
    }
    return labels[severity as keyof typeof labels] || severity
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      error: "Fehler",
      near_error: "Beinahe-Fehler",
      adverse_event: "Unerwünschtes Ereignis",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      case "near_error":
        return <Shield className="h-4 w-4" />
      case "adverse_event":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (cat: string) => {
    return categories.find((c) => c.value === cat)?.label || cat
  }

  const stats = {
    total: incidents.length,
    errors: incidents.filter((i) => i.incident_type === "error").length,
    nearErrors: incidents.filter((i) => i.incident_type === "near_error").length,
    critical: incidents.filter((i) => i.severity === "critical").length,
  }

  return (
    <AppLayout loading={loading} loadingMessage="CIRS-Daten werden geladen...">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">CIRS</h1>
            <p className="text-muted-foreground">Critical Incident Reporting System - Fehler- und Beinahe-Fehler-Meldesystem</p>
          </div>
          <Button onClick={() => setShowReportDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Vorfall melden
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Gesamt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Gemeldete Vorfälle</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fehler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <p className="text-xs text-muted-foreground mt-1">Tatsächliche Fehler</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Beinahe-Fehler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.nearErrors}</div>
              <p className="text-xs text-muted-foreground mt-1">Rechtzeitig erkannt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Kritisch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground mt-1">Hohe Priorität</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Vorfälle durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Schweregrad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Schweregrade</SelectItem>
              <SelectItem value="low">Niedrig</SelectItem>
              <SelectItem value="medium">Mittel</SelectItem>
              <SelectItem value="high">Hoch</SelectItem>
              <SelectItem value="critical">Kritisch</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Incidents List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="submitted">Eingereicht</TabsTrigger>
            <TabsTrigger value="under_review">In Prüfung</TabsTrigger>
            <TabsTrigger value="analyzed">Analysiert</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Vorfälle werden geladen...</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Keine Vorfälle vorhanden</p>
                  <p className="text-muted-foreground mb-4">
                    Melden Sie Fehler oder Beinahe-Fehler, um die Patientensicherheit zu verbessern
                  </p>
                  <Button onClick={() => setShowReportDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ersten Vorfall melden
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredIncidents.map((incident) => (
                  <Card
                    key={incident.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedIncident(incident)
                      setShowDetailDialog(true)
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="outline" className="gap-1">
                              {getTypeIcon(incident.incident_type)}
                              {getTypeLabel(incident.incident_type)}
                            </Badge>
                            <Badge className={getSeverityColor(incident.severity)}>{getSeverityLabel(incident.severity)}</Badge>
                            <Badge variant="secondary">{getCategoryLabel(incident.category)}</Badge>
                            {incident.is_anonymous && (
                              <Badge variant="outline" className="gap-1">
                                <EyeOff className="h-3 w-3" />
                                Anonym
                              </Badge>
                            )}
                            {incident.ai_suggestions && (
                              <Badge variant="outline" className="gap-1 bg-purple-50 text-purple-700 border-purple-200">
                                <Sparkles className="h-3 w-3" />
                                KI-Analyse
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg mb-1">{incident.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{incident.description}</CardDescription>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateDE(incident.created_at)}
                          </div>
                          {!incident.is_anonymous && incident.reporter_name && (
                            <div className="mt-1">{incident.reporter_name}</div>
                          )}
                          {incident.comment_count && incident.comment_count > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <MessageSquare className="h-3 w-3" />
                              {incident.comment_count}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Report Dialog */}
        <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vorfall melden</DialogTitle>
              <DialogDescription>
                Melden Sie Fehler, Beinahe-Fehler oder unerwünschte Ereignisse. Ihre Meldung hilft, die Patientensicherheit zu verbessern.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {isAnonymous ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <div>
                    <Label className="font-medium">Anonyme Meldung</Label>
                    <p className="text-sm text-muted-foreground">Ihr Name wird nicht gespeichert</p>
                  </div>
                </div>
                <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
              </div>

              {/* Incident Type */}
              <div className="space-y-2">
                <Label>Art des Vorfalls *</Label>
                <RadioGroup value={incidentType} onValueChange={(value: any) => setIncidentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="near_error" id="near_error" />
                    <Label htmlFor="near_error" className="font-normal cursor-pointer">
                      Beinahe-Fehler (rechtzeitig erkannt)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="error" id="error" />
                    <Label htmlFor="error" className="font-normal cursor-pointer">
                      Fehler (ist aufgetreten)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="adverse_event" id="adverse_event" />
                    <Label htmlFor="adverse_event" className="font-normal cursor-pointer">
                      Unerwünschtes Ereignis
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Severity */}
              <div className="space-y-2">
                <Label htmlFor="severity">Schweregrad *</Label>
                <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="critical">Kritisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Kurze Zusammenfassung des Vorfalls"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung *</Label>
                <Textarea
                  id="description"
                  placeholder="Was ist passiert? Beschreiben Sie den Vorfall im Detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Contributing Factors */}
              <div className="space-y-2">
                <Label htmlFor="contributing_factors">Mögliche Ursachen / Beitragende Faktoren</Label>
                <Textarea
                  id="contributing_factors"
                  placeholder="Was könnte zu diesem Vorfall beigetragen haben?"
                  value={contributingFactors}
                  onChange={(e) => setContributingFactors(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Immediate Actions */}
              <div className="space-y-2">
                <Label htmlFor="immediate_actions">Sofortmaßnahmen</Label>
                <Textarea
                  id="immediate_actions"
                  placeholder="Welche Maßnahmen wurden unmittelbar ergriffen?"
                  value={immediateActions}
                  onChange={(e) => setImmediateActions(e.target.value)}
                  rows={3}
                />
              </div>

              {/* AI Suggestions */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="font-medium">KI-basierte Vorschläge</Label>
                    <p className="text-sm text-muted-foreground">Automatische Analyse und Präventionsvorschläge generieren</p>
                  </div>
                </div>
                <Switch checked={generateAISuggestions} onCheckedChange={setGenerateAISuggestions} />
              </div>

              {/* Add to Knowledge */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <div>
                    <Label className="font-medium">Zur Wissensdatenbank hinzufügen</Label>
                    <p className="text-sm text-muted-foreground">Analyse und Lösungen im Wissensbereich speichern</p>
                  </div>
                </div>
                <Switch checked={addToKnowledge} onCheckedChange={setAddToKnowledge} />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSubmitIncident} disabled={isSubmitting}>
                {isSubmitting ? "Wird gemeldet..." : "Vorfall melden"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      {getTypeIcon(selectedIncident.incident_type)}
                      {getTypeLabel(selectedIncident.incident_type)}
                    </Badge>
                    <Badge className={getSeverityColor(selectedIncident.severity)}>
                      {getSeverityLabel(selectedIncident.severity)}
                    </Badge>
                    <Badge variant="secondary">{getCategoryLabel(selectedIncident.category)}</Badge>
                    {selectedIncident.is_anonymous && (
                      <Badge variant="outline" className="gap-1">
                        <EyeOff className="h-3 w-3" />
                        Anonym
                      </Badge>
                    )}
                  </div>
                  <DialogTitle>{selectedIncident.title}</DialogTitle>
                  <DialogDescription>
                    Gemeldet am {formatDateDE(selectedIncident.created_at)}
                    {!selectedIncident.is_anonymous && selectedIncident.reporter_name && ` von ${selectedIncident.reporter_name}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label className="font-semibold">Beschreibung</Label>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{selectedIncident.description}</p>
                  </div>

                  {selectedIncident.contributing_factors && (
                    <div>
                      <Label className="font-semibold">Beitragende Faktoren</Label>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{selectedIncident.contributing_factors}</p>
                    </div>
                  )}

                  {selectedIncident.immediate_actions && (
                    <div>
                      <Label className="font-semibold">Sofortmaßnahmen</Label>
                      <p className="text-sm mt-2 whitespace-pre-wrap">{selectedIncident.immediate_actions}</p>
                    </div>
                  )}

                  {selectedIncident.ai_suggestions && (
                    <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <Label className="font-semibold text-purple-900">KI-Analyse und Empfehlungen</Label>
                      </div>
                      <p className="text-sm text-purple-900 whitespace-pre-wrap">{selectedIncident.ai_suggestions}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                    Schließen
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
