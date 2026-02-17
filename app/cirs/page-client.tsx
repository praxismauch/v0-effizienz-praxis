"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Plus, Search, Filter, X, ClipboardList, AlertTriangle, ShieldAlert, Flame } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import type { CIRSIncident } from "./cirs-constants"
import { categories } from "./cirs-constants"
import { ReportDialog } from "./report-dialog"
import { DetailDialog } from "./detail-dialog"
import { IncidentCard } from "./incident-card"

export const dynamic = "force-dynamic"

export default function CIRSPageClient() {
  const { toast } = useToast()
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()

  const [incidents, setIncidents] = useState<CIRSIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<CIRSIncident | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSeverity, setFilterSeverity] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    if (currentPractice?.id) fetchIncidents()
  }, [currentPractice?.id, activeTab])

  const fetchIncidents = async () => {
    if (!currentPractice?.id) return
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab !== "all") params.append("status", activeTab)

      const response = await fetch(`/api/practices/${currentPractice.id}/cirs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setIncidents(data.incidents || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || "Failed to fetch incidents")
      }
    } catch (error) {
      console.error("Error fetching incidents:", error)
      const errorMessage = error instanceof Error ? error.message : "Vorfalle konnten nicht geladen werden."
      const isSchemaError = errorMessage.includes("schema cache") || errorMessage.includes("PGRST205")
      toast({
        title: "Fehler beim Laden",
        description: isSchemaError
          ? "Die Datenbank wird aktualisiert. Bitte laden Sie die Seite in wenigen Sekunden neu."
          : errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitIncident = async (data: Record<string, unknown>) => {
    if (!currentPractice?.id) return
    if (!data.title || !data.description) {
      toast({
        title: "Unvollstandige Angaben",
        description: "Bitte fullen Sie mindestens Titel und Beschreibung aus.",
        variant: "destructive",
      })
      return
    }

    const response = await fetch(`/api/practices/${currentPractice.id}/cirs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      toast({
        title: "Vorfall gemeldet",
        description: data.is_anonymous
          ? "Ihr anonymer Bericht wurde erfolgreich ubermittelt."
          : "Ihr Bericht wurde erfolgreich ubermittelt.",
      })
      setShowReportDialog(false)
      fetchIncidents()
    } else {
      throw new Error("Failed to submit incident")
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

  const stats = {
    total: incidents.length,
    errors: incidents.filter((i) => i.incident_type === "error").length,
    nearErrors: incidents.filter((i) => i.incident_type === "near_error").length,
    critical: incidents.filter((i) => i.severity === "critical").length,
  }

  return (
    <AppLayout loading={loading} loadingMessage="CIRS-Daten werden geladen...">
      <div className="space-y-6">
        <PageHeader
          title="CIRS"
          subtitle="Critical Incident Reporting System - Fehler- und Beinahe-Fehler-Meldesystem"
          actions={
            <Button onClick={() => setShowReportDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Vorfall melden
            </Button>
          }
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Gesamt"
            value={stats.total}
            icon={ClipboardList}
            description="Gemeldete Vorfalle"
            {...statCardColors.primary}
          />
          <StatCard
            label="Fehler"
            value={stats.errors}
            icon={AlertTriangle}
            description="Tatsachliche Fehler"
            {...statCardColors.red}
          />
          <StatCard
            label="Beinahe-Fehler"
            value={stats.nearErrors}
            icon={ShieldAlert}
            description="Rechtzeitig erkannt"
            {...statCardColors.amber}
          />
          <StatCard
            label="Kritisch"
            value={stats.critical}
            icon={Flame}
            description="Hohe Prioritat"
            {...statCardColors.orange}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={"Vorfalle durchsuchen..."}
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="submitted">Eingereicht</TabsTrigger>
            <TabsTrigger value="under_review">{"In Prufung"}</TabsTrigger>
            <TabsTrigger value="analyzed">Analysiert</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{"Vorfalle werden geladen..."}</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Keine Vorfalle vorhanden</p>
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
                  <IncidentCard
                    key={incident.id}
                    incident={incident}
                    onClick={() => {
                      setSelectedIncident(incident)
                      setShowDetailDialog(true)
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <ReportDialog
          open={showReportDialog}
          onOpenChange={setShowReportDialog}
          onSubmit={handleSubmitIncident}
        />

        <DetailDialog
          open={showDetailDialog}
          onOpenChange={setShowDetailDialog}
          incident={selectedIncident}
        />
      </div>
    </AppLayout>
  )
}
