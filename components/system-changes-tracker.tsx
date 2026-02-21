"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Download, RefreshCw, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemChange {
  id: string
  change_type: string
  entity_type: string
  action: string
  title: string
  description: string
  is_aggregated: boolean
  created_at: string
}

const SystemChangesTracker = () => {
  const [changes, setChanges] = useState<SystemChange[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [summary, setSummary] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchChanges()
  }, [])

  const fetchChanges = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ aggregated: "false", limit: "200" })
      if (startDate) params.append("start_date", startDate)
      if (endDate) params.append("end_date", endDate)

      const response = await fetch(`/api/system-changes?${params}`)
      if (!response.ok) throw new Error("Failed to fetch")

      const data = await response.json()
      setChanges(data)
    } catch (error) {
      console.error("[v0] Fetch error:", error)
      toast({
        title: "Fehler",
        description: "Systemaenderungen konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAggregate = async () => {
    try {
      const response = await fetch("/api/system-changes/aggregate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      })

      if (!response.ok) throw new Error("Failed to aggregate")

      const result = await response.json()
      setSummary(result.summary)

      toast({
        title: "Success",
        description: `Aggregated ${result.count} changes`,
      })
    } catch (error) {
      console.error("[v0] Aggregate error:", error)
      toast({
        title: "Error",
        description: "Failed to aggregate changes",
        variant: "destructive",
      })
    }
  }

  const changeTypeColors: Record<string, string> = {
    feature: "bg-blue-100 text-blue-800",
    update: "bg-green-100 text-green-800",
    fix: "bg-red-100 text-red-800",
    config: "bg-purple-100 text-purple-800",
    security: "bg-orange-100 text-orange-800",
    performance: "bg-yellow-100 text-yellow-800",
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Automatic Change Tracking</h3>
        <p className="text-sm text-muted-foreground">
          System changes are automatically logged and can be used to generate release notes
        </p>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="start-date">Start Date</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="flex-1">
          <Label htmlFor="end-date">End Date</Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <Button onClick={fetchChanges} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={handleAggregate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Aggregate for AI
        </Button>
      </div>

      {summary && (
        <Card className="p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Aggregated Changes Summary
          </h4>
          <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-64 whitespace-pre-wrap">{summary}</pre>
          <p className="text-xs text-muted-foreground mt-2">
            Copy this summary and use it in the changelog manager's AI generation
          </p>
        </Card>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Recent Changes ({changes.length})</h4>
          {changes.length > 0 && (
            <Badge variant="secondary">{changes.filter((c) => !c.is_aggregated).length} unaggregated</Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : changes.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No changes tracked yet</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {changes.map((change) => (
              <Card key={change.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={changeTypeColors[change.change_type] || "bg-gray-100 text-gray-800"}>
                        {change.change_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {change.entity_type}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm">{change.title}</p>
                    {change.description && <p className="text-xs text-muted-foreground mt-1">{change.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(change.created_at).toLocaleDateString("de-DE")}
                    </p>
                    {change.is_aggregated && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Aggregated
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemChangesTracker
