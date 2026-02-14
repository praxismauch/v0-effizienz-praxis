"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, FileCode, CheckCircle2, XCircle } from "lucide-react"
import type { CustomRule, Category, Severity } from "./types"
import { CATEGORY_META, SEVERITY_META } from "./types"

// ─── Custom Rule Form ───
function CustomRuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: CustomRule | null
  onSave: (rule: CustomRule) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(rule?.title || "")
  const [pattern, setPattern] = useState(rule?.pattern || "")
  const [category, setCategory] = useState<Category>(rule?.category || "code-quality")
  const [severity, setSeverity] = useState<Severity>(rule?.severity || "warning")
  const [message, setMessage] = useState(rule?.message || "")
  const [fix, setFix] = useState(rule?.fix || "")
  const [fileGlob, setFileGlob] = useState(rule?.fileGlob || "")
  const [patternError, setPatternError] = useState("")

  const validatePattern = (p: string) => {
    try {
      if (p) new RegExp(p)
      setPatternError("")
      return true
    } catch (e: any) {
      setPatternError(e.message || "Ungueltiges RegExp-Pattern")
      return false
    }
  }

  const handleSave = () => {
    if (!title.trim() || !pattern.trim() || !message.trim()) return
    if (!validatePattern(pattern)) return

    onSave({
      id: rule?.id || crypto.randomUUID(),
      title: title.trim(),
      pattern: pattern.trim(),
      category,
      severity,
      message: message.trim(),
      fix: fix.trim(),
      fileGlob: fileGlob.trim(),
      enabled: rule?.enabled ?? true,
      createdAt: rule?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="rule-title">Titel *</Label>
        <Input
          id="rule-title"
          placeholder='z.B. "TODO-Kommentare finden"'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-pattern">RegExp Pattern *</Label>
        <Input
          id="rule-pattern"
          placeholder="z.B. \/\/\\s*TODO|FIXME|HACK"
          value={pattern}
          onChange={(e) => { setPattern(e.target.value); validatePattern(e.target.value) }}
          className={`font-mono text-sm ${patternError ? "border-destructive" : ""}`}
        />
        {patternError && <p className="text-xs text-destructive">{patternError}</p>}
        <p className="text-xs text-muted-foreground">
          JavaScript RegExp-Syntax. Das Pattern wird auf jede Zeile angewendet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Kategorie</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    {meta.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Schweregrad</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SEVERITY_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <span className={meta.color}>{meta.icon}</span>
                    {meta.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-message">Beschreibung / Fehlermeldung *</Label>
        <Textarea
          id="rule-message"
          placeholder="Was ist das Problem und warum sollte es behoben werden?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-fix">Empfohlener Fix</Label>
        <Textarea
          id="rule-fix"
          placeholder="Wie sollte das Problem behoben werden? (optional)"
          value={fix}
          onChange={(e) => setFix(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="rule-glob">Datei-Filter (optional)</Label>
        <Input
          id="rule-glob"
          placeholder='z.B. "route.ts" oder "components/" (leer = alle Dateien)'
          value={fileGlob}
          onChange={(e) => setFileGlob(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Nur Dateien pruefen, deren Pfad diesen Text enthaelt.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Abbrechen</Button>
        <Button
          onClick={handleSave}
          disabled={!title.trim() || !pattern.trim() || !message.trim() || !!patternError}
        >
          {rule ? "Aktualisieren" : "Hinzufuegen"}
        </Button>
      </div>
    </div>
  )
}

// ─── Custom Rules Tab ───
interface CustomRulesTabProps {
  customRules: CustomRule[]
  onAddOrUpdate: (rule: CustomRule) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

export function CustomRulesTab({ customRules, onAddOrUpdate, onDelete, onToggle }: CustomRulesTabProps) {
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null)
  const [showRuleForm, setShowRuleForm] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Eigene Review-Regeln
              </CardTitle>
              <CardDescription>
                Manuelle Pruefregeln, die bei jedem Code Review mit angewendet werden
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingRule(null)
                setShowRuleForm(true)
              }}
            >
              Neue Regel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customRules.length === 0 && !showRuleForm ? (
            <div className="py-12 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Keine eigenen Regeln definiert</p>
              <p className="text-xs mt-1">Klicke auf &quot;Neue Regel&quot; um eine eigene Pruefregel hinzuzufuegen.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`border rounded-lg p-4 transition-colors ${rule.enabled ? "bg-background" : "bg-muted/50 opacity-60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-sm">{rule.title}</span>
                        <Badge variant="secondary" className={`text-xs ${SEVERITY_META[rule.severity]?.bgColor || ""}`}>
                          {SEVERITY_META[rule.severity]?.label || rule.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {CATEGORY_META[rule.category]?.label || rule.category}
                        </Badge>
                        {!rule.enabled && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Deaktiviert</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{rule.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{rule.pattern}</code>
                        {rule.fileGlob && (
                          <span>Dateien: <code className="bg-muted px-1 py-0.5 rounded">{rule.fileGlob}</code></span>
                        )}
                      </div>
                      {rule.fix && (
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">Fix: {rule.fix}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title={rule.enabled ? "Deaktivieren" : "Aktivieren"}
                        onClick={() => onToggle(rule.id)}
                      >
                        {rule.enabled ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        title="Bearbeiten"
                        onClick={() => { setEditingRule(rule); setShowRuleForm(true) }}
                      >
                        <FileCode className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Loeschen"
                        onClick={() => onDelete(rule.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Form Dialog */}
      <Dialog open={showRuleForm} onOpenChange={setShowRuleForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Regel bearbeiten" : "Neue Pruefregel"}</DialogTitle>
            <DialogDescription>
              Definiere ein RegExp-Pattern, das bei jedem Code Review geprueft wird.
            </DialogDescription>
          </DialogHeader>
          <CustomRuleForm
            rule={editingRule}
            onSave={(rule) => {
              onAddOrUpdate(rule)
              setEditingRule(null)
              setShowRuleForm(false)
            }}
            onCancel={() => { setShowRuleForm(false); setEditingRule(null) }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
