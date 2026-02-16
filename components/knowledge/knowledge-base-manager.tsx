"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"
import { usePractice } from "@/contexts/practice-context"
import { REALTIME_SWR_CONFIG } from "@/lib/swr-config"
import { PageHeader } from "@/components/page-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  FileText,
  Loader2,
  Archive,

} from "lucide-react"
import { AiSearchDialog } from "./ai-search-dialog"
import { AIKnowledgeAnalyzerDialog } from "./ai-knowledge-analyzer-dialog"
import { CreateKnowledgeDialog } from "./create-knowledge-dialog"
import { EditKnowledgeDialog } from "./edit-knowledge-dialog"
import { PracticeHandbookView } from "./practice-handbook-view"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { KnowledgeArticle, OrgaCategory, MedicalDevice, InventoryItem, WorkEquipment } from "./types"
import { convertDeviceToArticle, convertInventoryToArticle, convertWorkEquipmentToArticle } from "./article-converters"
import { KnowledgeStatCards } from "./knowledge-stat-cards"
import { ArticleList } from "./article-list"


const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json() })

export function KnowledgeBaseManager() {
  const { isAiEnabled } = useAiEnabled()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { toast } = useToast()

  const practiceId = currentPractice?.id

  // SWR hooks with auto-refresh every 60 seconds
  const swrConfig = { ...REALTIME_SWR_CONFIG, refreshInterval: 60000 }

  const { data: articlesData, mutate: mutateArticles, isLoading: articlesLoading } = useSWR(
    practiceId ? `/api/knowledge-base?practiceId=${practiceId}` : null,
    fetcher,
    swrConfig,
  )

  const { data: categoriesData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/orga-categories` : null,
    fetcher,
    swrConfig,
  )

  const { data: devicesData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/devices` : null,
    fetcher,
    swrConfig,
  )

  const { data: inventoryData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/inventory` : null,
    fetcher,
    swrConfig,
  )

  const { data: workEquipmentData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/work-equipment` : null,
    fetcher,
    swrConfig,
  )

  const articles: KnowledgeArticle[] = articlesData?.articles || []
  const devices: MedicalDevice[] = devicesData?.devices || devicesData || []
  const inventoryItems: InventoryItem[] = inventoryData?.items || inventoryData || []
  const workEquipment: WorkEquipment[] = workEquipmentData?.items || workEquipmentData || []

  const orgaCategories = useMemo(() => {
    const categories = categoriesData?.categories || []
    const seen = new Set<string>()
    return categories.filter((cat: OrgaCategory) => {
      const key = cat.name?.toLowerCase()?.trim()
      if (key && !seen.has(key)) {
        seen.add(key)
        return true
      }
      return false
    })
  }, [categoriesData])

  const loading = articlesLoading

  const [showAiSearch, setShowAiSearch] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("handbook")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const [articleToDelete, setArticleToDelete] = useState<KnowledgeArticle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const deviceArticles = useMemo(() => devices.map(convertDeviceToArticle), [devices])
  const inventoryArticles = useMemo(() => inventoryItems.map(convertInventoryToArticle), [inventoryItems])
  const workEquipmentArticles = useMemo(() => workEquipment.map(convertWorkEquipmentToArticle), [workEquipment])

  const allArticles = useMemo(
    () => [...articles, ...deviceArticles, ...inventoryArticles, ...workEquipmentArticles],
    [articles, deviceArticles, inventoryArticles, workEquipmentArticles]
  )

  const articleCategories = useMemo(
    () => [...new Set(allArticles.map((a) => a.category).filter(Boolean))],
    [allArticles]
  )

  const filteredArticles = useMemo(() => {
    return allArticles.filter((article) => {
      const matchesSearch = searchQuery
        ? article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true
      const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [allArticles, searchQuery, categoryFilter])

  const publishedCount = useMemo(() => allArticles.filter((a) => a.status === "published").length, [allArticles])
  const draftCount = useMemo(() => allArticles.filter((a) => a.status === "draft").length, [allArticles])

  const deviceCount = deviceArticles.length
  const materialCount = inventoryArticles.length
  const equipmentCount = workEquipmentArticles.length

  const handleDeleteArticle = async () => {
    if (!articleToDelete?.id || !currentPractice?.id) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/knowledge-base/${articleToDelete.id}?practiceId=${currentPractice.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete article")

      toast({
        title: "Artikel gelöscht",
        description: "Der Artikel wurde erfolgreich gelöscht.",
      })

      mutateArticles()
    } catch (error) {
      console.error("Error deleting article:", error)
      toast({
        title: "Fehler",
        description: "Der Artikel konnte nicht gelöscht werden.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setArticleToDelete(null)
    }
  }

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

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="QM Dokumentation"
          subtitle="Qualitaetsmanagement-Dokumentation mit KI-gestuetzter Suche"
          actions={
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
          }
        />

        <KnowledgeStatCards
          articleCount={articles.length}
          deviceCount={deviceCount}
          materialCount={materialCount}
          equipmentCount={equipmentCount}
          totalCount={allArticles.length}
        />

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
              onEdit={setEditingArticle}
              onDelete={setArticleToDelete}
            />
          </TabsContent>

          <TabsContent value="published" className="space-y-4 mt-6">
            <ArticleList
              articles={filteredArticles}
              status="published"
              onEdit={setEditingArticle}
            />
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4 mt-6">
            <ArticleList
              articles={filteredArticles}
              status="draft"
              onEdit={setEditingArticle}
              onDelete={setArticleToDelete}
            />
          </TabsContent>

          <TabsContent value="archived" className="mt-6">
            <ArticleList
              articles={filteredArticles}
              status="archived"
            />
          </TabsContent>


        </Tabs>
      </div>

      <AiSearchDialog open={showAiSearch} onOpenChange={setShowAiSearch} />
      <CreateKnowledgeDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          mutateArticles()
          setShowCreateDialog(false)
        }}
      />
      {editingArticle && !editingArticle.source_type && (
        <EditKnowledgeDialog
          article={editingArticle}
          open={!!editingArticle}
          onOpenChange={(open) => !open && setEditingArticle(null)}
          onSuccess={() => {
            mutateArticles()
            setEditingArticle(null)
          }}
          orgaCategories={orgaCategories}
        />
      )}
      <AlertDialog open={!!articleToDelete} onOpenChange={(open) => !open && setArticleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Artikel &quot;{articleToDelete?.title}&quot; wirklich löschen? Diese Aktion kann nicht
              rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Löschen...
                </>
              ) : (
                "Löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
