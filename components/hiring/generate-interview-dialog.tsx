"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Printer, FileText } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"

interface InterviewTemplate {
  id: string
  name: string
  description: string | null
  content: string
  category: string | null
  practice_id: string
  created_at: string
  updated_at: string
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  current_position?: string
  salary_expectation?: number
  weekly_hours?: number
  education_level?: string
}

interface GenerateInterviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: Candidate
}

export function GenerateInterviewDialog({ open, onOpenChange, candidate }: GenerateInterviewDialogProps) {
  const [templates, setTemplates] = useState<InterviewTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { currentPractice } = usePractice()

  useEffect(() => {
    if (open && currentPractice?.id) {
      fetchTemplates()
    }
  }, [open, currentPractice?.id])

  const fetchTemplates = async () => {
    if (!currentPractice?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/interview-templates`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = (template: InterviewTemplate) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = typeof template.content === "string" ? template.content : JSON.stringify(template.content, null, 2)

    const candidateName = `${candidate.first_name} ${candidate.last_name}`
    const position = candidate.current_position || ""
    const salary = candidate.salary_expectation
      ? new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(candidate.salary_expectation)
      : ""
    const hours = candidate.weekly_hours ? `${candidate.weekly_hours} Std./Woche` : ""

    const printContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name} - ${candidateName}</title>
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
      .no-print {
        display: none !important;
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
    
    .candidate-info h2 {
      color: #1e40af;
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 12px;
      font-size: 14px;
    }
    
    .info-label {
      font-weight: 600;
      color: #4b5563;
    }
    
    .info-value {
      color: #1f2937;
    }
    
    .content-section {
      margin-bottom: 30px;
    }
    
    .content-section h2 {
      color: #1e40af;
      font-size: 20px;
      margin-bottom: 15px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    
    .content-text {
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
      padding: 15px;
      background: #ffffff;
      border-left: 3px solid #2563eb;
      margin-bottom: 20px;
    }
    
    .notes-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    
    .notes-section h3 {
      color: #1e40af;
      font-size: 18px;
      margin-bottom: 15px;
    }
    
    .line {
      height: 1px;
      background: #d1d5db;
      margin: 20px 0;
    }
    
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${template.name}</h1>
    ${template.category ? `<span class="category-badge">${template.category}</span>` : ""}
    <div class="meta">
      <div class="meta-item">Datum: ${new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
      <div class="meta-item">Uhrzeit: ${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</div>
    </div>
  </div>
  
  <div class="candidate-info">
    <h2>Kandidateninformationen</h2>
    <div class="info-grid">
      <div class="info-label">Name:</div>
      <div class="info-value">${candidateName}</div>
      
      ${
        position
          ? `
      <div class="info-label">Position:</div>
      <div class="info-value">${position}</div>
      `
          : ""
      }
      
      ${
        salary
          ? `
      <div class="info-label">Gehaltsvorstellung:</div>
      <div class="info-value">${salary}</div>
      `
          : ""
      }
      
      ${
        hours
          ? `
      <div class="info-label">Wochenstunden:</div>
      <div class="info-value">${hours}</div>
      `
          : ""
      }
      
      ${
        candidate.education_level
          ? `
      <div class="info-label">Ausbildung:</div>
      <div class="info-value">${candidate.education_level}</div>
      `
          : ""
      }
      
      <div class="info-label">Interviewer:</div>
      <div class="info-value">_____________________________________</div>
      
      <div class="info-label">Anwesende:</div>
      <div class="info-value">_____________________________________</div>
    </div>
  </div>
  
  <div class="content-section">
    <h2>Gesprächsleitfaden</h2>
    <div class="content-text">${content}</div>
  </div>
  
  <div class="notes-section">
    <h3>Notizen und Bewertung</h3>
    <div style="margin-top: 20px;">
      ${Array.from({ length: 15 })
        .map(() => '<div class="line"></div>')
        .join("")}
    </div>
  </div>
  
  <div class="footer">
    <p>Bewerbungsgespräch - ${template.name} - ${candidateName}</p>
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
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bewerbungsgespräch generieren</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Vorlage für das Bewerbungsgespräch mit {candidate.first_name} {candidate.last_name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Vorlagen werden geladen...</div>
        ) : templates.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Keine Vorlagen verfügbar.</p>
            <p className="text-sm mt-2">Erstellen Sie zuerst eine Vorlage im Tab "Bewerbungsgespräch".</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePrint(template)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        {template.category && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                            {template.category}
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-2">{template.description || "Keine Beschreibung"}</CardDescription>
                    </div>
                    <Button size="sm" className="ml-4">
                      <Printer className="h-4 w-4 mr-2" />
                      Drucken
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
