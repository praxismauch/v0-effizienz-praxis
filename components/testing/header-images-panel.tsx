"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ImageIcon,
  Download,
  RefreshCw,
  Sparkles,
  Loader2,
} from "lucide-react"

const headerImageTemplates = [
  {
    id: "dashboard-overview",
    title: "Dashboard Übersicht",
    category: "analytics",
    description: "Zeigt das Konzept eines umfassenden Praxis-Dashboards",
    prompt:
      "Professional medical practice dashboard interface, clean modern design, blue and white color scheme, data visualization charts, German healthcare software, minimalist UI, high quality render, 16:9 aspect ratio",
    metrics: ["Umsatz: 125.450 €", "Patienten: 1.247", "Effizienz: 94,5%"],
  },
  {
    id: "efficiency-metrics",
    title: "Effizienz-Metriken",
    category: "analytics",
    description: "Visualisiert Praxis-Effizienz und Optimierungspotenziale",
    prompt:
      "Medical practice efficiency analytics dashboard, performance metrics visualization, green growth indicators, German healthcare optimization software, professional business intelligence UI, clean modern design, 16:9 aspect ratio",
    metrics: ["Zeitersparnis: 12,5 Std/Woche", "Optimierung: +23%", "ROI: 340%"],
  },
  {
    id: "team-collaboration",
    title: "Team-Zusammenarbeit",
    category: "team",
    description: "Illustriert die Teamfunktionen und Kollaboration",
    prompt:
      "Medical team collaboration software interface, healthcare staff management dashboard, modern German practice management, team scheduling and communication tools, professional UI design, blue accent colors, 16:9 aspect ratio",
    metrics: ["Team-Mitglieder: 12", "Aufgaben erledigt: 89%", "Kommunikation: +45%"],
  },
  {
    id: "patient-satisfaction",
    title: "Patientenzufriedenheit",
    category: "patients",
    description: "Zeigt Patientenfeedback und Zufriedenheitsmetriken",
    prompt:
      "Patient satisfaction analytics dashboard, healthcare feedback visualization, star ratings and reviews, German medical practice software, warm friendly colors, professional healthcare UI, 16:9 aspect ratio",
    metrics: ["Zufriedenheit: 4,8/5", "Weiterempfehlung: 96%", "Wartezeit: -35%"],
  },
  {
    id: "analytics-insights",
    title: "Analyse & Einblicke",
    category: "analytics",
    description: "Demonstriert KI-gestützte Analysen und Einblicke",
    prompt:
      "AI-powered healthcare analytics dashboard, intelligent insights visualization, machine learning predictions, German medical practice intelligence software, futuristic professional design, purple and blue accents, 16:9 aspect ratio",
    metrics: ["KI-Empfehlungen: 24", "Prognose-Genauigkeit: 92%", "Einsparpotenzial: 18.500 €"],
  },
  {
    id: "financial-overview",
    title: "Finanzübersicht",
    category: "finance",
    description: "Präsentiert Finanzanalysen und Abrechnungsübersicht",
    prompt:
      "Medical practice financial dashboard, healthcare billing analytics, revenue visualization charts, German medical accounting software, professional finance UI, green and blue color scheme, 16:9 aspect ratio",
    metrics: ["Umsatz: 892.340 €", "Offene Rechnungen: 12.450 €", "Wachstum: +18,5%"],
  },
]

export default function HeaderImagesPanel() {
  const { toast } = useToast()
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({})
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({})
  const [selectedImageCategory, setSelectedImageCategory] = useState<string>("all")

  const generateHeaderImage = async (template: (typeof headerImageTemplates)[0]) => {
    setGeneratingImages((prev) => ({ ...prev, [template.id]: true }))

    try {
      const response = await fetch("/api/generate-header-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: template.prompt,
          title: template.title,
          metrics: template.metrics,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler bei der Bildgenerierung")
      }

      const data = await response.json()
      setGeneratedImages((prev) => ({ ...prev, [template.id]: data.imageUrl }))

      toast({
        title: "Bild generiert",
        description: `Header-Bild "${template.title}" wurde erfolgreich erstellt.`,
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Bildgenerierung fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [template.id]: false }))
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${filename}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download gestartet",
        description: `${filename}.png wird heruntergeladen...`,
      })
    } catch (error) {
      toast({
        title: "Download fehlgeschlagen",
        description: "Bild konnte nicht heruntergeladen werden",
        variant: "destructive",
      })
    }
  }

  const filteredTemplates =
    selectedImageCategory === "all"
      ? headerImageTemplates
      : headerImageTemplates.filter((t) => t.category === selectedImageCategory)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Header-Bild Generator
            </CardTitle>
            <CardDescription>
              Generieren Sie hochwertige Header-Bilder für das Praxismanagement-System mit KI
            </CardDescription>
          </div>
          <Badge variant="secondary">fal.ai FLUX Pro</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button
            variant={selectedImageCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedImageCategory("all")}
          >
            Alle
          </Button>
          <Button
            variant={selectedImageCategory === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedImageCategory("analytics")}
          >
            Analytics
          </Button>
          <Button
            variant={selectedImageCategory === "team" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedImageCategory("team")}
          >
            Team
          </Button>
          <Button
            variant={selectedImageCategory === "patients" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedImageCategory("patients")}
          >
            Patienten
          </Button>
          <Button
            variant={selectedImageCategory === "finance" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedImageCategory("finance")}
          >
            Finanzen
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
                {generatedImages[template.id] ? (
                  <img
                    src={generatedImages[template.id] || "/placeholder.svg"}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-xs text-muted-foreground">Klicken Sie auf Generieren</p>
                    </div>
                  </div>
                )}
                {generatingImages[template.id] && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Generiere...</p>
                    </div>
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{template.description}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {template.metrics.map((metric, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                      {metric}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => generateHeaderImage(template)}
                    disabled={generatingImages[template.id]}
                  >
                    {generatingImages[template.id] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generiere...
                      </>
                    ) : generatedImages[template.id] ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Neu generieren
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generieren
                      </>
                    )}
                  </Button>
                  {generatedImages[template.id] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadImage(generatedImages[template.id], template.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
