"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import {
  Users,
  Target,
  Workflow,
  FileText,
  Activity,
  Zap,
  Briefcase,
  BarChart3,
  CheckSquare,
  Calendar,
  Clock,
  Rss,
  Star,
} from "lucide-react"

interface DashboardEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (config: DashboardConfig) => void
  currentConfig?: DashboardConfig
}

export interface DashboardConfig {
  showTeamMembers: boolean
  showGoals: boolean
  showWorkflows: boolean
  showDocuments: boolean
  showActivityChart: boolean
  showQuickActions: boolean
  showRecruiting: boolean
  showActiveCandidates: boolean
  showOpenTasks: boolean
  showTodayAppointments: boolean
  showDrafts: boolean
  showWeeklyTasks: boolean
  showTodaySchedule: boolean
  showRecentActivities: boolean
  showGoogleReviews: boolean
  showTodos: boolean
  todosFilterWichtig?: boolean
  todosFilterDringend?: boolean
  todosFilterPriority?: string
}

const defaultConfig: DashboardConfig = {
  showTeamMembers: false,
  showGoals: true,
  showWorkflows: true,
  showDocuments: false,
  showActivityChart: true,
  showQuickActions: true,
  showRecruiting: false,
  showActiveCandidates: true,
  showOpenTasks: true,
  showTodayAppointments: true,
  showDrafts: false,
  showWeeklyTasks: true,
  showTodaySchedule: true,
  showRecentActivities: true,
  showGoogleReviews: true,
  showTodos: true,
  todosFilterWichtig: undefined,
  todosFilterDringend: undefined,
  todosFilterPriority: undefined,
}

export function DashboardEditorDialog({
  open,
  onOpenChange,
  onSave,
  currentConfig = defaultConfig,
}: DashboardEditorDialogProps) {
  const [config, setConfig] = useState<DashboardConfig>(currentConfig)

  const widgets = [
    {
      id: "showOpenTasks" as keyof DashboardConfig,
      label: "Offene Aufgaben",
      description: "Zu erledigende Aufgaben anzeigen",
      icon: CheckSquare,
    },
    {
      id: "showTodayAppointments" as keyof DashboardConfig,
      label: "Termine heute",
      description: "Heutige Termine anzeigen",
      icon: Calendar,
    },
    {
      id: "showActiveCandidates" as keyof DashboardConfig,
      label: "Aktive Kandidaten",
      description: "Nicht archivierte Bewerber anzeigen",
      icon: Users,
    },
    {
      id: "showGoogleReviews" as keyof DashboardConfig,
      label: "Google Bewertungen",
      description: "Ihre Google Business Bewertungen anzeigen",
      icon: Star,
    },
    {
      id: "showTeamMembers" as keyof DashboardConfig,
      label: "Team Mitglieder",
      description: "Anzahl der Teammitglieder anzeigen",
      icon: Users,
    },
    {
      id: "showDrafts" as keyof DashboardConfig,
      label: "Entwürfe",
      description: "QM-Dokumentation Entwürfe",
      icon: FileText,
    },
    {
      id: "showGoals" as keyof DashboardConfig,
      label: "Aktive Ziele",
      description: "Übersicht aktiver Ziele",
      icon: Target,
    },
    {
      id: "showWorkflows" as keyof DashboardConfig,
      label: "Workflows",
      description: "Anzahl der Workflows anzeigen",
      icon: Workflow,
    },
    {
      id: "showDocuments" as keyof DashboardConfig,
      label: "Dokumente",
      description: "Dokumentenanzahl anzeigen",
      icon: FileText,
    },
    {
      id: "showRecruiting" as keyof DashboardConfig,
      label: "Personalsuche",
      description: "Offene Stellen und Bewerbungen",
      icon: Briefcase,
    },
    {
      id: "showWeeklyTasks" as keyof DashboardConfig,
      label: "Wöchentliche Aufgaben",
      description: "Erledigte und ausstehende Aufgaben diese Woche",
      icon: BarChart3,
    },
    {
      id: "showTodaySchedule" as keyof DashboardConfig,
      label: "Heutige Termine",
      description: "Kalendertermine im Tagesverlauf",
      icon: Clock,
    },
    {
      id: "showActivityChart" as keyof DashboardConfig,
      label: "Aktivitäts-Chart",
      description: "7-Tage Aktivitätsverlauf",
      icon: Activity,
    },
    {
      id: "showRecentActivities" as keyof DashboardConfig,
      label: "Letzte Aktivitäten",
      description: "Aktuelle Updates aus Ihrer Praxis",
      icon: Rss,
    },
    {
      id: "showQuickActions" as keyof DashboardConfig,
      label: "Schnellaktionen",
      description: "Schnellzugriff auf häufige Aktionen",
      icon: Zap,
    },
    {
      id: "showTodos" as keyof DashboardConfig,
      label: "Aufgaben (Todos)",
      description: "Gefilterte Aufgabenliste mit konfigurierbaren Filtern",
      icon: CheckSquare,
    },
  ]

  const handleSave = () => {
    onSave(config)
    onOpenChange(false)
  }

  const handleReset = () => {
    setConfig(defaultConfig)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cockpit bearbeiten</DialogTitle>
          <DialogDescription>
            Wählen Sie die Widgets aus, die auf Ihrem Dashboard angezeigt werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {widgets.map((widget) => {
            const Icon = widget.icon
            const showSubOptions = widget.id === "showTodos" && config.showTodos

            return (
              <Card key={widget.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 p-2 rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={widget.id} className="text-base cursor-pointer">
                        {widget.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{widget.description}</p>
                    </div>
                  </div>
                  <Switch
                    id={widget.id}
                    checked={config[widget.id]}
                    onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, [widget.id]: checked }))}
                  />
                </div>

                {showSubOptions && (
                  <div className="mt-4 pl-12 space-y-3 border-l-2 border-primary/20">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Filter Optionen</Label>
                      <p className="text-xs text-muted-foreground">Wählen Sie die Filter für Ihre Aufgaben</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="wichtig-filter" className="text-sm">
                        Nur wichtige Aufgaben
                      </Label>
                      <Switch
                        id="wichtig-filter"
                        checked={config.todosFilterWichtig === true}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({
                            ...prev,
                            todosFilterWichtig: checked ? true : undefined,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="dringend-filter" className="text-sm">
                        Nur dringende Aufgaben
                      </Label>
                      <Switch
                        id="dringend-filter"
                        checked={config.todosFilterDringend === true}
                        onCheckedChange={(checked) =>
                          setConfig((prev) => ({
                            ...prev,
                            todosFilterDringend: checked ? true : undefined,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority-filter" className="text-sm">
                        Priorität Filter
                      </Label>
                      <select
                        id="priority-filter"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={config.todosFilterPriority || "all"}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            todosFilterPriority: e.target.value === "all" ? undefined : e.target.value,
                          }))
                        }
                      >
                        <option value="all">Alle Prioritäten</option>
                        <option value="high">Nur Hoch</option>
                        <option value="medium">Nur Mittel</option>
                        <option value="low">Nur Niedrig</option>
                      </select>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            Zurücksetzen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>Speichern</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DashboardEditorDialog
