"use client"

import { useEffect, useState } from "react"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { usePractice } from "@/contexts/practice-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Sparkles, Plus, Search, BookOpen, FileText, Loader2, Archive, Package, Cpu, Wrench } from "lucide-react"
import { AiSearchDialog } from "./ai-search-dialog"
import { AIKnowledgeAnalyzerDialog } from "./ai-knowledge-analyzer-dialog"
import { CreateKnowledgeDialog } from "./create-knowledge-dialog"
import { EditKnowledgeDialog } from "./edit-knowledge-dialog"
import { PracticeHandbookView } from "./practice-handbook-view"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface KnowledgeArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  status: string
  version: number
  created_at: string
  updated_at: string
  published_at: string | null
  author_id: string
  source_type?: "article" | "device" | "material" | "arbeitsmittel"
  source_link?: string
}

interface OrgaCategory {
  id: string
  name: string
  color: string
}

interface MedicalDevice {
  id: string
  name: string
  description?: string
  manufacturer?: string
  model?: string
  serial_number?: string
  location?: string
  category?: string
  status?: string
  operating_instructions?: string
  cleaning_instructions?: string
  maintenance_instructions?: string
  created_at: string
  updated_at?: string
}

interface InventoryItem {
  id: string
  name: string
  description?: string
  category?: string
  unit?: string
  min_stock?: number
  current_stock?: number
  location?: string
  supplier?: string
  notes?: string
  created_at: string
  updated_at?: string
}

interface WorkEquipment {
  id: string
  name: string
  description?: string
  category?: string
  manufacturer?: string
  serial_number?: string
  location?: string
  status?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export function KnowledgeBaseManager() {
  const { isAiEnabled } = useAiEnabled()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  const [showAiSearch, setShowAiSearch] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null)
  const [articles, setArticles] = useState<KnowledgeArticle[]>([])
  const [orgaCategories, setOrgaCategories] = useState<OrgaCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("handbook")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [devices, setDevices] = useState<MedicalDevice[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [workEquipment, setWorkEquipment] = useState<WorkEquipment[]>([])

  useEffect(() => {
    if (currentPractice?.id) {
      fetchArticles()
      fetchCategories()
      fetchDevices()
      fetchInventory()
      fetchWorkEquipment()
    } else if (!practiceLoading) {
      setLoading(false)
    }
  }, [currentPractice?.id, practiceLoading])

  const fetchArticles = async () => {
    if (!currentPractice?.id) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await fetch(`/api/knowledge-base?practiceId=${currentPractice.id}`)
      if (!response.ok) throw new Error("Failed to fetch articles")
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error("Error fetching articles:", error)
      toast({
        title: "Fehler beim Laden",
        description: "Die Artikel konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchDevices = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/devices`)
      if (!response.ok) return
      const data = await response.json()
      setDevices(data.devices || data || [])
    } catch (error) {
      console.error("Error fetching devices:", error)
    }
  }

  const fetchInventory = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/inventory`)
      if (!response.ok) return
      const data = await response.json()
      setInventoryItems(data.items || data || [])
    } catch (error) {
      console.error("Error fetching inventory:", error)
    }
  }

  const fetchWorkEquipment = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/work-equipment`)
      if (!response.ok) return
      const data = await response.json()
      setWorkEquipment(data.items || data || [])
    } catch (error) {
      console.error("Error fetching work equipment:", error)
    }
  }

  const fetchCategories = async () => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
      if (!response.ok) throw new Error("Failed to fetch categories")
      const data = await response.json()
      const categories = data.categories || []
      const seen = new Set<string>()
      const uniqueCategories = categories.filter((cat: OrgaCategory) => {
        const key = cat.name?.toLowerCase()?.trim()
        if (key && !seen.has(key)) {
          seen.add(key)
          return true
        }
        return false
      })
      setOrgaCategories(uniqueCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const deviceArticles: KnowledgeArticle[] = devices.map((device) => {
    const contentParts = []
    if (device.description) contentParts.push(device.description)
    if (device.manufacturer) contentParts.push(`**Hersteller:** ${device.manufacturer}`)
    if (device.model) contentParts.push(`**Modell:** ${device.model}`)
    if (device.serial_number) contentParts.push(`**Seriennummer:** ${device.serial_number}`)
    if (device.location) contentParts.push(`**Standort:** ${device.location}`)
    if (device.operating_instructions) contentParts.push(`\n**Bedienungsanleitung:**\n${device.operating_instructions}`)
    if (device.cleaning_instructions) contentParts.push(`\n**Reinigungsanleitung:**\n${device.cleaning_instructions}`)
    if (device.maintenance_instructions)
      contentParts.push(`\n**Wartungsanleitung:**\n${device.maintenance_instructions}`)

    return {
      id: `device-${device.id}`,
      title: device.name,
      content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
      category: "Medizinische Geräte",
      tags: [device.category || "Gerät", device.status || "Aktiv"].filter(Boolean),
      status: "published",
      version: 1,
      created_at: device.created_at,
      updated_at: device.updated_at || device.created_at,
      published_at: device.created_at,
      author_id: "",
      source_type: "device",
      source_link: `/devices?id=${device.id}`,
    }
  })

  const inventoryArticles: KnowledgeArticle[] = inventoryItems.map((item) => {
    const contentParts = []
    if (item.description) contentParts.push(item.description)
    if (item.category) contentParts.push(`**Kategorie:** ${item.category}`)
    if (item.unit) contentParts.push(`**Einheit:** ${item.unit}`)
    if (item.current_stock !== undefined) contentParts.push(`**Aktueller Bestand:** ${item.current_stock}`)
    if (item.min_stock !== undefined) contentParts.push(`**Mindestbestand:** ${item.min_stock}`)
    if (item.location) contentParts.push(`**Lagerort:** ${item.location}`)
    if (item.supplier) contentParts.push(`**Lieferant:** ${item.supplier}`)
    if (item.notes) contentParts.push(`\n**Hinweise:**\n${item.notes}`)

    return {
      id: `inventory-${item.id}`,
      title: item.name,
      content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
      category: "Material & Verbrauch",
      tags: [item.category || "Material"].filter(Boolean),
      status: "published",
      version: 1,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      published_at: item.created_at,
      author_id: "",
      source_type: "material",
      source_link: `/inventory?id=${item.id}`,
    }
  })

  const workEquipmentArticles: KnowledgeArticle[] = workEquipment.map((item) => {
    const contentParts = []
    if (item.description) contentParts.push(item.description)
    if (item.manufacturer) contentParts.push(`**Hersteller:** ${item.manufacturer}`)
    if (item.serial_number) contentParts.push(`**Seriennummer:** ${item.serial_number}`)
    if (item.category) contentParts.push(`**Kategorie:** ${item.category}`)
    if (item.location) contentParts.push(`**Standort:** ${item.location}`)
    if (item.status) contentParts.push(`**Status:** ${item.status}`)
    if (item.notes) contentParts.push(`\n**Hinweise:**\n${item.notes}`)

    return {
      id: `equipment-${item.id}`,
      title: item.name,
      content: contentParts.join("\n\n") || "Keine Beschreibung verfügbar.",
      category: "Arbeitsmittel",
      tags: [item.category || "Arbeitsmittel", item.status || "Aktiv"].filter(Boolean),
      status: "published",
      version: 1,
      created_at: item.created_at,
      updated_at: item.updated_at || item.created_at,
      published_at: item.created_at,
      author_id: "",
      source_type: "arbeitsmittel",
      source_link: `/arbeitsmittel?id=${item.id}`,
    }
  })

  const allArticles = [...articles, ...deviceArticles, ...inventoryArticles, ...workEquipmentArticles]

  const articleCategories = [...new Set(allArticles.map((a) => a.category).filter(Boolean))]

  const filteredArticles = allArticles.filter((article) => {
    const matchesSearch = searchQuery
      ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
      : true
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const publishedCount = allArticles.filter((a) => a.status === "published").length
  const draftCount = allArticles.filter((a) => a.status === "draft").length

  const deviceCount = deviceArticles.length
  const materialCount = inventoryArticles.length
  const equipmentCount = workEquipmentArticles.length

  if (practiceLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!currentPractice?.id) {
    return (
      <Card className="p-12 text-center">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Praxis ausgewählt</h3>
        <p className="text-muted-foreground">Bitte wählen Sie eine Praxis aus der Seitenleiste aus.</p>
      </Card>
    )
  }

  const getSourceIcon = (sourceType?: string) => {
    switch (sourceType) {
      case "device":
        return <Cpu className="h-4 w-4 text-blue-500" />
      case "material":
        return <Package className="h-4 w-4 text-orange-500" />
      case "arbeitsmittel":
        return <Wrench className="h-4 w-4 text-green-500" />
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSourceBadge = (sourceType?: string) => {
    switch (sourceType) {
      case "device":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Gerät
          </Badge>
        )
      case "material":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Material
          </Badge>
        )
      case "arbeitsmittel":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Arbeitsmittel
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">QM Dokumentation</h1>
            <p className="text-muted-foreground">Qualitätsmanagement-Dokumentation mit KI-gestützter Suche</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <AIKnowledgeAnalyzerDialog />
            <Button
              size="default"
              variant="default"
              onClick={() => setShowAiSearch(true)}
              disabled={!isAiEnabled}
              className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white shadow-md hover:shadow-lg transition-all border-0"
            >
              <Sparkles className="h-4 w-4" />
              KI-Suche
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Neuer Artikel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{articles.length}</p>
                <p className="text-sm text-muted-foreground">Artikel</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{deviceCount}</p>
                <p className="text-sm text-muted-foreground">Geräte</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{materialCount}</p>
                <p className="text-sm text-muted-foreground">Material</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wrench className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{equipmentCount}</p>
                <p className="text-sm text-muted-foreground">Arbeitsmittel</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allArticles.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Artikel, Geräte, Material durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Alle Kategorien" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {articleCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="handbook" className="gap-2 flex-1">
              <BookOpen className="h-4 w-4" />
              Praxis Handbuch
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-2 flex-1">
              <FileText className="h-4 w-4" />
              Alle Einträge
              <Badge variant="secondary" className="ml-1">
                {publishedCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-2 flex-1">
              <FileText className="h-4 w-4" />
              Entwürfe
              <Badge variant="secondary" className="ml-1">
                {draftCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2 flex-1">
              <Archive className="h-4 w-4" />
              Archiviert
            </TabsTrigger>
          </TabsList>

          <TabsContent value="handbook" className="mt-6">
            <PracticeHandbookView
              articles={allArticles.filter((a) => a.status === "published")}
              orgaCategories={orgaCategories}
            />
          </TabsContent>

          <TabsContent value="published" className="space-y-4 mt-6">
            {filteredArticles.filter((a) => a.status === "published").length > 0 ? (
              <div className="grid gap-4">
                {filteredArticles
                  .filter((a) => a.status === "published")
                  .map((article) => (
                    <Card
                      key={article.id}
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (article.source_type && article.source_link) {
                          window.location.href = article.source_link
                        } else {
                          setEditingArticle(article)
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {getSourceIcon(article.source_type)}
                            <h3 className="font-semibold">{article.title}</h3>
                            {getSourceBadge(article.source_type)}
                            {!article.source_type && <Badge variant="default">Veröffentlicht</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Kategorie: {article.category}</span>
                            {!article.source_type && (
                              <>
                                <span>•</span>
                                <span>Version {article.version}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(article.updated_at).toLocaleDateString("de-DE")}</span>
                          </div>
                          {article.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {article.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Einträge gefunden</h3>
                <p className="text-muted-foreground">Erstellen Sie Artikel oder fügen Sie Geräte/Material hinzu.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4 mt-6">
            {filteredArticles.filter((a) => a.status === "draft").length > 0 ? (
              <div className="grid gap-4">
                {filteredArticles
                  .filter((a) => a.status === "draft")
                  .map((article) => (
                    <Card
                      key={article.id}
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setEditingArticle(article)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{article.title}</h3>
                            <Badge variant="secondary">Entwurf</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Kategorie: {article.category}</span>
                            <span>•</span>
                            <span>Version {article.version}</span>
                            <span>•</span>
                            <span>{new Date(article.updated_at).toLocaleDateString("de-DE")}</span>
                          </div>
                          {article.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {article.tags.map((tag, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Entwürfe</h3>
                <p className="text-muted-foreground">Erstellen Sie einen Artikel-Entwurf.</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <Card className="p-12 text-center">
              <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine archivierten Artikel</h3>
              <p className="text-muted-foreground">Archivierte Artikel werden hier angezeigt.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AiSearchDialog open={showAiSearch} onOpenChange={setShowAiSearch} />
      <CreateKnowledgeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchArticles()
          setShowCreateDialog(false)
        }}
      />
      {editingArticle && !editingArticle.source_type && (
        <EditKnowledgeDialog
          article={editingArticle}
          open={!!editingArticle}
          onOpenChange={(open) => !open && setEditingArticle(null)}
          onSuccess={() => {
            fetchArticles()
            setEditingArticle(null)
          }}
          orgaCategories={orgaCategories}
        />
      )}
    </>
  )
}
