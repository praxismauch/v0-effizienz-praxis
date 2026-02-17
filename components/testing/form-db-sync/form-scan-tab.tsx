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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ChevronDown,
  ChevronRight,
  Search,
  ArrowRight,
  FileCode,
  Table2,
} from "lucide-react"
import type { FormScanData } from "./types"

interface FormScanTabProps {
  scanData: FormScanData | null
  isLoading: boolean
  progress: number
  progressLabel: string
  onRunScan: () => void
  onCopy: (text: string) => void
  generateFormScanProblemsPrompt: () => string
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ok": return <CheckCircle2 className="h-5 w-5 text-green-500" />
    case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    case "error": return <XCircle className="h-5 w-5 text-red-500" />
    default: return null
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ok": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">OK</Badge>
    case "warning": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warnung</Badge>
    case "error": return <Badge variant="destructive">Fehler</Badge>
    default: return null
  }
}

const getMethodBadge = (method: string) => {
  switch (method) {
    case "POST": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-mono text-xs">POST</Badge>
    case "PATCH": return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-mono text-xs">PATCH</Badge>
    case "PUT": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-mono text-xs">PUT</Badge>
    default: return <Badge variant="outline" className="font-mono text-xs">{method}</Badge>
  }
}

export function FormScanTab({
  scanData,
  isLoading,
  progress,
  progressLabel,
  onRunScan,
  onCopy,
  generateFormScanProblemsPrompt,
}: FormScanTabProps) {
  const [expandedScans, setExpandedScans] = useState<Set<string>>(new Set())
  const [scanStatusFilter, setScanStatusFilter] = useState("all")
  const [scanMethodFilter, setScanMethodFilter] = useState("all")

  const toggleScan = (id: string) => {
    setExpandedScans((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const scanSuccessRate = scanData ? (scanData.summary.totalSubmissions > 0 ? (scanData.summary.ok / scanData.summary.totalSubmissions) * 100 : 0) : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {scanData && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.summary.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground mt-1">in {scanData.summary.uniqueComponents} Dateien</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API-Routen</CardTitle>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.summary.uniqueApiRoutes}</div>
              <p className="text-xs text-muted-foreground mt-1">von {scanData.summary.scannedApiRoutes} gescannt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DB-Tabellen</CardTitle>
              <Table2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scanData.summary.uniqueTables}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OK</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{scanData.summary.ok}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{scanData.summary.warnings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fehler</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{scanData.summary.errors}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Method breakdown */}
      {scanData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Methoden-Verteilung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-mono">POST</Badge>
                <span className="text-sm font-bold">{scanData.summary.methodCounts.POST}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 font-mono">PATCH</Badge>
                <span className="text-sm font-bold">{scanData.summary.methodCounts.PATCH}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 font-mono">PUT</Badge>
                <span className="text-sm font-bold">{scanData.summary.methodCounts.PUT}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Scan-Rate:</span>
                <span className="text-sm font-bold">{scanSuccessRate.toFixed(0)}%</span>
                <Progress value={scanSuccessRate} className="w-24 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Form-Scan
          </CardTitle>
          <CardDescription>
            Scannt alle Projekt-Dateien nach Formularen (fetch POST/PATCH/PUT), ordnet sie API-Routen und DB-Tabellen zu und prueft Feld-Kompatibilitaet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={onRunScan} disabled={isLoading} className="min-w-[200px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanne...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Form-Scan starten
                </>
              )}
            </Button>
            {scanData && (scanData.summary.errors > 0 || scanData.summary.warnings > 0) && (
              <Button variant="outline" onClick={() => { const prompt = generateFormScanProblemsPrompt(); if (prompt) onCopy(prompt) }}>
                <Copy className="mr-2 h-4 w-4" />
                Alle Probleme kopieren
              </Button>
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

          {/* Info box */}
          {!scanData && !isLoading && (
            <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p className="font-medium mb-1">Was wird gescannt?</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Alle .tsx Dateien in app/, components/, contexts/, hooks/</li>
                <li>Alle fetch() Aufrufe mit POST, PATCH oder PUT</li>
                <li>Zuordnung zu API-Routen unter app/api/</li>
                <li>Erkennung der Ziel-Tabelle (.from("tabelle"))</li>
                <li>Vergleich der Formular-Felder mit DB-Spalten</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Scan Results */}
      {scanData && scanData.results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Form-Scan Ergebnisse</CardTitle>
                <CardDescription>
                  {scanData.results.length} Form-Submissions gefunden
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={scanStatusFilter} onValueChange={setScanStatusFilter}>
                  <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="ok"><span className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" />OK</span></SelectItem>
                    <SelectItem value="warning"><span className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />Warnungen</span></SelectItem>
                    <SelectItem value="error"><span className="flex items-center gap-2"><XCircle className="h-3.5 w-3.5 text-red-500" />Fehler</span></SelectItem>
                  </SelectContent>
                </Select>
                <Select value={scanMethodFilter} onValueChange={setScanMethodFilter}>
                  <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue placeholder="Methode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Methoden</SelectItem>
                    <SelectItem value="POST">POST ({scanData.summary.methodCounts.POST})</SelectItem>
                    <SelectItem value="PATCH">PATCH ({scanData.summary.methodCounts.PATCH})</SelectItem>
                    <SelectItem value="PUT">PUT ({scanData.summary.methodCounts.PUT})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-2">
                {(() => {
                  const filtered = scanData.results.filter((r) => {
                    const statusMatch = scanStatusFilter === "all" || r.status === scanStatusFilter
                    const methodMatch = scanMethodFilter === "all" || r.method === scanMethodFilter
                    return statusMatch && methodMatch
                  })

                  if (filtered.length === 0) {
                    return <div className="py-8 text-center text-muted-foreground text-sm">Keine Ergebnisse fuer die ausgewaehlten Filter.</div>
                  }

                  // Group by component file
                  const byFile = new Map<string, typeof filtered>()
                  filtered.forEach((r) => {
                    if (!byFile.has(r.componentFile)) byFile.set(r.componentFile, [])
                    byFile.get(r.componentFile)!.push(r)
                  })

                  return Array.from(byFile.entries()).map(([file, results]) => (
                    <div key={file} className="space-y-1">
                      <div className="flex items-center gap-2 pt-3 pb-1">
                        <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-mono text-muted-foreground">{file}</span>
                        <Badge variant="secondary" className="text-xs">{results.length}</Badge>
                      </div>
                      {results.map((result) => {
                        const isExpanded = expandedScans.has(result.id)
                        return (
                          <Card key={result.id} className="border">
                            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleScan(result.id)}>
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                {getStatusIcon(result.status)}
                                <div className="flex items-center gap-2">
                                  {getMethodBadge(result.method)}
                                  <span className="font-mono text-xs text-muted-foreground">{result.apiUrlNormalized}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.targetTables.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    {result.targetTables.map((t) => (
                                      <Badge key={t} variant="outline" className="text-xs font-mono">{t}</Badge>
                                    ))}
                                  </div>
                                )}
                                {result.issues.length > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    {result.issues.length} Problem{result.issues.length > 1 ? "e" : ""}
                                  </Badge>
                                )}
                                {getStatusBadge(result.status)}
                              </div>
                            </div>
                            {isExpanded && (
                              <CardContent className="pt-0 pb-3 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Zeile:</span>{" "}
                                    <span className="font-mono">{result.lineNumber}</span>
                                  </div>
                                  {result.apiRouteFile && (
                                    <div>
                                      <span className="text-muted-foreground">API-Route:</span>{" "}
                                      <span className="font-mono">{result.apiRouteFile}</span>
                                    </div>
                                  )}
                                </div>

                                {result.formFields.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">Formular-Felder ({result.formFields.length}):</p>
                                    <div className="flex flex-wrap gap-1">
                                      {result.formFields.map((f) => {
                                        const inDb = result.targetTables.some((t) => {
                                          const cols = result.dbFields[t] || []
                                          const snakeField = f.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
                                          return cols.includes(f) || cols.includes(snakeField)
                                        })
                                        return (
                                          <Badge key={f} variant={inDb ? "outline" : "destructive"} className="text-xs font-mono">
                                            {f}
                                            {inDb ? <CheckCircle2 className="h-3 w-3 ml-1" /> : <XCircle className="h-3 w-3 ml-1" />}
                                          </Badge>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}

                                {result.targetTables.length > 0 && Object.keys(result.dbFields).length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium mb-1">DB-Spalten:</p>
                                    {result.targetTables.map((table) => (
                                      <div key={table} className="mb-2">
                                        <span className="text-xs font-mono text-muted-foreground">{table}:</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {(result.dbFields[table] || []).slice(0, 20).map((col) => (
                                            <Badge key={col} variant="outline" className="text-xs font-mono bg-muted/30">
                                              {col}
                                            </Badge>
                                          ))}
                                          {(result.dbFields[table] || []).length > 20 && (
                                            <Badge variant="secondary" className="text-xs">
                                              +{(result.dbFields[table] || []).length - 20} weitere
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {result.issues.length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium">Probleme:</p>
                                    {result.issues.map((issue, i) => (
                                      <div key={i} className={`p-2 rounded text-xs ${
                                        issue.severity === "error" ? "bg-red-50 text-red-800 border border-red-200"
                                        : issue.severity === "warning" ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                        : "bg-blue-50 text-blue-800 border border-blue-200"
                                      }`}>
                                        {issue.message}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Copy single issue to v0 */}
                                {result.issues.length > 0 && (
                                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => {
                                    e.stopPropagation()
                                    let prompt = `Bitte behebe folgendes Problem in **${result.componentFile}** (Zeile ${result.lineNumber}):\n\n`
                                    prompt += `- Methode: ${result.method}, URL: \`${result.apiUrlNormalized}\`\n`
                                    if (result.targetTables.length > 0) prompt += `- Ziel-Tabellen: ${result.targetTables.join(", ")}\n`
                                    if (result.formFields.length > 0) prompt += `- Formular-Felder: ${result.formFields.join(", ")}\n\n`
                                    prompt += `Probleme:\n`
                                    result.issues.forEach((i) => { prompt += `- ${i.severity.toUpperCase()}: ${i.message}\n` })
                                    prompt += `\nBitte analysiere das Problem und behebe es. Für DB-Änderungen nutze supabase_execute_sql.`
                                    onCopy(prompt)
                                  }}>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Fix in v0 einfügen
                                  </Button>
                                )}
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
