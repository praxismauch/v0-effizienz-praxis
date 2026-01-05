"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  Handshake,
  Gift,
  Heart,
  Truck,
  Wallet,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Sparkles,
  MoreVertical,
  FileText,
  Target,
  CheckCircle2,
  BarChart3,
  Briefcase,
  Printer,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

function SectionIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Handshake":
      return <Handshake className={className} />
    case "Briefcase":
      return <Briefcase className={className} />
    case "Gift":
      return <Gift className={className} />
    case "Heart":
      return <Heart className={className} />
    case "Users":
      return <Users className={className} />
    case "Truck":
      return <Truck className={className} />
    case "Wallet":
      return <Wallet className={className} />
    case "TrendingUp":
      return <TrendingUp className={className} />
    default:
      return <Target className={className} />
  }
}

// Types
interface CanvasItem {
  id: string
  text: string
  priority?: "high" | "medium" | "low"
  status?: "active" | "planned" | "archived"
  notes?: string
  createdAt: string
  updatedAt: string
}

interface CanvasSection {
  id: string
  title: string
  titleEn: string
  description: string
  iconName: string
  color: string
  items: CanvasItem[]
}

interface CanvasVersion {
  id: string
  name: string
  createdAt: string
  sections: CanvasSection[]
}

interface BMCData {
  // Change data structure to match the new API response
  keyPartners: CanvasSection
  keyActivities: CanvasSection
  keyResources: CanvasSection // Added keyResources
  valuePropositions: CanvasSection
  customerRelationships: CanvasSection
  channels: CanvasSection
  customerSegments: CanvasSection
  costStructure: CanvasSection
  revenueStreams: CanvasSection
  lastModified: string | null
  // </CHANGE>

  // Remove old versioning and currentVersion from the data structure
  currentVersion?: string
  versions?: CanvasVersion[]
  // </CHANGE>
}

// Initial canvas sections
const getInitialSections = (): CanvasSection[] => [
  {
    id: "key-partners",
    title: "Schlüsselpartner",
    titleEn: "Key Partners",
    description: "Wer sind unsere wichtigsten Partner und Lieferanten?",
    iconName: "Handshake",
    color: "bg-blue-50 border-blue-200",
    items: [
      {
        id: "kp-1",
        text: "Technologie-Partner (Cloud-Infrastruktur)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kp-2",
        text: "KI/ML-Dienstleister",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kp-3",
        text: "Branchenverbände (KV, Ärztekammern)",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "key-activities",
    title: "Schlüsselaktivitäten",
    titleEn: "Key Activities",
    description: "Welche Schlüsselaktivitäten erfordert unser Wertangebot?",
    iconName: "Briefcase",
    color: "bg-purple-50 border-purple-200",
    items: [
      {
        id: "ka-1",
        text: "Software-Entwicklung & Wartung",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ka-2",
        text: "KI-Training & Optimierung",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ka-3",
        text: "Kundensupport & Schulungen",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "value-propositions",
    title: "Wertangebote",
    titleEn: "Value Propositions",
    description: "Welchen Wert liefern wir dem Kunden?",
    iconName: "Gift",
    color: "bg-green-50 border-green-200",
    items: [
      {
        id: "vp-1",
        text: "Struktur. Erfolg. Leichtigkeit.",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "vp-2",
        text: "2+ Stunden Zeitersparnis täglich",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "vp-3",
        text: "KI-gestützte Praxisoptimierung",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "vp-4",
        text: "Alles-in-einem Praxismanagement",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "customer-relationships",
    title: "Kundenbeziehungen",
    titleEn: "Customer Relationships",
    description: "Welche Art von Beziehung erwartet jedes Kundensegment?",
    iconName: "Heart",
    color: "bg-pink-50 border-pink-200",
    items: [
      {
        id: "cr-1",
        text: "Persönlicher Support (Premium)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cr-2",
        text: "Self-Service Knowledge Base",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cr-3",
        text: "Community & Erfahrungsaustausch",
        priority: "low",
        status: "planned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "customer-segments",
    title: "Kundensegmente",
    titleEn: "Customer Segments",
    description: "Für wen schaffen wir Wert?",
    iconName: "Users",
    color: "bg-orange-50 border-orange-200",
    items: [
      {
        id: "cs-1",
        text: "Arztpraxen (Einzel & Gemeinschaft)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cs-2",
        text: "MVZ (Medizinische Versorgungszentren)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cs-3",
        text: "Therapeutenpraxen",
        priority: "medium",
        status: "planned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "channels",
    title: "Kanäle",
    titleEn: "Channels",
    description: "Über welche Kanäle erreichen wir unsere Kundensegmente?",
    iconName: "Truck",
    color: "bg-cyan-50 border-cyan-200",
    items: [
      {
        id: "ch-1",
        text: "Direktvertrieb (Online Demo)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ch-2",
        text: "Fachkongresse & Messen",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "ch-3",
        text: "Empfehlungsprogramm (100€)",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "cost-structure",
    title: "Kostenstruktur",
    titleEn: "Cost Structure",
    description: "Was sind die wichtigsten Kosten unseres Geschäftsmodells?",
    iconName: "Wallet",
    color: "bg-red-50 border-red-200",
    items: [
      {
        id: "cost-1",
        text: "Entwicklung & Personal",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cost-2",
        text: "Cloud-Infrastruktur & KI-APIs",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "cost-3",
        text: "Marketing & Vertrieb",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: "revenue-streams",
    title: "Einnahmequellen",
    titleEn: "Revenue Streams",
    description: "Für welchen Wert sind unsere Kunden bereit zu zahlen?",
    iconName: "TrendingUp",
    color: "bg-emerald-50 border-emerald-200",
    items: [
      {
        id: "rev-1",
        text: "SaaS-Abonnements (Starter/Pro/Enterprise)",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "rev-2",
        text: "Zusatzmodule & Add-ons",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "rev-3",
        text: "Schulungen & Onboarding",
        priority: "low",
        status: "planned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
  // Added Key Resources section
  {
    id: "key-resources",
    title: "Schlüsselressourcen",
    titleEn: "Key Resources",
    description: "Welche Ressourcen erfordert unser Wertangebot?",
    iconName: "Briefcase", // Using Briefcase icon for now
    color: "bg-indigo-50 border-indigo-200",
    items: [
      {
        id: "kr-1",
        text: "Entwicklerteam",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kr-2",
        text: "Cloud-Infrastruktur",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kr-3",
        text: "KI-Modelle",
        priority: "high",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kr-4",
        text: "Kundendaten",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "kr-5",
        text: "Branchenwissen",
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  },
]

const getInitialBMCData = (): BMCData => ({
  // Map initial sections to the new structure
  keyPartners: getInitialSections().find((s) => s.id === "key-partners")!,
  keyActivities: getInitialSections().find((s) => s.id === "key-activities")!,
  keyResources: getInitialSections().find((s) => s.id === "key-resources")!,
  valuePropositions: getInitialSections().find((s) => s.id === "value-propositions")!,
  customerRelationships: getInitialSections().find((s) => s.id === "customer-relationships")!,
  channels: getInitialSections().find((s) => s.id === "channels")!,
  customerSegments: getInitialSections().find((s) => s.id === "customer-segments")!,
  costStructure: getInitialSections().find((s) => s.id === "cost-structure")!,
  revenueStreams: getInitialSections().find((s) => s.id === "revenue-streams")!,
  lastModified: new Date().toISOString(),
})

export default function BusinessModelCanvasManager() {
  const [data, setData] = useState<BMCData>(getInitialBMCData())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("canvas")
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: CanvasItem } | null>(null)
  const [isAddingItem, setIsAddingItem] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false) // Keep this for now, though versioning is removed

  useEffect(() => {
    const loadData = async () => {
      // Use practiceId 0 for super-admin global BMC
      const practiceId = 0
      try {
        const response = await fetch(`/api/super-admin/business-model-canvas?practiceId=${practiceId}`)
        if (response.ok) {
          const bmcData = await response.json()
          // Map the API response to the new BMCData structure
          const mappedData: BMCData = {
            keyPartners: bmcData.keyPartners || getInitialSections().find((s) => s.id === "key-partners")!,
            keyActivities: bmcData.keyActivities || getInitialSections().find((s) => s.id === "key-activities")!,
            keyResources: bmcData.keyResources || getInitialSections().find((s) => s.id === "key-resources")!,
            valuePropositions:
              bmcData.valuePropositions || getInitialSections().find((s) => s.id === "value-propositions")!,
            customerRelationships:
              bmcData.customerRelationships || getInitialSections().find((s) => s.id === "customer-relationships")!,
            channels: bmcData.channels || getInitialSections().find((s) => s.id === "channels")!,
            customerSegments:
              bmcData.customerSegments || getInitialSections().find((s) => s.id === "customer-segments")!,
            costStructure: bmcData.costStructure || getInitialSections().find((s) => s.id === "cost-structure")!,
            revenueStreams: bmcData.revenueStreams || getInitialSections().find((s) => s.id === "revenue-streams")!,
            lastModified: bmcData.lastModified,
          }
          setData(mappedData)
        } else {
          // If response is not ok, use initial data
          setData(getInitialBMCData())
        }
      } catch (error) {
        console.error("Failed to load BMC data:", error)
        setData(getInitialBMCData()) // Fallback to initial data on error
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const saveData = useCallback(async (newData: BMCData) => {
    // Ensure lastModified is updated for every save
    const updated = { ...newData, lastModified: new Date().toISOString() }
    setData(updated)
    setIsSaving(true)

    try {
      // Use practiceId 0 for super-admin global BMC
      const practiceId = 0
      const response = await fetch("/api/super-admin/business-model-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId, ...updated }),
      })
      if (!response.ok) {
        // Handle error: e.g., show a toast
        toast({
          title: "Fehler beim Speichern",
          description: "Ihre Änderungen konnten nicht gespeichert werden.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Gespeichert",
          description: "Ihr Business Model Canvas wurde erfolgreich aktualisiert.",
        })
      }
    } catch (error) {
      console.error("Failed to save BMC data:", error)
      toast({
        title: "Fehler beim Speichern",
        description: "Ein Netzwerkfehler ist aufgetreten.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [])

  const getCurrentSections = useCallback(() => {
    // Return sections in the order they appear on the canvas
    return [
      data.keyPartners,
      data.keyActivities,
      data.valuePropositions,
      data.customerRelationships,
      data.customerSegments,
      data.channels,
      data.keyResources, // Added Key Resources here
      data.costStructure,
      data.revenueStreams,
    ].filter(Boolean) // Filter out any potential null/undefined sections
  }, [data])

  const updateSection = useCallback(
    (sectionId: string, updatedItems: CanvasItem[]) => {
      const newSectionData = {
        ...(data[sectionId as keyof BMCData] as CanvasSection), // Cast to CanvasSection
        items: updatedItems,
      }

      saveData({
        ...data,
        [sectionId]: newSectionData,
      })
    },
    [data, saveData],
  )

  const addItem = useCallback(
    (sectionId: string) => {
      if (!newItemText.trim()) return
      const currentSection = data[sectionId as keyof BMCData] as CanvasSection // Cast to CanvasSection
      if (!currentSection) return

      const newItem: CanvasItem = {
        id: `${sectionId}-${Date.now()}`,
        text: newItemText.trim(),
        priority: "medium",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      updateSection(sectionId, [...currentSection.items, newItem])
      setNewItemText("")
      setIsAddingItem(null)
      toast({ title: "Eintrag hinzugefügt", description: "Der neue Eintrag wurde erfolgreich erstellt." })
    },
    [newItemText, data, updateSection],
  )

  const deleteItem = useCallback(
    (sectionId: string, itemId: string) => {
      const currentSection = data[sectionId as keyof BMCData] as CanvasSection // Cast to CanvasSection
      if (!currentSection) return

      updateSection(
        sectionId,
        currentSection.items.filter((i) => i.id !== itemId),
      )
      toast({ title: "Eintrag gelöscht", description: "Der Eintrag wurde entfernt." })
    },
    [data, updateSection],
  )

  const updateItem = useCallback(
    (sectionId: string, itemId: string, updates: Partial<CanvasItem>) => {
      const currentSection = data[sectionId as keyof BMCData] as CanvasSection // Cast to CanvasSection
      if (!currentSection) return

      updateSection(
        sectionId,
        currentSection.items.map((i) =>
          i.id === itemId ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i,
        ),
      )
    },
    [data, updateSection],
  )

  // Remove versioning functions as they are no longer used
  // const createNewVersion = useCallback(() => { ... })
  // const switchVersion = useCallback((versionId: string) => { ... })
  // </CHANGE>

  const exportCanvas = useCallback(() => {
    // Construct the data to export, excluding lastModified if not needed in the file
    const exportData = {
      keyPartners: data.keyPartners,
      keyActivities: data.keyActivities,
      keyResources: data.keyResources,
      valuePropositions: data.valuePropositions,
      customerRelationships: data.customerRelationships,
      channels: data.channels,
      customerSegments: data.customerSegments,
      costStructure: data.costStructure,
      revenueStreams: data.revenueStreams,
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `business-model-canvas-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Export erfolgreich", description: "Das Canvas wurde als JSON exportiert." })
  }, [data])

  const exportMarkdown = useCallback(() => {
    const sections = getCurrentSections()
    let md = "# Business Model Canvas - Effizienz Praxis\n\n"
    md += `*Exportiert am ${new Date().toLocaleDateString("de-DE")}*\n\n`

    sections.forEach((section) => {
      md += `## ${section.title} (${section.titleEn})\n\n`
      md += `${section.description}\n\n`
      section.items.forEach((item) => {
        const priority = item.priority === "high" ? "🔴" : item.priority === "medium" ? "🟡" : "🟢"
        md += `- ${priority} ${item.text}\n`
      })
      md += "\n"
    })

    const blob = new Blob([md], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `business-model-canvas-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast({ title: "Markdown Export", description: "Das Canvas wurde als Markdown exportiert." })
  }, [getCurrentSections])

  const generateWithAI = useCallback(async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/business-model-canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          // Pass current canvas sections to AI
          currentCanvas: getCurrentSections().reduce(
            (acc, section) => {
              acc[section.id] = section
              return acc
            },
            {} as Record<string, CanvasSection>,
          ),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Assuming the API returns suggestions that need to be merged into the data
        if (result.suggestions) {
          // This part needs to be adapted based on how the AI suggestions are structured
          // For now, let's assume suggestions might be for specific sections
          toast({
            title: "KI-Vorschläge generiert",
            description: "Die Vorschläge wurden dem Canvas hinzugefügt.",
          })
          // Example: If result.suggestions is like { "key-partners": [{ text: "new idea", priority: "low" }] }
          // You would need to update the `data` state accordingly and call `saveData`.
          // This requires more specific logic based on the AI API response.
        }
      } else {
        toast({
          title: "Fehler bei der KI-Anfrage",
          description: "Die KI konnte keine Vorschläge generieren.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "KI-Generierung fehlgeschlagen.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
      setAiPrompt("")
    }
  }, [aiPrompt, getCurrentSections])

  const resetToDefault = useCallback(() => {
    const defaultData = getInitialBMCData() // Use the new initial data getter
    saveData(defaultData)
    toast({ title: "Zurückgesetzt", description: "Das Canvas wurde auf die Standardwerte zurückgesetzt." })
  }, [saveData])

  const sections = getCurrentSections()

  // Calculate metrics
  const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0)
  const highPriorityItems = sections.reduce((acc, s) => acc + s.items.filter((i) => i.priority === "high").length, 0)
  const activeItems = sections.reduce((acc, s) => acc + s.items.filter((i) => i.status === "active").length, 0)
  // Completeness calculation needs adjustment as sections are now individual objects, not an array of all sections
  const definedSectionsCount = Object.values(data).filter(
    (section) => section && Array.isArray(section.items) && section.items.length > 0,
  ).length
  const totalPossibleSections = 9 // Number of sections in BMCData
  const completeness = Math.round((definedSectionsCount / totalPossibleSections) * 100)

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 text-emerald-800"
      case "planned":
        return "bg-blue-100 text-blue-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Helper to find a section by its ID (used for mapping in the grid)
  const getSectionById = (id: string) => {
    return sections.find((s) => s.id === id)
  }

  // Define the order of sections for rendering
  const orderedSectionIds = [
    "key-partners",
    "key-activities",
    "value-propositions",
    "customer-relationships",
    "customer-segments",
    "channels",
    "key-resources", // Make sure this ID matches the one in getInitialSections
    "cost-structure",
    "revenue-streams",
  ]

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading Canvas...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Model Canvas</h2>
          <p className="text-muted-foreground">Visualisieren und entwickeln Sie Ihr Geschäftsmodell</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="outline" size="sm" onClick={() => setShowVersionHistory(true)}>
            <History className="mr-2 h-4 w-4" />
            Versionen ({data.versions?.length || 0})
          </Button> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportCanvas}>
                <FileText className="mr-2 h-4 w-4" />
                Als JSON exportieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportMarkdown}>
                <FileText className="mr-2 h-4 w-4" />
                Als Markdown exportieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* <Button variant="outline" size="sm" onClick={createNewVersion}>
            <Save className="mr-2 h-4 w-4" />
            Version speichern
          </Button> */}
          <Button variant="outline" size="sm" onClick={() => saveData(data)} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vollständigkeit</p>
                <p className="text-2xl font-bold">{completeness}%</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Einträge gesamt</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hohe Priorität</p>
                <p className="text-2xl font-bold">{highPriorityItems}</p>
              </div>
              <Target className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Einträge</p>
                <p className="text-2xl font-bold">{activeItems}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="canvas">Canvas</TabsTrigger>
          <TabsTrigger value="ai">KI-Assistent</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas" className="space-y-4">
          {/* BMC Grid Layout */}
          <div className="grid grid-cols-5 gap-4">
            {/* Row 1: Partners, Activities, Value Props, Relationships, Segments */}
            {/* Key Partners */}
            <Card className={cn("border-2", getSectionById("key-partners")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("key-partners")?.iconName} className="h-4 w-4" />
                  {getSectionById("key-partners")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("key-partners")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("key-partners")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "key-partners", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("key-partners", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "key-partners" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("key-partners")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("key-partners")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("key-partners")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Key Activities */}
            <Card className={cn("border-2", getSectionById("key-activities")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("key-activities")?.iconName} className="h-4 w-4" />
                  {getSectionById("key-activities")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("key-activities")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("key-activities")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "key-activities", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("key-activities", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "key-activities" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("key-activities")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("key-activities")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("key-activities")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Value Propositions - Center */}
            <Card className={cn("row-span-2 border-2", getSectionById("value-propositions")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("value-propositions")?.iconName} className="h-4 w-4" />
                  {getSectionById("value-propositions")?.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {getSectionById("value-propositions")?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("value-propositions")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium">{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "value-propositions", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("value-propositions", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px]", getStatusColor(item.status))}>
                        {item.status === "active" ? "Aktiv" : item.status === "planned" ? "Geplant" : "Archiviert"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "value-propositions" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("value-propositions")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("value-propositions")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("value-propositions")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Customer Relationships */}
            <Card className={cn("border-2", getSectionById("customer-relationships")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("customer-relationships")?.iconName} className="h-4 w-4" />
                  {getSectionById("customer-relationships")?.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {getSectionById("customer-relationships")?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("customer-relationships")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() => setEditingItem({ sectionId: "customer-relationships", item })}
                          >
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("customer-relationships", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "customer-relationships" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("customer-relationships")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("customer-relationships")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("customer-relationships")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Customer Segments */}
            <Card className={cn("border-2", getSectionById("customer-segments")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("customer-segments")?.iconName} className="h-4 w-4" />
                  {getSectionById("customer-segments")?.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {getSectionById("customer-segments")?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("customer-segments")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "customer-segments", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("customer-segments", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "customer-segments" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("customer-segments")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("customer-segments")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("customer-segments")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Row 2: Key Resources and Channels (Value Props spans both rows) */}
            <Card className={cn("col-span-2 border-2", getSectionById("key-resources")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("key-resources")?.iconName} className="h-4 w-4" />
                  {getSectionById("key-resources")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("key-resources")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("key-resources")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "key-resources", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("key-resources", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "key-resources" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("key-resources")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("key-resources")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("key-resources")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Channels */}
            <Card className={cn("col-span-2 border-2", getSectionById("channels")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("channels")?.iconName} className="h-4 w-4" />
                  {getSectionById("channels")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("channels")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("channels")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "channels", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteItem("channels", item.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                {isAddingItem === "channels" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("channels")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("channels")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("channels")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Row 3: Cost Structure and Revenue Streams */}
            <Card className={cn("col-span-2 border-2", getSectionById("cost-structure")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("cost-structure")?.iconName} className="h-4 w-4" />
                  {getSectionById("cost-structure")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("cost-structure")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("cost-structure")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "cost-structure", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("cost-structure", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "cost-structure" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("cost-structure")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("cost-structure")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("cost-structure")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Spacer for center column */}
            <div />

            {/* Revenue Streams */}
            <Card className={cn("col-span-2 border-2", getSectionById("revenue-streams")?.color)}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <SectionIcon name={getSectionById("revenue-streams")?.iconName} className="h-4 w-4" />
                  {getSectionById("revenue-streams")?.title}
                </CardTitle>
                <CardDescription className="text-xs">{getSectionById("revenue-streams")?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {getSectionById("revenue-streams")?.items.map((item) => (
                  <div key={item.id} className="group relative rounded-md border bg-white p-2 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.text}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setEditingItem({ sectionId: "revenue-streams", item })}>
                            <Edit className="mr-2 h-3 w-3" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteItem("revenue-streams", item.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-1 flex gap-1">
                      <Badge variant="outline" className={cn("text-[10px]", getPriorityColor(item.priority))}>
                        {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {isAddingItem === "revenue-streams" ? (
                  <div className="space-y-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neuer Eintrag..."
                      className="text-xs"
                      onKeyDown={(e) => e.key === "Enter" && addItem("revenue-streams")}
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-xs" onClick={() => addItem("revenue-streams")}>
                        Hinzufügen
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsAddingItem(null)}>
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-full text-xs"
                    onClick={() => setIsAddingItem("revenue-streams")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Hinzufügen
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                KI-Assistent
              </CardTitle>
              <CardDescription>Lassen Sie die KI Vorschläge für Ihr Business Model Canvas generieren</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Beschreiben Sie, was Sie analysieren möchten</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="z.B. Analysiere mögliche neue Kundensegmente für eine Praxismanagement-Software oder Schlage alternative Einnahmequellen vor..."
                  rows={4}
                />
              </div>
              <Button onClick={generateWithAI} disabled={isGenerating || !aiPrompt.trim()}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Vorschläge generieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Einstellungen</CardTitle>
              <CardDescription>Canvas-Einstellungen und Aktionen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auf Standard zurücksetzen</p>
                  <p className="text-sm text-muted-foreground">Setzt alle Einträge auf die Standardwerte zurück</p>
                </div>
                <Button variant="destructive" onClick={resetToDefault}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eintrag bearbeiten</DialogTitle>
            <DialogDescription>Bearbeiten Sie die Details dieses Eintrags</DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Text</Label>
                <Input
                  value={editingItem.item.text}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, text: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Priorität</Label>
                <div className="flex gap-2">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={editingItem.item.priority === p ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, priority: p },
                        })
                      }
                    >
                      {p === "high" ? "Hoch" : p === "medium" ? "Mittel" : "Niedrig"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex gap-2">
                  {(["active", "planned", "archived"] as const).map((s) => (
                    <Button
                      key={s}
                      variant={editingItem.item.status === s ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setEditingItem({
                          ...editingItem,
                          item: { ...editingItem.item, status: s },
                        })
                      }
                    >
                      {s === "active" ? "Aktiv" : s === "planned" ? "Geplant" : "Archiviert"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea
                  value={editingItem.item.notes || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      item: { ...editingItem.item, notes: e.target.value },
                    })
                  }
                  placeholder="Zusätzliche Notizen..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (editingItem) {
                  updateItem(editingItem.sectionId, editingItem.item.id, editingItem.item)
                  setEditingItem(null)
                  toast({ title: "Gespeichert", description: "Änderungen wurden übernommen." })
                }
              }}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog - Removed as versioning is no longer in use */}
      {/* <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Versionsverlauf</DialogTitle>
            <DialogDescription>Wählen Sie eine Version aus oder erstellen Sie eine neue</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {data.versions?.map((version) => (
                <div
                  key={version.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    version.id === data.currentVersion && "border-primary bg-primary/5",
                  )}
                >
                  <div>
                    <p className="font-medium">{version.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.createdAt).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  {version.id !== data.currentVersion && (
                    <Button variant="outline" size="sm" onClick={() => switchVersion(version.id)}>
                      Aktivieren
                    </Button>
                  )}
                  {version.id === data.currentVersion && <Badge variant="default">Aktiv</Badge>}
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVersionHistory(false)}>
              Schließen
            </Button>
            <Button onClick={createNewVersion}>
              <Plus className="mr-2 h-4 w-4" />
              Neue Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  )
}
