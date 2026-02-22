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
  Code2,
  Shield,
  Loader2,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Search,
  CheckCircle2,
} from "lucide-react"
import type { ReviewData, Category } from "./types"
import { CATEGORY_META, SEVERITY_META, generateAllRecommendationsPrompt, generateCategoryPrompt } from "./types"

interface ReviewTabProps {
  data: ReviewData | null
  isLoading: boolean
  progress: number
  progressLabel: string
  onRunReview: () => void
  onShowPrompt: (prompt: string, title: string) => void
  onCopy: (text: string) => void
}

export function ReviewTab({
  data,
  isLoading,
  progress,
  progressLabel,
  onRunReview,
  onShowPrompt,
  onCopy,
}: ReviewTabProps) {
  const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [fileFilter, setFileFilter] = useState<string>("all")

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredFindings = data?.findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false
    if (fileFilter !== "all" && f.file !== fileFilter) return false
    return true
  }) || []

  const uniqueFiles = data ? [...new Set(data.findings.map((f) => f.file))].sort() : []

  const codeScore = data
    ? Math.max(0, Math.round(100 - (data.summary.critical * 10 + data.summary.warnings * 3 + data.summary.info * 0.5)))
    : null

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="col-span-2 md:col-span-1 border-2 border-foreground/10">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Code Score</p>
                <div className="flex items-center gap-2">
                  <span className={`text-3xl font-bold ${
                    codeScore !== null && codeScore >= 80 ? "text-green-600" :
                    codeScore !== null && codeScore >= 60 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {codeScore}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
                <Progress value={codeScore || 0} className="mt-2 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Dateien gescannt</p>
                <p className="text-2xl font-bold">{data.summary.filesScanned}</p>
              </CardContent>
            </Card>
            <Card className="border-red-200">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Kritisch</p>
                <p className="text-2xl font-bold text-red-600">{data.summary.critical}</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-200">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Warnungen</p>
                <p className="text-2xl font-bold text-yellow-600">{data.summary.warnings}</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200">
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Info</p>
                <p className="text-2xl font-bold text-blue-600">{data.summary.info}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground">Dauer</p>
                <p className="text-2xl font-bold">{(data.durationMs / 1000).toFixed(1)}s</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Findings nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(data.summary.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const meta = CATEGORY_META[cat as Category]
                    if (!meta) return null
                    const percentage = data.summary.totalFindings > 0
                      ? Math.round((count / data.summary.totalFindings) * 100)
                      : 0
                    return (
                      <div
                        key={cat}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50 ${categoryFilter === cat ? "bg-muted border-foreground/20" : ""}`}
                      >
                        <button
                          className="flex items-center gap-2 flex-1 min-w-0"
                          onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
                        >
                          <span className={`shrink-0 ${meta.color}`}>{meta.icon}</span>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium truncate">{meta.label}</span>
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">{count} ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-1.5" />
                          </div>
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 shrink-0"
                          title={`${meta.label}-Empfehlungen kopieren`}
                          onClick={(e) => {
                            e.stopPropagation()
                            const prompt = generateCategoryPrompt(data, cat as Category)
                            if (prompt) onShowPrompt(prompt, `${meta.label} Fixes`)
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="default"
              onClick={() => {
                const prompt = generateAllRecommendationsPrompt(data)
                if (prompt) onShowPrompt(prompt, "Alle Empfehlungen")
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              Alle Empfehlungen als v0-Prompt kopieren
            </Button>
            {data.summary.critical > 0 && (
              <Button
                variant="destructive"
                onClick={() => {
                  const criticals = data.findings.filter((f) => f.severity === "critical")
                  let prompt = `## KRITISCHE Code-Probleme sofort beheben!\n\n`
                  criticals.forEach((f) => {
                    prompt += `**${f.title}** in \`${f.file}\` (Zeile ${f.line})\n`
                    prompt += `- ${f.message}\n`
                    if (f.code) prompt += `- Code: \`${f.code}\`\n`
                    if (f.fix) prompt += `- Fix: ${f.fix}\n\n`
                  })
                  prompt += `Bitte behebe SOFORT alle kritischen Sicherheits- und Stabilitätsprobleme.`
                  onShowPrompt(prompt, "Kritische Probleme")
                }}
              >
                <Shield className="mr-2 h-4 w-4" />
                Kritische Fixes kopieren
              </Button>
            )}
            <Button variant="outline" onClick={onRunReview} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Erneut scannen
            </Button>
          </div>
        </>
      )}

      {/* Run button when no data */}
      {!data && !isLoading && (
        <Card>
          <CardHeader className="text-center">
            <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Professioneller Code Review</CardTitle>
            <CardDescription>
              Scannt den gesamten Code wie ein erfahrener Entwickler und prüft auf Sicherheit,
              Performance, TypeScript-Qualität, Next.js Best Practices, Barrierefreiheit und mehr.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" onClick={onRunReview}>
              <Search className="mr-2 h-5 w-5" />
              Code Review starten
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm font-medium">{progressLabel}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {data && (
        <div className="flex flex-wrap gap-3">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Schweregrad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Schweregrade</SelectItem>
              <SelectItem value="critical">Kritisch ({data.summary.critical})</SelectItem>
              <SelectItem value="warning">Warnungen ({data.summary.warnings})</SelectItem>
              <SelectItem value="info">Info ({data.summary.info})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {Object.entries(data.summary.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const meta = CATEGORY_META[cat as Category]
                  return (
                    <SelectItem key={cat} value={cat}>
                      {meta?.label || cat} ({count})
                    </SelectItem>
                  )
                })}
            </SelectContent>
          </Select>

          <Select value={fileFilter} onValueChange={setFileFilter}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Datei" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Dateien ({uniqueFiles.length})</SelectItem>
              {data.summary.topFiles.map(({ file, count }) => (
                <SelectItem key={file} value={file}>
                  {file.length > 40 ? `...${file.slice(-40)}` : file} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="self-center text-sm text-muted-foreground">
            {filteredFindings.length} von {data.summary.totalFindings} Findings
          </span>
        </div>
      )}

      {/* Findings List */}
      {data && (
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-2">
            {filteredFindings.map((finding, idx) => {
              const id = `${finding.file}:${finding.line}:${idx}`
              const isExpanded = expandedFindings.has(id)
              const severityMeta = SEVERITY_META[finding.severity]
              const categoryMeta = CATEGORY_META[finding.category]

              return (
                <Card key={id} className={`border ${finding.severity === "critical" ? "border-red-300 bg-red-50/30 dark:bg-red-950/10" : ""}`}>
                  <div
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleFinding(id)}
                  >
                    <span className={`mt-0.5 ${severityMeta.color}`}>
                      {severityMeta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{finding.title}</span>
                        <Badge className={severityMeta.bgColor}>{severityMeta.label}</Badge>
                        <Badge variant="outline" className="gap-1 text-xs">
                          <span className={categoryMeta.color}>{categoryMeta.icon}</span>
                          {categoryMeta.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                        {finding.file}:{finding.line}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t">
                      <p className="text-sm mt-2">{finding.message}</p>
                      {finding.code && (
                        <div className="bg-muted rounded-md p-2">
                          <code className="text-xs font-mono break-all">{finding.code}</code>
                        </div>
                      )}
                      {finding.fix && (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-2">
                          <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-1">Empfohlener Fix:</p>
                          <p className="text-xs text-green-700 dark:text-green-400">{finding.fix}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            const prompt = `Bitte behebe folgendes Code-Problem:\n\n**${finding.title}** in \`${finding.file}\` (Zeile ${finding.line})\n- ${finding.message}\n${finding.code ? `- Code: \`${finding.code}\`\n` : ""}${finding.fix ? `- Empfohlener Fix: ${finding.fix}\n` : ""}`
                            onShowPrompt(prompt, finding.title)
                          }}
                        >
                          <Sparkles className="mr-1 h-3 w-3" />
                          v0-Fix
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            const prompt = generateCategoryPrompt(data, finding.category)
                            if (prompt) onShowPrompt(prompt, `${categoryMeta.label} Fixes`)
                          }}
                        >
                          <Copy className="mr-1 h-3 w-3" />
                          Alle {categoryMeta.label}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}

            {filteredFindings.length === 0 && data.summary.totalFindings > 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Keine Findings für die aktuelle Filterauswahl.
              </div>
            )}
            {data.summary.totalFindings === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="text-lg font-medium">Keine Probleme gefunden</p>
                  <p className="text-sm text-muted-foreground">Der Code sieht sauber aus!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Top Files (problem hotspots) */}
      {data && data.summary.topFiles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dateien mit den meisten Findings</CardTitle>
            <CardDescription>Diese Dateien sollten priorisiert überarbeitet werden</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.summary.topFiles.slice(0, 10).map(({ file, count }) => (
                <div
                  key={file}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => setFileFilter(fileFilter === file ? "all" : file)}
                >
                  <span className="text-sm font-mono truncate flex-1 mr-2">{file}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
