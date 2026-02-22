"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, FileText, Copy, Sparkles, Loader2, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { FormattedInterviewContent } from "./formatted-interview-content"

interface InterviewTemplate {
  id: string
  practice_id: string
  name: string
  description: string
  content: any // Tiptap JSON
  category: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

interface InterviewTemplatesManagerProps {
  candidateData?: {
    name?: string
    position_type?: string
    salary_expectation?: number
    weekly_hours?: number
    education?: string
    experience_years?: number
    skills?: string[]
    current_position?: string
  }
}

export function InterviewTemplatesManager({ candidateData }: InterviewTemplatesManagerProps = {}) {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    category: "",
  })
  const { toast } = useToast()
  const { currentPractice } = usePractice()

  const [showKiDialog, setShowKiDialog] = useState(false)
  const [kiLoading, setKiLoading] = useState(false)
  const [kiSuggestions, setKiSuggestions] = useState("")
  const [kiCategory, setKiCategory] = useState("")

  useEffect(() => {
    if (currentPractice?.id) {
      fetchTemplates()
    }
  }, [currentPractice?.id])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/practices/${currentPractice?.id}/interview-templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching templates:", error)
      toast({
        title: "Fehler",
        description: "Templates konnten nicht geladen werden",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {

    try {
      if (!formData.name || !formData.content) {
        console.error("[v0] Validation failed - name or content missing")
        toast({
          title: "Fehler",
          description: "Name und Inhalt sind Pflichtfelder",
          variant: "destructive",
        })
        return
      }

      if (!currentPractice?.id) {
        console.error("[v0] No practice ID available")
        toast({
          title: "Fehler",
          description: "Praxis-ID fehlt",
          variant: "destructive",
        })
        return
      }

      const url = editingTemplate
        ? `/api/practices/${currentPractice?.id}/interview-templates/${editingTemplate.id}`
        : `/api/practices/${currentPractice?.id}/interview-templates`

      const response = await fetch(url, {
        method: editingTemplate ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: `Template ${editingTemplate ? "aktualisiert" : "erstellt"}`,
        })
        setShowDialog(false)
        setEditingTemplate(null)
        setFormData({ name: "", description: "", content: "", category: "" })
        fetchTemplates()
      } else {
        const errorText = await response.text()
        console.error("[v0] Save failed with status:", response.status, errorText)
        toast({
          title: "Fehler",
          description: `Template konnte nicht gespeichert werden: ${errorText}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving template:", error)
      toast({
        title: "Fehler",
        description: "Template konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie diese Vorlage wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practices/${currentPractice?.id}/interview-templates/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Template gelöscht",
        })
        fetchTemplates()
      }
    } catch (error) {
      console.error("[v0] Error deleting template:", error)
      toast({
        title: "Fehler",
        description: "Template konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (template: InterviewTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      content: typeof template.content === "string" ? template.content : JSON.stringify(template.content),
      category: template.category,
    })
    setShowDialog(true)
  }

  const handleDuplicate = async (template: InterviewTemplate) => {
    setFormData({
      name: `${template.name} (Kopie)`,
      description: template.description,
      content: typeof template.content === "string" ? template.content : JSON.stringify(template.content),
      category: template.category,
    })
    setShowDialog(true)
  }

  const handleGenerateWithKI = async () => {
    try {
      setKiLoading(true)
      const response = await fetch("/api/interview-templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: kiCategory,
          position: formData.name || "Allgemeine Position",
          candidateData: candidateData || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setKiSuggestions(data.suggestions)
        setShowKiDialog(true)
      } else {
        toast({
          title: "Fehler",
          description: "KI-Vorschläge konnten nicht generiert werden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error generating KI suggestions:", error)
      toast({
        title: "Fehler",
        description: "KI-Vorschläge konnten nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setKiLoading(false)
    }
  }

  const handleApplyKiSuggestions = () => {
    setFormData({ ...formData, content: kiSuggestions })
    setShowKiDialog(false)
  }

  const handlePrint = (template: InterviewTemplate) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = typeof template.content === "string" ? template.content : JSON.stringify(template.content, null, 2)

    const formatContentForPrint = (text: string): string => {
      const lines = text.split("\n")
      let html = ""
      let inList = false
      let listType: "ul" | "ol" | null = null

      const closeList = () => {
        if (inList) {
          html += listType === "ol" ? "</ol>" : "</ul>"
          inList = false
          listType = null
        }
      }

      const formatInline = (str: string) => {
        return str.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      }

      lines.forEach((line) => {
        const trimmed = line.trim()

        if (!trimmed) {
          closeList()
          return
        }

        // Main section headers (e.g., **1. EINLEITUNG & KENNENLERNEN**)
        if (/^\*\*\d+\.\s+[A-ZÄÖÜ\s&]+\*\*$/.test(trimmed)) {
          closeList()
          const text = trimmed.replace(/^\*\*|\*\*$/g, "")
          html += `<h3 style="font-size: 18px; font-weight: 700; color: #1e40af; margin-top: 24px; margin-bottom: 12px; border-left: 4px solid #2563eb; padding-left: 12px;">${text}</h3>`
          return
        }

        // Subsection headers (e.g., - **Begrüßung und Vorstellung**)
        if (/^-\s+\*\*(.+?)\*\*$/.test(trimmed)) {
          closeList()
          const text = trimmed.replace(/^-\s+\*\*|\*\*$/g, "")
          html += `<h4 style="font-size: 15px; font-weight: 600; color: #374151; margin-top: 16px; margin-bottom: 8px;">${text}</h4>`
          return
        }

        // Title headers (e.g., **Interviewleitfaden für die Position: ...**)
        if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.match(/^\*\*\d+\./)) {
          closeList()
          const text = trimmed.replace(/^\*\*|\*\*$/g, "")
          html += `<h2 style="font-size: 18px; font-weight: 700; color: #1e40af; margin-bottom: 16px;">${text}</h2>`
          return
        }

        // Numbered list item
        if (/^\d+\.\s+/.test(trimmed)) {
          if (listType !== "ol") {
            closeList()
            html += '<ol style="margin-left: 25px; margin-bottom: 15px;">'
            inList = true
            listType = "ol"
          }
          const text = trimmed.replace(/^\d+\.\s+/, "")
          html += `<li style="margin-bottom: 8px;">${formatInline(text)}</li>`
          return
        }

        // Bullet list item
        if (/^-\s+/.test(trimmed)) {
          if (listType !== "ul") {
            closeList()
            html += '<ul style="margin-left: 25px; margin-bottom: 15px;">'
            inList = true
            listType = "ul"
          }
          const text = trimmed.replace(/^-\s+/, "")
          html += `<li style="margin-bottom: 8px;">${formatInline(text)}</li>`
          return
        }

        // Separator
        if (trimmed === "---") {
          closeList()
          html += '<hr style="margin: 24px 0; border: none; border-top: 1px solid #d1d5db;" />'
          return
        }

        // Regular paragraph
        closeList()
        html += `<p style="margin-bottom: 12px;">${formatInline(trimmed)}</p>`
      })

      closeList()
      return html
    }

    const printContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} - Bewerbungsgespräch</title>
  <style>
    @media print {
      @page {
        margin: 2cm;
        size: A4 portrait;
      }
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header .meta {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 15px;
      font-size: 14px;
      color: #666;
    }
    
    .header .meta-item {
      background: #f3f4f6;
      padding: 5px 12px;
      border-radius: 4px;
    }
    
    .category-badge {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    
    .candidate-info {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .candidate-info h3 {
      color: #374151;
      font-size: 16px;
      margin-bottom: 15px;
      border-bottom: 2px solid #d1d5db;
      padding-bottom: 8px;
    }
    
    .info-field {
      display: flex;
      margin-bottom: 12px;
      align-items: baseline;
    }
    
    .info-field label {
      font-weight: 600;
      color: #4b5563;
      min-width: 140px;
      font-size: 14px;
    }
    
    .info-field .fill-line {
      flex: 1;
      border-bottom: 1px solid #9ca3af;
      min-height: 24px;
    }
    
    .info-field .filled-value {
      flex: 1;
      font-weight: 500;
      color: #1f2937;
    }
    
    .content {
      margin-top: 30px;
    }
    
    .content h2 {
      color: #1e40af;
      font-size: 20px;
      margin-top: 25px;
      margin-bottom: 15px;
      border-left: 4px solid #2563eb;
      padding-left: 12px;
    }
    
    .content p {
      margin-bottom: 12px;
      white-space: pre-wrap;
    }
    
    .content ul, .content ol {
      margin-left: 25px;
      margin-bottom: 15px;
    }
    
    .content li {
      margin-bottom: 8px;
    }
    
    .notes-section {
      margin-top: 40px;
      padding: 20px;
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      min-height: 200px;
    }
    
    .notes-section h3 {
      color: #374151;
      font-size: 16px;
      margin-bottom: 15px;
    }
    
    .notes-lines {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    
    .notes-lines .line {
      border-bottom: 1px solid #d1d5db;
      min-height: 20px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    }
    
    @media print {
      .no-print {
        display: none !important;
      }
      
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${template.name}</h1>
    ${template.category ? `<span class="category-badge">${template.category}</span>` : ""}
    <div class="meta">
      <div class="meta-item">Datum: ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
      <div class="meta-item">Uhrzeit: __:__</div>
    </div>
  </div>
  
  <div class="candidate-info">
    <h3>Kandidateninformationen</h3>
    <div class="info-field">
      <label>Name:</label>
      ${candidateData?.name ? `<div class="filled-value">${candidateData.name}</div>` : '<div class="fill-line"></div>'}
    </div>
    <div class="info-field">
      <label>Position:</label>
      ${candidateData?.position_type || candidateData?.current_position ? `<div class="filled-value">${candidateData.position_type || candidateData.current_position}</div>` : '<div class="fill-line"></div>'}
    </div>
    <div class="info-field">
      <label>Interviewer:</label>
      <div class="fill-line"></div>
    </div>
    <div class="info-field">
      <label>Anwesende:</label>
      <div class="fill-line"></div>
    </div>
    ${
      candidateData?.salary_expectation
        ? `
    <div class="info-field">
      <label>Gehaltsvorstellung:</label>
      <div class="filled-value">${candidateData.salary_expectation.toLocaleString("de-DE")} €</div>
    </div>`
        : ""
    }
    ${
      candidateData?.weekly_hours
        ? `
    <div class="info-field">
      <label>Wochenstunden:</label>
      <div class="filled-value">${candidateData.weekly_hours}</div>
    </div>`
        : ""
    }
  </div>
  
  <div class="content">
    <h2>Gesprächsleitfaden</h2>
    ${formatContentForPrint(content)}
  </div>
  
  <div class="notes-section">
    <h3>Notizen & Bewertung</h3>
    <div class="notes-lines">
      ${Array(12)
        .fill(0)
        .map(() => '<div class="line"></div>')
        .join("")}
    </div>
  </div>
  
  <div class="footer">
    <p>Bewerbungsgespräch - ${template.name}</p>
    <p>Erstellt am: ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</p>
  </div>
  
  <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600;">
      Drucken
    </button>
    <button onclick="window.close()" style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 600; margin-left: 10px;">
      Schließen
    </button>
  </div>
</body>
</html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bewerbungsgesprächs-Vorlagen</h2>
          <p className="text-muted-foreground">
            Erstellen und verwalten Sie Vorlagen für strukturierte Bewerbungsgespräche
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTemplate(null)
            setFormData({ name: "", description: "", content: "", category: "" })
            setShowDialog(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Neue Vorlage
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Laden...</div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Noch keine Vorlagen erstellt</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Erste Vorlage erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="secondary" className="mt-2">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  {template.is_default && <Badge variant="outline">Standard</Badge>}
                </div>
                <CardDescription className="line-clamp-2">
                  {template.description || "Keine Beschreibung"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.content && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-md border max-h-48 overflow-y-auto">
                    <FormattedInterviewContent
                      content={
                        typeof template.content === "string" ? template.content : JSON.stringify(template.content)
                      }
                      maxLines={8}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handlePrint(template)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Drucken
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Vorlage bearbeiten" : "Neue Vorlage erstellen"}</DialogTitle>
            <DialogDescription>Erstellen Sie strukturierte Vorlagen für Ihre Bewerbungsgespräche</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Standard-Interview für Ärzte"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kategorie</label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({ ...formData, category: value })
                  setKiCategory(value) // Update KI category state
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arzt">Arzt</SelectItem>
                  <SelectItem value="MFA">MFA</SelectItem>
                  <SelectItem value="Verwaltung">Verwaltung</SelectItem>
                  <SelectItem value="Pflege">Pflege</SelectItem>
                  <SelectItem value="Sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kurze Beschreibung der Vorlage..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Inhalt *</label>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateWithKI}
                  disabled={kiLoading || !formData.category}
                  className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 font-semibold"
                >
                  {kiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  KI-Unterstützung
                </Button>
              </div>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Gesprächsleitfaden, Fragen, Bewertungskriterien..."
                rows={12}
                className="font-mono text-sm hidden"
              />
              {formData.content && (
                <div className="mt-3 p-4 bg-muted/50 rounded-lg border min-h-[300px]">
                  <p className="text-xs font-medium text-muted-foreground mb-3">Vorschau:</p>
                  <FormattedInterviewContent content={formData.content} className="max-h-[400px] overflow-y-auto" />
                </div>
              )}
              {!formData.content && (
                <div className="mt-3 p-4 bg-muted/50 rounded-lg border min-h-[300px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Nutzen Sie die KI-Unterstützung, um Interviewfragen zu generieren
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tipp: Nutzen Sie die KI-Unterstützung für professionelle Interviewfragen
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={!formData.name || !formData.content}>
              {editingTemplate ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKiDialog} onOpenChange={setShowKiDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              KI-Generierte Interviewfragen
            </DialogTitle>
            <DialogDescription>
              Hier sind professionelle Interviewfragen und Strukturvorschläge für Ihre Vorlage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 dark:from-purple-950/10 dark:via-background dark:to-indigo-950/10 border border-purple-200 dark:border-purple-800 rounded-lg p-6 shadow-sm">
              <FormattedInterviewContent content={kiSuggestions} />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Diese Vorschläge wurden mit KI generiert. Sie können sie anpassen oder direkt übernehmen.</span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKiDialog(false)}>
              Verwerfen
            </Button>
            <Button onClick={handleApplyKiSuggestions} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Übernehmen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
