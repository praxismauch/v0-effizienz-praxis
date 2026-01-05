"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { FileText, Calendar, Filter, Package } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SystemChange {
  id: string
  title: string
  description: string
  change_type: string
  created_at: string
  user_id: string
  practice_id: string
  is_aggregated: boolean
  is_user_facing: boolean
  metadata: any
}

function SystemChangesViewer() {
  const [changes, setChanges] = useState<SystemChange[]>([])
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>("all")
  const [showAggregated, setShowAggregated] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [version, setVersion] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchChanges()
    const interval = setInterval(fetchChanges, 30000)
    return () => clearInterval(interval)
  }, [filterType, showAggregated])

  const fetchChanges = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterType !== "all") params.append("changeType", filterType)
      params.append("includeAggregated", showAggregated.toString())

      console.log("[v0] Fetching system changes with params:", params.toString())

      const response = await fetch(`/api/system-changes?${params}`)

      console.log("[v0] Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        throw new Error(`API returned ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Fetched changes count:", data?.length || 0)
      setChanges(data || [])
    } catch (error) {
      console.error("[v0] Error fetching changes:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      toast({
        title: "Fehler",
        description: `Fehler beim Laden der System-Änderungen: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleChange = (id: string) => {
    const newSelected = new Set(selectedChanges)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedChanges(newSelected)
  }

  const handleCreateChangelog = async () => {
    if (selectedChanges.size === 0) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie mindestens eine Änderung aus",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/system-changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeIds: Array.from(selectedChanges),
          version: version || undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to create changelog")

      toast({
        title: "Erfolg",
        description: "Changelog erfolgreich erstellt",
      })

      setDialogOpen(false)
      setSelectedChanges(new Set())
      setVersion("")
      fetchChanges()
    } catch (error) {
      console.error("[v0] Error creating changelog:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Erstellen des Changelogs",
        variant: "destructive",
      })
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      feature: "bg-green-100 text-green-800",
      bugfix: "bg-red-100 text-red-800",
      improvement: "bg-blue-100 text-blue-800",
      security: "bg-purple-100 text-purple-800",
      database: "bg-yellow-100 text-yellow-800",
      api: "bg-orange-100 text-orange-800",
      ui: "bg-pink-100 text-pink-800",
      configuration: "bg-gray-100 text-gray-800",
    }
    return colors[type] || "bg-gray-100 text-gray-800"
  }

  const filteredChanges = changes.filter((change) => !change.is_aggregated || showAggregated)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System-Änderungen</h2>
          <p className="text-muted-foreground">
            Verfolgen Sie alle System-Änderungen und erstellen Sie automatisch Changelogs
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={selectedChanges.size === 0}>
          <Package className="h-4 w-4 mr-2" />
          Changelog erstellen ({selectedChanges.size})
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter nach Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="feature">Funktionen</SelectItem>
                <SelectItem value="bugfix">Fehlerbehebungen</SelectItem>
                <SelectItem value="improvement">Verbesserungen</SelectItem>
                <SelectItem value="security">Sicherheit</SelectItem>
                <SelectItem value="database">Datenbank</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="configuration">Konfiguration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="show-aggregated" checked={showAggregated} onCheckedChange={setShowAggregated} />
            <Label htmlFor="show-aggregated" className="text-sm">
              Bereits aggregierte anzeigen
            </Label>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : filteredChanges.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Keine System-Änderungen gefunden</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredChanges.map((change) => (
            <Card key={change.id} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedChanges.has(change.id)}
                  onCheckedChange={() => handleToggleChange(change.id)}
                  disabled={change.is_aggregated}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{change.title}</h3>
                    <Badge className={getTypeColor(change.change_type)}>{change.change_type}</Badge>
                    {change.is_aggregated && <Badge variant="outline">Aggregiert</Badge>}
                    {change.is_user_facing && <Badge variant="secondary">Benutzer-relevant</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{change.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(change.created_at).toLocaleString("de-DE")}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changelog erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Changelog-Eintrag aus {selectedChanges.size} ausgewählten Änderungen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="version">Version (optional)</Label>
              <Input
                id="version"
                placeholder="z.B. 1.2.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Wenn leer, wird das heutige Datum verwendet</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateChangelog}>Changelog erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SystemChangesViewer
