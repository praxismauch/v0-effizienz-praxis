"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Save,
  Loader2,
  Download,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  User,
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Target,
  BookOpen,
  MessageSquare,
  Contact,
  Workflow,
  CalendarDays,
  Crown,
  FolderKanban,
  LineChart,
  Package,
  Stethoscope,
  Lightbulb,
  BriefcaseBusiness,
  Award,
  Network,
  Wrench,
  ClipboardCheck,
  Compass,
  Heart,
  CircleDot,
  MessageCircle,
  GraduationCap,
  Pin,
  Clock,
  Sparkles,
  Bug,
  HelpCircle,
  Gift,
  Moon,
  CheckSquare,
  Building2,
  Mail,
  CreditCard,
  LayoutGrid,
  LayoutPanelLeft,
  ListTodo,
  ToggleLeft,
  TestTube,
  FolderCheck,
  Tags,
  Globe,
  Menu,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Key,
  KeyRound,
  Info,
  Scale,
  Shield,
  ScrollText,
  Cookie,
  Quote,
  Database,
  LayoutList,
  type LucideIcon,
} from "lucide-react"

// Icon mapping for dynamic icon rendering
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  ClipboardList,
  Target,
  BookOpen,
  MessageSquare,
  Contact,
  Workflow,
  CalendarDays,
  Crown,
  FolderKanban,
  LineChart,
  Package,
  Stethoscope,
  Lightbulb,
  BriefcaseBusiness,
  Award,
  Network,
  Wrench,
  ClipboardCheck,
  Compass,
  Heart,
  CircleDot,
  MessageCircle,
  GraduationCap,
  Pin,
  Clock,
  Sparkles,
  Bug,
  HelpCircle,
  Gift,
  Moon,
  CheckSquare,
  Building2,
  Mail,
  CreditCard,
  LayoutGrid,
  LayoutPanelLeft,
  ListTodo,
  ToggleLeft,
  TestTube,
  FolderCheck,
  Tags,
  Globe,
  Menu,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Key,
  KeyRound,
  Info,
  Scale,
  Shield,
  ScrollText,
  Cookie,
  Quote,
  Database,
  LayoutList,
  Calendar,
  Search,
}

interface UIItem {
  id: string
  name: string
  path?: string
  icon?: string
}

interface UISection {
  id: string
  name: string
  items: UIItem[]
}

interface UICategory {
  id: string
  name: string
  description: string
  sections: UISection[]
}

interface UIItemsData {
  version: string
  lastUpdated: string
  categories: UICategory[]
}

interface TestItemStatus {
  status: "working" | "not_working" | "untested"
  notes: string
}

interface TestRun {
  id: string
  name: string
  created_at: string
  created_by: string
  items: Record<string, TestItemStatus>
  summary: {
    total: number
    working: number
    not_working: number
    untested: number
  }
  ui_items_version?: string
  ui_items_snapshot?: UIItemsData
}

export default function UIItemsTestManager() {
  const [uiItemsData, setUiItemsData] = useState<UIItemsData | null>(null)
  const [testItems, setTestItems] = useState<Record<string, TestItemStatus>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [testRunName, setTestRunName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isStartingNewTest, setIsStartingNewTest] = useState(false)
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
  const [selectedTestRun, setSelectedTestRun] = useState<TestRun | null>(null)
  const [activeTab, setActiveTab] = useState("current")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [currentTestName, setCurrentTestName] = useState<string>("")

  // Fetch fresh UI items from API
  const fetchUIItems = useCallback(async () => {
    try {
      console.log("[v0] Fetching UI items from API...")
      const response = await fetch("/api/super-admin/ui-items")
      console.log("[v0] UI items response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] UI items loaded:", data.categories?.length, "categories")
        setUiItemsData(data)
        // Expand all categories by default
        setExpandedCategories(data.categories.map((c: UICategory) => c.id))
        return data
      } else {
        const errorText = await response.text()
        console.error("[v0] UI items fetch failed:", response.status, errorText)
        toast.error(`Fehler beim Laden: ${response.status}`)
      }
    } catch (error) {
      console.error("[v0] Error fetching UI items:", error)
      toast.error("Fehler beim Laden der UI-Items")
    }
    return null
  }, [])

  // Initialize test items from UI data
  const initializeTestItems = useCallback((data: UIItemsData) => {
    const initialItems: Record<string, TestItemStatus> = {}
    data.categories.forEach((category) => {
      category.sections.forEach((section) => {
        section.items.forEach((item) => {
          initialItems[item.id] = { status: "untested", notes: "" }
        })
      })
    })
    setTestItems(initialItems)
  }, [])

  // Load test runs from database
  const loadTestRuns = async () => {
    try {
      const response = await fetch("/api/super-admin/ui-tests")
      if (response.ok) {
        const data = await response.json()
        setTestRuns(data.testRuns || [])
      }
    } catch (error) {
      console.error("Error loading test runs:", error)
    }
  }

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      const data = await fetchUIItems()
      if (data) {
        initializeTestItems(data)
      }
      await loadTestRuns()
      setIsLoading(false)
    }
    init()
  }, [fetchUIItems, initializeTestItems])

  // Start a new test
  const startNewTest = async () => {
    console.log("[v0] startNewTest function called")
    console.log("[v0] Current state - isStartingNewTest:", isStartingNewTest)
    setIsStartingNewTest(true)
    console.log("[v0] Set isStartingNewTest to true")

    try {
      console.log("[v0] About to fetch fresh UI items...")
      // Fetch fresh UI items to ensure we have the latest
      const data = await fetchUIItems()
      console.log("[v0] Fetch completed, data:", data ? "exists" : "null")

      if (data) {
        console.log("[v0] Initializing test items from", data.categories?.length, "categories")
        initializeTestItems(data)
        console.log("[v0] Test items initialized")
        setSelectedTestRun(null)
        console.log("[v0] Selected test run cleared")
        setCurrentTestName("")
        console.log("[v0] Current test name cleared")
        setActiveTab("current")
        console.log("[v0] Active tab set to current")
        toast.success("Neuer Test gestartet mit aktueller UI-Items Liste")
        console.log("[v0] Success toast shown")
      } else {
        console.error("[v0] Failed to fetch UI items for new test - data is null")
        toast.error("Konnte UI-Items nicht laden")
      }
    } catch (error) {
      console.error("[v0] Error starting new test:", error)
      console.error("[v0] Error details:", error instanceof Error ? error.message : String(error))
      toast.error("Fehler beim Starten des neuen Tests")
    } finally {
      console.log("[v0] Finally block - setting isStartingNewTest to false")
      setIsStartingNewTest(false)
      console.log("[v0] Closing create dialog")
      setIsCreateDialogOpen(false)
      console.log("[v0] startNewTest function completed")
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const setItemStatus = (itemId: string, status: "working" | "not_working" | "untested") => {
    setTestItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], status },
    }))
  }

  const setItemNotes = (itemId: string, notes: string) => {
    setTestItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], notes },
    }))
  }

  const markAllAs = (status: "working" | "not_working" | "untested") => {
    const updated = { ...testItems }
    Object.keys(updated).forEach((key) => {
      updated[key] = { ...updated[key], status }
    })
    setTestItems(updated)
  }

  const getSummary = () => {
    const items = Object.values(testItems)
    return {
      total: items.length,
      working: items.filter((i) => i.status === "working").length,
      not_working: items.filter((i) => i.status === "not_working").length,
      untested: items.filter((i) => i.status === "untested").length,
    }
  }

  const saveTestRun = async () => {
    if (!testRunName.trim()) {
      toast.error("Bitte geben Sie einen Namen für den Testlauf ein")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/super-admin/ui-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: testRunName,
          items: testItems,
          summary: getSummary(),
          uiItemsVersion: uiItemsData?.version,
          uiItemsSnapshot: uiItemsData,
        }),
      })

      if (response.ok) {
        toast.success("Testlauf gespeichert")
        setIsSaveDialogOpen(false)
        setTestRunName("")
        setCurrentTestName(testRunName)
        loadTestRuns()
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  const loadTestRun = (testRun: TestRun) => {
    // If the test run has a snapshot, use it
    if (testRun.ui_items_snapshot) {
      setUiItemsData(testRun.ui_items_snapshot)
      setExpandedCategories(testRun.ui_items_snapshot.categories.map((c) => c.id))
    }
    setTestItems(testRun.items)
    setSelectedTestRun(testRun)
    setCurrentTestName(testRun.name)
    setActiveTab("current")
    toast.success(`Testlauf "${testRun.name}" geladen`)
  }

  const deleteTestRun = async (id: string) => {
    try {
      const response = await fetch(`/api/super-admin/ui-tests?id=${id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast.success("Testlauf gelöscht")
        loadTestRuns()
        if (selectedTestRun?.id === id) {
          setSelectedTestRun(null)
          startNewTest()
        }
      }
    } catch (error) {
      toast.error("Fehler beim Löschen")
    }
    setDeleteConfirmId(null)
  }

  const exportTestRun = () => {
    const summary = getSummary()
    const data = {
      exportDate: new Date().toISOString(),
      testName: currentTestName || "Unbenannter Test",
      uiItemsVersion: uiItemsData?.version,
      summary,
      categories: uiItemsData?.categories.map((category) => ({
        ...category,
        sections: category.sections.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            ...testItems[item.id],
          })),
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ui-test-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getIcon = (iconName?: string): LucideIcon => {
    if (!iconName) return LayoutDashboard
    return ICON_MAP[iconName] || LayoutDashboard
  }

  const filteredCategories =
    uiItemsData?.categories
      .map((category) => ({
        ...category,
        sections: category.sections
          .map((section) => ({
            ...section,
            items: section.items.filter(
              (item) =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.path?.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
          }))
          .filter((section) => section.items.length > 0),
      }))
      .filter((category) => category.sections.length > 0) || []

  const summary = getSummary()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2">Lade UI-Items...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                UI-Items Test
                {currentTestName && (
                  <Badge variant="outline" className="ml-2">
                    {currentTestName}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Testen Sie alle UI-Elemente der Anwendung
                {uiItemsData && <span className="text-xs ml-2">(Version: {uiItemsData.version})</span>}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Neuer Test
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsSaveDialogOpen(true)}>
                <Save className="h-4 w-4 mr-1" />
                Speichern
              </Button>
              <Button variant="outline" size="sm" onClick={exportTestRun}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{summary.total}</div>
              <div className="text-xs text-muted-foreground">Gesamt</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.working}</div>
              <div className="text-xs text-muted-foreground">Funktioniert</div>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.not_working}</div>
              <div className="text-xs text-muted-foreground">Fehlerhaft</div>
            </div>
            <div className="text-center p-3 bg-yellow-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{summary.untested}</div>
              <div className="text-xs text-muted-foreground">Ungetestet</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={() => markAllAs("working")}>
              <Check className="h-3 w-3 mr-1" />
              Alle OK
            </Button>
            <Button variant="outline" size="sm" onClick={() => markAllAs("untested")}>
              <AlertCircle className="h-3 w-3 mr-1" />
              Alle zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Current Test vs History */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Aktueller Test</TabsTrigger>
          <TabsTrigger value="history">Verlauf ({testRuns.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="UI-Items durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {filteredCategories.map((category) => (
                    <Collapsible
                      key={category.id}
                      open={expandedCategories.includes(category.id)}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80">
                          <div className="flex items-center gap-2">
                            {expandedCategories.includes(category.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-semibold">{category.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({category.sections.reduce((acc, s) => acc + s.items.length, 0)} Items)
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-4 space-y-2">
                        {category.sections.map((section) => (
                          <Collapsible
                            key={section.id}
                            open={expandedSections.includes(section.id)}
                            onOpenChange={() => toggleSection(section.id)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted/50">
                                {expandedSections.includes(section.id) ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                                <span className="text-sm font-medium">{section.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {section.items.length}
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1 ml-4 space-y-1">
                              {section.items.map((item) => {
                                const ItemIcon = getIcon(item.icon)
                                const itemStatus = testItems[item.id]
                                return (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-2 rounded border bg-card"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <ItemIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <div className="min-w-0">
                                        <div className="text-sm font-medium truncate">{item.name}</div>
                                        {item.path && (
                                          <div className="text-xs text-muted-foreground truncate">{item.path}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <Button
                                        variant={itemStatus?.status === "working" ? "default" : "outline"}
                                        size="sm"
                                        className={
                                          itemStatus?.status === "working"
                                            ? "bg-green-600 hover:bg-green-700 h-7 w-7 p-0"
                                            : "h-7 w-7 p-0"
                                        }
                                        onClick={() => setItemStatus(item.id, "working")}
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant={itemStatus?.status === "not_working" ? "default" : "outline"}
                                        size="sm"
                                        className={
                                          itemStatus?.status === "not_working"
                                            ? "bg-red-600 hover:bg-red-700 h-7 w-7 p-0"
                                            : "h-7 w-7 p-0"
                                        }
                                        onClick={() => setItemStatus(item.id, "not_working")}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <Input
                                        placeholder="Notiz..."
                                        value={itemStatus?.notes || ""}
                                        onChange={(e) => setItemNotes(item.id, e.target.value)}
                                        className="h-7 w-32 text-xs"
                                      />
                                    </div>
                                  </div>
                                )
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test-Verlauf</CardTitle>
              <CardDescription>Alle gespeicherten Testläufe</CardDescription>
            </CardHeader>
            <CardContent>
              {testRuns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Noch keine Testläufe gespeichert</div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {testRuns.map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{run.name}</div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(run.created_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {run.created_by}
                            </span>
                            {run.ui_items_version && (
                              <Badge variant="outline" className="text-xs">
                                v{run.ui_items_version}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              {run.summary.working} OK
                            </Badge>
                            <Badge variant="outline" className="bg-red-500/10 text-red-600">
                              {run.summary.not_working} Fehler
                            </Badge>
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600">
                              {run.summary.untested} Offen
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => loadTestRun(run)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => setDeleteConfirmId(run.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuen Test starten</DialogTitle>
            <DialogDescription>
              Dies lädt die aktuelle UI-Items Liste aus dem System und setzt alle Testergebnisse zurück. Änderungen am
              aktuellen Test gehen verloren, wenn nicht gespeichert.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <RefreshCw className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">Aktuelle Version laden</div>
                <div className="text-sm text-muted-foreground">
                  Holt die neueste Liste aller Menu-Items aus der Anwendung
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isStartingNewTest}>
              Abbrechen
            </Button>
            <Button onClick={startNewTest} disabled={isStartingNewTest}>
              {isStartingNewTest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Lädt...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Neuen Test starten
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Test Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testlauf speichern</DialogTitle>
            <DialogDescription>
              Speichern Sie den aktuellen Test mit einem Namen für späteren Zugriff.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="testName">Testname</Label>
            <Input
              id="testName"
              value={testRunName}
              onChange={(e) => setTestRunName(e.target.value)}
              placeholder="z.B. Release 2.0 Test"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveTestRun} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              <Save className="h-4 w-4 mr-1" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Testlauf löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Testlauf wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteConfirmId && deleteTestRun(deleteConfirmId)}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
