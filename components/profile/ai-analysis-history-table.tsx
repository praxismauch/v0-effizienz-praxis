"use client"

import { useState, useEffect } from "react"
import { formatDateTimeDE } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Trash2, Search, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AIAnalysisDetailDialog } from "./ai-analysis-detail-dialog"

interface AIAnalysis {
  id: string
  analysis_type: string
  title: string
  summary: string
  full_analysis: any
  metadata: any
  created_at: string
}

const analysisTypeLabels: Record<string, string> = {
  recruiting: "Recruiting",
  team: "Team",
  candidates: "Kandidaten",
  documents: "Dokumente",
  knowledge: "Wissensdatenbank",
  practice: "Praxis-Gesamtanalyse",
}

const analysisTypeColors: Record<string, string> = {
  recruiting: "bg-blue-100 text-blue-800",
  team: "bg-purple-100 text-purple-800",
  candidates: "bg-green-100 text-green-800",
  documents: "bg-orange-100 text-orange-800",
  knowledge: "bg-cyan-100 text-cyan-800",
  practice: "bg-pink-100 text-pink-800",
}

interface AIAnalysisHistoryTableProps {
  userId: string
  practiceId?: string
  limit?: number
}

export function AIAnalysisHistoryTable({ userId, practiceId, limit }: AIAnalysisHistoryTableProps) {
  const { toast } = useToast()
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<AIAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    loadAnalyses()
  }, [userId])

  useEffect(() => {
    filterAnalyses()
  }, [searchQuery, typeFilter, analyses])

  const loadAnalyses = async () => {
    try {
      setIsLoading(true)

      if (!userId) {
        console.error("[v0] No userId provided")
        setAnalyses([])
        return
      }

      const queryParams = new URLSearchParams({ userId })
      if (practiceId) queryParams.append('practiceId', practiceId)
      if (limit) queryParams.append('limit', limit.toString())
      
      const response = await fetch(`/api/ai-analysis-history?${queryParams}`)

      if (response.status === 503) {
        // Service unavailable - rate limiting
        console.warn("[v0] AI analyses API rate limited")
        toast({
          title: "Vorübergehend nicht verfügbar",
          description: "Der Dienst ist vorübergehend überlastet. Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        })
        setAnalyses([])
        return
      }

      // Try to parse response
      let data
      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : { analyses: [] }
      } catch (parseError) {
        console.error("[v0] Failed to parse AI analyses response:", parseError)
        setAnalyses([])
        return
      }

      // Even if response wasn't ok, we might have analyses array
      if (data.analyses) {
        setAnalyses(data.analyses)
      } else {
        setAnalyses([])
      }
    } catch (error) {
      console.error("[v0] Error loading AI analyses:", error)
      setAnalyses([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterAnalyses = () => {
    let filtered = [...analyses]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (analysis) =>
          analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          analysis.summary?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((analysis) => analysis.analysis_type === typeFilter)
    }

    setFilteredAnalyses(filtered)
  }

  const handleView = (analysis: AIAnalysis) => {
    setSelectedAnalysis(analysis)
    setDetailDialogOpen(true)
  }

  const handleDownload = (analysis: AIAnalysis) => {
    const blob = new Blob([JSON.stringify(analysis.full_analysis, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ki-analyse-${analysis.id}-${formatDateTimeDE(new Date(analysis.created_at))}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Analyse heruntergeladen",
      description: "Die KI-Analyse wurde erfolgreich heruntergeladen.",
    })
  }

  const handleDelete = async (analysisId: string) => {
    if (!confirm("Möchten Sie diese Analyse wirklich löschen?")) return

    try {
      const response = await fetch(`/api/ai-analysis-history/${analysisId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete analysis")

      toast({
        title: "Analyse gelöscht",
        description: "Die KI-Analyse wurde erfolgreich gelöscht.",
      })

      loadAnalyses()
    } catch (error) {
      console.error("[v0] Error deleting analysis:", error)
      toast({
        title: "Fehler beim Löschen",
        description: "Die Analyse konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Lade KI-Analysen...</p>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Analysen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Alle Typen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              <SelectItem value="recruiting">Recruiting</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="candidates">Kandidaten</SelectItem>
              <SelectItem value="documents">Dokumente</SelectItem>
              <SelectItem value="knowledge">Wissensdatenbank</SelectItem>
              <SelectItem value="practice">Praxis-Gesamtanalyse</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAnalyses.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-muted p-4">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Keine KI-Analysen gefunden</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery || typeFilter !== "all"
                    ? "Versuchen Sie, Ihre Suchkriterien anzupassen."
                    : "Ihre KI-Analysen werden hier angezeigt, sobald Sie welche erstellt haben."}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Zusammenfassung</TableHead>
                  <TableHead>Erstellt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnalyses.map((analysis) => (
                  <TableRow key={analysis.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">{analysis.title}</TableCell>
                    <TableCell>
                      <Badge className={analysisTypeColors[analysis.analysis_type] || "bg-gray-100 text-gray-800"}>
                        {analysisTypeLabels[analysis.analysis_type] || analysis.analysis_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                      {analysis.summary || "Keine Zusammenfassung verfügbar"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateTimeDE(new Date(analysis.created_at))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleView(analysis)} className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(analysis)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(analysis.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <AIAnalysisDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} analysis={selectedAnalysis} />
    </>
  )
}
