"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Table2,
  FileCode,
} from "lucide-react"
import type { SyncData, FormResult } from "./types"

interface DbSchemaTabProps {
  data: SyncData | null
  isLoading: boolean
  progress: number
  progressLabel: string
  onRunCheck: () => void
  onShowPrompt: (prompt: string, title: string) => void
  onCopy: (text: string) => void
  generateAllProblemsPrompt: () => string
  generateAllFixPrompt: () => string
  generateFixPrompt: (form: FormResult) => string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ok": return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "error":
    case "missing_table": return <XCircle className="h-5 w-5 text-red-500" />
    default: return null
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ok": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>
    case "warning": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warnung</Badge>
    case "error": return <Badge variant="destructive">Fehler</Badge>
    case "missing_table": return <Badge variant="destructive">Tabelle fehlt</Badge>
    default: return null
  }
}

export function DbSchemaTab({
  data,
  isLoading,
  progress,
  progressLabel,
  onRunCheck,
  onShowPrompt,
  onCopy,
  generateAllProblemsPrompt,
  generateAllFixPrompt,
  generateFixPrompt,
}: DbSchemaTabProps) {
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const toggleForm = (id: string) => {
    setExpandedForms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const successRate = data ? (data.summary.total > 0 ? (data.summary.ok / data.summary.total) * 100 : 0) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tabellen gesamt</CardTitle>
                <Table2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.total}</div>
                <p className="text-xs text-muted-foreground mt-1">{data.summary.totalColumns || 0} Spalten</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OK</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{data.summary.ok}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{data.summary.warnings}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fehler</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{data.summary.errors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sync-Rate</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{successRate.toFixed(0)}%</div>
                <Progress value={successRate} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {data.summary.categories && data.summary.categories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Kategorien</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.summary.categories.map((cat) => (
                    <Badge key={cat.name} variant="outline" className="text-xs">
                      {cat.name}: {cat.count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            DB-Schema Check
          </CardTitle>
          <CardDescription>
            Prüft ob alle DB-Tabellen Standardspalten (id, created_at) besitzen und kategorisiert sie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={onRunCheck} disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Prüfe...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync-Check ausführen
                </>
              )}
            </Button>
            {data && (data.summary.errors > 0 || data.summary.warnings > 0) && (
              <>
                <Button variant="outline" onClick={() => { const prompt = generateAllProblemsPrompt(); if (prompt) onCopy(prompt) }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Alle Probleme kopieren
                </Button>
                {data.summary.errors > 0 && (
                  <Button variant="outline" onClick={() => { const prompt = generateAllFixPrompt(); if (prompt) onShowPrompt(prompt, "Alle Probleme beheben") }}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    v0-Fix generieren (alle)
                  </Button>
                )}
              </>
            )}
          </div>
          {(isLoading || progress > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressLabel}</span>
                <span className="font-mono text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2 transition-all duration-300" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {data && data.results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Ergebnisse</CardTitle>
                <CardDescription>
                  {statusFilter !== "all" || categoryFilter !== "all"
                    ? `Gefiltert: ${data.results.filter((f) => {
                        const sm = statusFilter === "all" || (statusFilter === "error" && (f.status === "error" || f.status === "missing_table")) || f.status === statusFilter
                        const cm = categoryFilter === "all" || (f.category || "Sonstige") === categoryFilter
                        return sm && cm
                      }).length} von ${data.results.length} Tabellen`
                    : `Detaillierte Ergebnisse für alle ${data.results.length} Tabellen`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="ok"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />OK</span></SelectItem>
                    <SelectItem value="warning"><span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />Warnungen</span></SelectItem>
                    <SelectItem value="error"><span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-500" />Fehler</span></SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[220px] h-9 text-sm"><SelectValue placeholder="Kategorie" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {data.summary.categories?.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.name} ({cat.count})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {(() => {
                  const filtered = data.results.filter((form) => {
                    const statusMatch = statusFilter === "all" || (statusFilter === "error" && (form.status === "error" || form.status === "missing_table")) || form.status === statusFilter
                    const categoryMatch = categoryFilter === "all" || (form.category || "Sonstige") === categoryFilter
                    return statusMatch && categoryMatch
                  })
                  if (filtered.length === 0) {
                    return <div className="py-8 text-center text-muted-foreground text-sm">Keine Tabellen für die ausgewählten Filter gefunden.</div>
                  }
                  const categories = new Map<string, FormResult[]>()
                  filtered.forEach((form) => {
                    const cat = form.category || "Sonstige"
                    if (!categories.has(cat)) categories.set(cat, [])
                    categories.get(cat)!.push(form)
                  })
                  return Array.from(categories.entries()).map(([category, forms]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 pt-2">
                        <h4 className="text-sm font-semibold text-muted-foreground">{category}</h4>
                        <Badge variant="secondary" className="text-xs">{forms.length}</Badge>
                      </div>
                      {forms.map((form) => {
                        const isExpanded = expandedForms.has(form.id)
                        const hasFixes = form.issues.some((i) => i.fix)
                        return (
                          <Card key={form.id} className="border">
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleForm(form.id)}>
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                {getStatusIcon(form.status)}
                                <div>
                                  <p className="font-medium text-sm">{form.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-mono">{form.table}</span> &middot; {form.columnCount || form.fields.length} Spalten
                                    {form.hasPracticeId && " \u00B7 multi-tenant"}
                                    {form.issues.length > 0 && ` \u00B7 ${form.issues.length} Problem${form.issues.length > 1 ? "e" : ""}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasFixes && (
                                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); const prompt = generateFixPrompt(form); if (prompt) onShowPrompt(prompt, `${form.name} beheben`) }}>
                                    <Sparkles className="h-3 w-3 mr-1" />v0-Fix
                                  </Button>
                                )}
                                {getStatusBadge(form.status)}
                              </div>
                            </div>
                            {isExpanded && (
                              <CardContent className="pt-0 pb-4 space-y-4">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <FileCode className="h-3 w-3" />{form.component}
                                </div>
                                {form.issues.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">Probleme:</p>
                                    {form.issues.map((issue, i) => (
                                      <div key={i} className={`p-3 rounded-lg text-sm ${issue.severity === "error" ? "bg-red-50 text-red-800 border border-red-200" : "bg-yellow-50 text-yellow-800 border border-yellow-200"}`}>
                                        <p className="font-medium">{issue.label} ({issue.field})</p>
                                        <p className="text-xs mt-0.5">{issue.message}</p>
                                        {issue.fix && (
                                          <div className="mt-2 space-y-1">
                                            <pre className="p-2 bg-background/50 rounded text-xs font-mono overflow-x-auto">{issue.fix}</pre>
                                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onCopy(`Bitte führe folgendes SQL aus, um das Problem "${issue.message}" in Tabelle "${form.table}" zu beheben:\n\n\`\`\`sql\n${issue.fix}\n\nNOTIFY pgrst, 'reload schema';\n\`\`\`\n\nBitte führe das SQL-Statement direkt mit supabase_execute_sql aus.`) }}>
                                              <Copy className="h-3 w-3 mr-1" />Fix in v0 einfügen
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Feld-Zuordnung:</p>
                                  <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-xs">
                                      <thead className="bg-muted/50">
                                        <tr>
                                          <th className="text-left p-2 font-medium">Feld</th>
                                          <th className="text-left p-2 font-medium">Form-Typ</th>
                                          <th className="text-left p-2 font-medium">DB-Typ</th>
                                          <th className="text-center p-2 font-medium">Pflicht</th>
                                          <th className="text-center p-2 font-medium">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {form.fields.map((field) => (
                                          <tr key={field.name} className="border-t">
                                            <td className="p-2"><span className="font-mono">{field.name}</span><span className="text-muted-foreground ml-1">({field.label})</span></td>
                                            <td className="p-2 font-mono">{field.type}</td>
                                            <td className="p-2 font-mono">{field.dbType || "-"}</td>
                                            <td className="p-2 text-center">{field.required ? "Ja" : "Nein"}</td>
                                            <td className="p-2 text-center">{field.existsInDb ? <CheckCircle2 className="h-4 w-4 text-green-500 inline" /> : <XCircle className="h-4 w-4 text-red-500 inline" />}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        )
                      })}
                    </div>
                  ))
                })()}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
