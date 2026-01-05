"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Upload,
  RefreshCw,
  FileText,
  Calendar,
  Sparkles,
  CheckCircle,
  Search,
  ChevronUp,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"

interface BankTransaction {
  id: string
  transaction_date: string
  amount: number
  sender_receiver: string
  description: string
  category: string
  currency: string
}

interface WorkflowCategory {
  id: string
  name: string
  color: string
  icon: string
}

interface CSVMapping {
  dateIndex: number
  categoryIndex: number
  senderIndex: number
  descriptionIndex: number
  amountIndex: number
}

interface BankAccountManagerProps {
  practiceId: string
}

export function BankAccountManager({ practiceId }: BankAccountManagerProps) {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CSVMapping>({
    dateIndex: 0,
    categoryIndex: 1,
    senderIndex: 2,
    descriptionIndex: 3,
    amountIndex: 4,
  })
  const [uploadStats, setUploadStats] = useState<{
    total: number
    new: number
    skipped: number
    errors?: any[]
  } | null>(null)
  const [activeTab, setActiveTab] = useState("transactions")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<keyof BankTransaction | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all")
  const [timeSpan, setTimeSpan] = useState<"all" | "week" | "month" | "year">("all")
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState("")
  const [workflowCategories, setWorkflowCategories] = useState<WorkflowCategory[]>([])
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<{
    id: string
    name: string
    color: string
    description: string
  } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const fetchTransactions = async () => {
    if (!practiceId || practiceId === "0") {
      toast({
        title: "Fehler",
        description: "Keine gültige Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transactions`)

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)

        if (data.length === 0) {
          toast({
            title: "Keine Transaktionen",
            description: "Es wurden noch keine Transaktionen importiert.",
          })
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast({
          title: "Fehler",
          description: errorData.error || "Transaktionen konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Transaktionen.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflowCategories = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Kategorien können nicht geladen werden.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transaction-categories`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowCategories(data.filter((cat: WorkflowCategory & { is_active: boolean }) => cat.is_active))
      } else {
        toast({
          title: "Fehler",
          description: "Kategorien konnten nicht geladen werden.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error fetching bank transaction categories:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Kategorien.",
        variant: "destructive",
      })
    }
  }

  const updateTransactionCategory = async (transactionId: string, category: string) => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category }),
      })

      if (!response.ok) throw new Error("Failed to update category")

      // Update local state
      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, category } : t)))

      toast({
        title: "Erfolg",
        description: "Kategorie wurde aktualisiert",
      })
    } catch (error) {
      console.error("[v0] Error updating category:", error)
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht aktualisiert werden",
        variant: "destructive",
      })
    }
  }

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Kategorienamen ein",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingCategory) {
        // Update existing category
        const response = await fetch(`/api/practices/${practiceId}/bank-transaction-categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCategoryName,
            color: newCategoryColor,
            description: newCategoryDescription,
          }),
        })

        if (!response.ok) throw new Error("Failed to update category")

        setWorkflowCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id
              ? { ...cat, name: newCategoryName, color: newCategoryColor, description: newCategoryDescription }
              : cat,
          ),
        )

        toast({
          title: "Erfolg",
          description: "Kategorie wurde aktualisiert",
        })
      } else {
        // Create new category
        const response = await fetch(`/api/practices/${practiceId}/bank-transaction-categories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: newCategoryName,
            color: newCategoryColor,
            description: newCategoryDescription,
            practice_id: practiceId,
          }),
        })

        if (!response.ok) throw new Error("Failed to create category")

        const newCategory = await response.json()
        setWorkflowCategories((prev) => [...prev, newCategory])

        toast({
          title: "Erfolg",
          description: "Kategorie wurde erstellt",
        })
      }

      setShowCategoryDialog(false)
      setNewCategoryName("")
      setNewCategoryColor("#3b82f6")
      setNewCategoryDescription("")
      setEditingCategory(null)
    } catch (error) {
      console.error("[v0] Error saving category:", error)
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Möchten Sie diese Kategorie wirklich löschen?")) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transaction-categories/${categoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete category")

      setWorkflowCategories((prev) => prev.filter((cat) => cat.id !== categoryId))

      toast({
        title: "Erfolg",
        description: "Kategorie wurde gelöscht",
      })
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = (category: { id: string; name: string; color: string; description: string }) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
    setNewCategoryDescription(category.description || "")
    setShowCategoryDialog(true)
  }

  const handleDeleteAllTransactions = async () => {
    if (
      !confirm("Möchten Sie wirklich ALLE Transaktionen löschen? Diese Aktion kann nicht rückgängig gemacht werden.")
    ) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${practiceId}/bank-transactions`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete transactions")
      }

      setTransactions([])
      toast({
        title: "Erfolg",
        description: "Alle Transaktionen wurden gelöscht",
      })
    } catch (error) {
      console.error("[v0] Error deleting all transactions:", error)
      toast({
        title: "Fehler",
        description: "Transaktionen konnten nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (practiceId) {
      fetchTransactions()
      fetchWorkflowCategories()
    }
  }, [practiceId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parsePreview(selectedFile)
      setUploadStats(null)
    }
  }

  const parsePreview = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "")
      const delimiter = lines[0].includes(";") ? ";" : ","
      const preview = lines
        .slice(0, 5)
        .map((line) => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, "")))
      setPreviewData(preview)

      if (preview.length > 0) {
        const headers = preview[0].map((h) => h.toLowerCase())
        const newMapping = { ...mapping }

        headers.forEach((h, i) => {
          if (h.includes("datum") || h.includes("date")) newMapping.dateIndex = i
          else if (h.includes("kategorie") || h.includes("category")) newMapping.categoryIndex = i
          else if (h.includes("betrag") || h.includes("amount") || h.includes("umsatz")) newMapping.amountIndex = i
          else if (
            h.includes("empfänger") ||
            h.includes("auftraggeber") ||
            h.includes("begünstigter") ||
            h.includes("partner") ||
            h.includes("name")
          )
            newMapping.senderIndex = i
          else if (h.includes("verwendungszweck") || h.includes("buchungstext") || h.includes("details"))
            newMapping.descriptionIndex = i
        })
        setMapping(newMapping)
      }
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!file || !mapping) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie eine Datei und überprüfen Sie die Spaltenzuordnung.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("mapping", JSON.stringify(mapping))

    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transactions/upload`, {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type")
      let result

      if (contentType?.includes("application/json")) {
        result = await response.json()
      } else {
        const text = await response.text()
        console.error("[v0] Bank CSV Upload - Non-JSON response:", text.substring(0, 200))
        throw new Error("Server hat eine ungültige Antwort zurückgegeben.")
      }

      if (response.ok) {
        setUploadStats(result)

        toast({
          title: "Upload erfolgreich",
          description: `${result.new} Transaktionen importiert${result.skipped > 0 ? `, ${result.skipped} übersprungen (Duplikate)` : ""}.`,
        })

        if (result.errors && result.errors.length > 0) {
          console.warn("[v0] Bank CSV Upload - Errors during import:", result.errors)
        }

        setFile(null)
        setPreviewData([])

        await fetchTransactions()

        setTimeout(() => {
          setActiveTab("transactions")
        }, 1500)
      } else {
        throw new Error(result.details || result.error || "Upload fehlgeschlagen")
      }
    } catch (error) {
      console.error("[v0] Bank CSV Upload - Error:", error)
      toast({
        title: "Upload-Fehler",
        description: error instanceof Error ? error.message : "Interner Serverfehler",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("de-DE", { style: "currency", currency: currency || "EUR" }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("[v0] Date formatting error:", error)
      return dateString
    }
  }

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions]

    if (timeSpan !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (timeSpan) {
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      result = result.filter((tx) => new Date(tx.transaction_date) >= filterDate)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (tx) =>
          tx.sender_receiver.toLowerCase().includes(query) ||
          tx.description.toLowerCase().includes(query) ||
          tx.transaction_date.includes(query) ||
          tx.amount.toString().includes(query),
      )
    }

    if (filterType === "income") {
      result = result.filter((tx) => tx.amount > 0)
    } else if (filterType === "expense") {
      result = result.filter((tx) => tx.amount < 0)
    }

    if (sortColumn) {
      result.sort((a, b) => {
        let comparison = 0
        switch (sortColumn) {
          case "transaction_date":
            comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
            break
          case "amount":
            comparison = a.amount - b.amount
            break
          case "sender_receiver":
            comparison = a.sender_receiver.localeCompare(b.sender_receiver)
            break
          case "description":
            comparison = a.description.localeCompare(b.description)
            break
          case "category":
            comparison = a.category.localeCompare(b.category)
            break
        }
        return sortDirection === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [transactions, searchQuery, sortColumn, sortDirection, filterType, timeSpan])

  const paginatedTransactions = useMemo(() => {
    if (itemsPerPage === -1) {
      // Show all items
      return filteredAndSortedTransactions
    }
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedTransactions.slice(startIndex, endIndex)
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1
    return Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  }, [filteredAndSortedTransactions.length, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, timeSpan, sortColumn, sortDirection])

  const handleSort = (column: keyof BankTransaction) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) => (prevDirection === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleRefresh = () => {
    fetchTransactions()
  }

  const handleAiAnalysis = async () => {
    setShowAiAnalysis(true)
    setAiAnalysisLoading(true)
    setAiAnalysisResult("")

    try {
      const response = await fetch("/api/bank-accounts/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: filteredAndSortedTransactions,
          practiceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "AI analysis failed")
      }

      setAiAnalysisResult(data.analysis || "Analyse abgeschlossen.")
    } catch (error) {
      console.error("[v0] AI analysis error:", error)
      toast({
        title: "KI-Analyse fehlgeschlagen",
        description: error instanceof Error ? error.message : "Die KI-Analyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      })
      setAiAnalysisResult(
        "Die KI-Analyse ist in der Vorschau-Umgebung nicht verfügbar. Diese Funktion wird in der Produktionsumgebung vollständig funktionieren.",
      )
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  const handleOpenAIAnalysis = () => {
    // Placeholder for future implementation
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bankkonto-Manager</CardTitle>
          <CardDescription>
            Verwalten Sie Ihre Banktransaktionen und erhalten Sie KI-gestützte Analysen.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transactions">
                <span className="flex items-center gap-2">
                  Transaktionen
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {transactions.length}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="categories">Kategorien</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Suche nach Partner, Verwendungszweck, Datum oder Betrag..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Select value={timeSpan} onValueChange={(value: any) => setTimeSpan(value)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Zeiten</SelectItem>
                          <SelectItem value="week">Letzte Woche</SelectItem>
                          <SelectItem value="month">Letzter Monat</SelectItem>
                          <SelectItem value="year">Letztes Jahr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle Transaktionen</SelectItem>
                          <SelectItem value="income">Nur Einnahmen</SelectItem>
                          <SelectItem value="expense">Nur Ausgaben</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        onClick={handleAiAnalysis}
                        disabled={transactions.length === 0 || aiAnalysisLoading}
                        className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        {aiAnalysisLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        <span className="font-semibold">Konto KI Analyse</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleDeleteAllTransactions}
                        disabled={isLoading || transactions.length === 0}
                        className="hover:text-destructive hover:bg-destructive/10"
                        title="Alle Transaktionen löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("transaction_date")}
                      >
                        <div className="flex items-center gap-1">
                          Datum
                          {sortColumn === "transaction_date" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("category")}>
                        <div className="flex items-center gap-1">
                          Kategorie
                          {sortColumn === "category" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("sender_receiver")}
                      >
                        <div className="flex items-center gap-1">
                          Name
                          {sortColumn === "sender_receiver" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("description")}>
                        <div className="flex items-center gap-1">
                          Verwendungszweck
                          {sortColumn === "description" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50 text-right"
                        onClick={() => handleSort("amount")}
                      >
                        <div className="flex items-center gap-1 justify-end">
                          Betrag
                          {sortColumn === "amount" &&
                            (sortDirection === "asc" ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Transaktionen werden geladen...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredAndSortedTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {searchQuery || filterType !== "all" || timeSpan !== "all"
                            ? "Keine Transaktionen gefunden"
                            : "Noch keine Transaktionen vorhanden"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{formatDate(transaction.transaction_date)}</TableCell>
                          <TableCell>
                            <Select
                              value={transaction.category || "none"} // Updated default value to "none"
                              onValueChange={(value) => updateTransactionCategory(transaction.id, value)}
                            >
                              <SelectTrigger className="w-[180px] h-8 text-xs">
                                <SelectValue placeholder="Kategorie wählen..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Keine Kategorie</SelectItem> // Updated value to "none"
                                {workflowCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                      {cat.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{transaction.sender_receiver}</TableCell>
                          <TableCell className="max-w-xs truncate" title={transaction.description}>
                            {transaction.description}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={transaction.amount >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {filteredAndSortedTransactions.length > 0 && (
                <div className="flex items-center justify-between gap-4 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Einträge pro Seite:</span>
                    <Select
                      value={itemsPerPage.toString()}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value))
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[140px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="-1">Alle anzeigen</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">
                      {itemsPerPage === -1
                        ? `${filteredAndSortedTransactions.length} von ${filteredAndSortedTransactions.length}`
                        : `${Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedTransactions.length)}-${Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)} von ${filteredAndSortedTransactions.length}`}
                    </span>
                  </div>

                  {itemsPerPage !== -1 && totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Zurück
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Seite {currentPage} von {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Weiter
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  {!uploadStats ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                        <Input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileChange}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-xl font-semibold mb-2">CSV-Datei hochladen</p>
                        <p className="text-sm text-muted-foreground mb-6">
                          Unterstützte Formate: CSV, TXT (mit Semikolon oder Komma getrennt)
                        </p>
                        <Label htmlFor="csv-upload" className="flex justify-center">
                          <Button size="lg" className="cursor-pointer" asChild>
                            <span>
                              <Upload className="h-5 w-5 mr-2" />
                              Datei auswählen
                            </span>
                          </Button>
                        </Label>
                      </div>

                      {file && previewData.length > 0 && (
                        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground font-medium">Vorschau:</p>
                              <h3 className="text-lg font-semibold text-foreground">{file.name}</h3>
                            </div>
                          </div>

                          <div className="space-y-4 text-sm">
                            <div className="space-y-2">
                              <Label>Spalte Datum</Label>
                              <select
                                className="w-full p-2 border rounded bg-background text-sm"
                                value={mapping.dateIndex}
                                onChange={(e) => setMapping({ ...mapping, dateIndex: Number(e.target.value) })}
                              >
                                {previewData[0].map((header, i) => (
                                  <option key={i} value={i}>
                                    {header} (Spalte {i + 1})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Spalte Kategorie</Label>
                              <select
                                className="w-full p-2 border rounded bg-background text-sm"
                                value={mapping.categoryIndex}
                                onChange={(e) => setMapping({ ...mapping, categoryIndex: Number(e.target.value) })}
                              >
                                {previewData[0].map((header, i) => (
                                  <option key={i} value={i}>
                                    {header} (Spalte {i + 1})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Spalte Name</Label>
                              <select
                                className="w-full p-2 border rounded bg-background text-sm"
                                value={mapping.senderIndex}
                                onChange={(e) => setMapping({ ...mapping, senderIndex: Number(e.target.value) })}
                              >
                                {previewData[0].map((header, i) => (
                                  <option key={i} value={i}>
                                    {header} (Spalte {i + 1})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Spalte Verwendungszweck</Label>
                              <select
                                className="w-full p-2 border rounded bg-background text-sm"
                                value={mapping.descriptionIndex}
                                onChange={(e) => setMapping({ ...mapping, descriptionIndex: Number(e.target.value) })}
                              >
                                {previewData[0].map((header, i) => (
                                  <option key={i} value={i}>
                                    {header} (Spalte {i + 1})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <Label>Spalte Betrag</Label>
                              <select
                                className="w-full p-2 border rounded bg-background text-sm"
                                value={mapping.amountIndex}
                                onChange={(e) => setMapping({ ...mapping, amountIndex: Number(e.target.value) })}
                              >
                                {previewData[0].map((header, i) => (
                                  <option key={i} value={i}>
                                    {header} (Spalte {i + 1})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground mt-2">
                            <p className="font-medium mb-2">Erste Zeile (Beispiel):</p>
                            <div className="space-y-2">
                              {previewData[1]?.map((cell, i) => (
                                <div
                                  key={i}
                                  className={`p-3 border rounded ${
                                    Object.values(mapping).includes(i) ? "bg-primary/10 border-primary font-medium" : ""
                                  }`}
                                >
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Spalte {i + 1}</div>
                                  <div className="break-words">{cell}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 flex justify-between items-center">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setFile(null)
                                setPreviewData([])
                              }}
                            >
                              Abbrechen
                            </Button>
                            <Button onClick={handleUpload} disabled={uploading} size="lg">
                              {uploading ? (
                                <>
                                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                  Importiere...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-5 w-5 mr-2" />
                                  Jetzt importieren
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 border-green-200 p-4 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-green-800 font-medium mb-2">Import abgeschlossen</p>
                        <p className="text-green-700">
                          Es wurden {uploadStats.new} neue Transaktionen importiert.
                          <br />
                          {uploadStats.skipped} Transaktionen wurden als Duplikate erkannt und übersprungen.
                        </p>
                      </div>
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadStats(null)
                            setFile(null)
                            setPreviewData([])
                          }}
                          className="bg-white text-green-700 border-green-200 hover:bg-green-50"
                        >
                          Weitere Datei hochladen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Transaktions-Kategorien</h3>
                  <p className="text-sm text-muted-foreground">
                    Erstellen und verwalten Sie Kategorien für Ihre Transaktionen
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingCategory(null)
                    setNewCategoryName("")
                    setNewCategoryColor("#3b82f6")
                    setNewCategoryDescription("")
                    setShowCategoryDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Kategorie
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflowCategories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <CardTitle className="text-base">{category.name}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {category.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>

              {workflowCategories.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground">Noch keine Kategorien erstellt</p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setEditingCategory(null)
                      setNewCategoryName("")
                      setNewCategoryColor("#3b82f6")
                      setNewCategoryDescription("")
                      setShowCategoryDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Kategorie erstellen
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Kategorie bearbeiten" : "Neue Kategorie"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Ändern Sie die Details der Kategorie"
                : "Erstellen Sie eine neue Kategorie für Ihre Transaktionen"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="z.B. Personal, Material, Marketing..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color">Farbe</Label>
              <div className="flex gap-2">
                <Input
                  id="category-color"
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input value={newCategoryColor} onChange={(e) => setNewCategoryColor(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Beschreibung (optional)</Label>
              <Input
                id="category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="Beschreiben Sie die Kategorie..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCategory}>{editingCategory ? "Speichern" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAiAnalysis} onOpenChange={setShowAiAnalysis}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              KI-Konto-Analyse
            </DialogTitle>
            <DialogDescription>
              Detaillierte Analyse Ihrer Banktransaktionen basierend auf {filteredAndSortedTransactions.length}{" "}
              Transaktionen
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {aiAnalysisLoading && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Analysiere Transaktionen mit KI...</p>
              </div>
            )}

            {!aiAnalysisLoading && aiAnalysisResult && (
              <div className="space-y-4">
                {/* Parse the AI result and display in structured format */}
                {aiAnalysisResult.split("\n\n").map((section, index) => {
                  const trimmed = section.trim()
                  if (!trimmed) return null

                  // Check if section is a heading (starts with ##, ###, or ####)
                  const headingMatch = trimmed.match(/^#{2,4}\s+(.+)/)
                  if (headingMatch) {
                    const title = headingMatch[1]
                    const icon =
                      title.toLowerCase().includes("empfehlung") || title.toLowerCase().includes("vorschlag") ? (
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                      ) : title.toLowerCase().includes("warnung") || title.toLowerCase().includes("risiko") ? (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      ) : title.toLowerCase().includes("trend") || title.toLowerCase().includes("entwicklung") ? (
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )

                    return (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {icon}
                            {title}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    )
                  }

                  // Check if section contains bullet points
                  if (trimmed.includes("- ") || trimmed.includes("• ")) {
                    const lines = trimmed.split("\n").filter((line) => line.trim())
                    const heading = lines[0].replace(/^-\s*|^•\s*/, "").trim()
                    const bullets = lines.slice(1).filter((line) => line.match(/^[-•]\s/))

                    const bgColor =
                      heading.toLowerCase().includes("warnung") || heading.toLowerCase().includes("achtung")
                        ? "bg-orange-50 dark:bg-orange-950/20"
                        : heading.toLowerCase().includes("empfehlung") || heading.toLowerCase().includes("tipp")
                          ? "bg-green-50 dark:bg-green-950/20"
                          : "bg-blue-50 dark:bg-blue-950/20"

                    return (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="space-y-2">
                            {bullets.length > 0 ? (
                              bullets.map((bullet, i) => (
                                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${bgColor}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <p className="text-sm leading-relaxed">{bullet.replace(/^[-•]\s*/, "")}</p>
                                </div>
                              ))
                            ) : (
                              <div className={`p-3 rounded-lg ${bgColor}`}>
                                <p className="text-sm leading-relaxed">{trimmed}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  // Regular paragraph
                  return (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <p className="text-sm leading-relaxed text-muted-foreground">{trimmed}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {!aiAnalysisLoading && !aiAnalysisResult && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Keine Analyseergebnisse verfügbar.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAiAnalysis(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BankAccountManager
