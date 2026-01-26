"use client"

import { useState, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { BankTransaction, WorkflowCategory, CSVMapping, UploadStats, FilterType, TimeSpan, SortDirection } from "./types"

export function useBankAccount(practiceId: string) {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [workflowCategories, setWorkflowCategories] = useState<WorkflowCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // File upload states
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<string[][]>([])
  const [mapping, setMapping] = useState<CSVMapping>({
    dateIndex: 0,
    categoryIndex: 1,
    senderIndex: 2,
    descriptionIndex: 3,
    amountIndex: 4,
  })
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<keyof BankTransaction | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [filterType, setFilterType] = useState<FilterType>("all")
  const [timeSpan, setTimeSpan] = useState<TimeSpan>("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  
  // AI Analysis
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false)
  const [aiAnalysisResult, setAiAnalysisResult] = useState("")
  
  // Category dialog
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

  const fetchTransactions = async () => {
    if (!practiceId || practiceId === "0") {
      toast({
        title: "Fehler",
        description: "Keine gültige Praxis-ID gefunden.",
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
    if (!practiceId) return

    try {
      const response = await fetch(`/api/practices/${practiceId}/bank-transaction-categories`)
      if (response.ok) {
        const data = await response.json()
        setWorkflowCategories(data.filter((cat: WorkflowCategory) => cat.is_active !== false))
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
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

      setTransactions((prev) => prev.map((t) => (t.id === transactionId ? { ...t, category } : t)))
      toast({ title: "Erfolg", description: "Kategorie wurde aktualisiert" })
    } catch (error) {
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
              ? { ...cat, name: newCategoryName, color: newCategoryColor }
              : cat,
          ),
        )
        toast({ title: "Erfolg", description: "Kategorie wurde aktualisiert" })
      } else {
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
        toast({ title: "Erfolg", description: "Kategorie wurde erstellt" })
      }

      resetCategoryForm()
    } catch (error) {
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
      toast({ title: "Erfolg", description: "Kategorie wurde gelöscht" })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Kategorie konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = (category: { id: string; name: string; color: string; description?: string }) => {
    setEditingCategory({ ...category, description: category.description || "" })
    setNewCategoryName(category.name)
    setNewCategoryColor(category.color)
    setNewCategoryDescription(category.description || "")
    setShowCategoryDialog(true)
  }

  const resetCategoryForm = () => {
    setShowCategoryDialog(false)
    setNewCategoryName("")
    setNewCategoryColor("#3b82f6")
    setNewCategoryDescription("")
    setEditingCategory(null)
  }

  const handleDeleteAllTransactions = async () => {
    if (!confirm("Möchten Sie wirklich ALLE Transaktionen löschen?")) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/practices/${practiceId}/bank-transactions`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete transactions")

      setTransactions([])
      toast({ title: "Erfolg", description: "Alle Transaktionen wurden gelöscht" })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Transaktionen konnten nicht gelöscht werden",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
          else if (h.includes("empfänger") || h.includes("auftraggeber") || h.includes("name")) newMapping.senderIndex = i
          else if (h.includes("verwendungszweck") || h.includes("buchungstext")) newMapping.descriptionIndex = i
        })
        setMapping(newMapping)
      }
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parsePreview(selectedFile)
      setUploadStats(null)
    }
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

      const result = await response.json()

      if (response.ok) {
        setUploadStats(result)
        toast({
          title: "Upload erfolgreich",
          description: `${result.new} Transaktionen importiert${result.skipped > 0 ? `, ${result.skipped} übersprungen` : ""}.`,
        })
        setFile(null)
        setPreviewData([])
        await fetchTransactions()
      } else {
        throw new Error(result.error || "Upload fehlgeschlagen")
      }
    } catch (error) {
      toast({
        title: "Upload-Fehler",
        description: error instanceof Error ? error.message : "Interner Serverfehler",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
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
      if (!response.ok) throw new Error(data.error || "AI analysis failed")
      setAiAnalysisResult(data.analysis || "Analyse abgeschlossen.")
    } catch (error) {
      toast({
        title: "KI-Analyse fehlgeschlagen",
        description: error instanceof Error ? error.message : "Die KI-Analyse konnte nicht durchgeführt werden.",
        variant: "destructive",
      })
      setAiAnalysisResult("Die KI-Analyse ist in der Vorschau-Umgebung nicht verfügbar.")
    } finally {
      setAiAnalysisLoading(false)
    }
  }

  const handleSort = (column: keyof BankTransaction) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Computed values
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
    if (itemsPerPage === -1) return filteredAndSortedTransactions
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage])

  const totalPages = useMemo(() => {
    if (itemsPerPage === -1) return 1
    return Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  }, [filteredAndSortedTransactions.length, itemsPerPage])

  // Effects
  useEffect(() => {
    if (practiceId) {
      fetchTransactions()
      fetchWorkflowCategories()
    }
  }, [practiceId])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, timeSpan, sortColumn, sortDirection])

  return {
    // Data
    transactions,
    workflowCategories,
    filteredAndSortedTransactions,
    paginatedTransactions,
    totalPages,
    
    // Loading states
    loading,
    uploading,
    isLoading,
    
    // Filter/sort states
    searchQuery,
    setSearchQuery,
    sortColumn,
    sortDirection,
    filterType,
    setFilterType,
    timeSpan,
    setTimeSpan,
    
    // Pagination
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    
    // Upload states
    file,
    previewData,
    mapping,
    setMapping,
    uploadStats,
    setUploadStats,
    
    // AI Analysis
    showAiAnalysis,
    setShowAiAnalysis,
    aiAnalysisLoading,
    aiAnalysisResult,
    
    // Category dialog
    showCategoryDialog,
    setShowCategoryDialog,
    editingCategory,
    newCategoryName,
    setNewCategoryName,
    newCategoryColor,
    setNewCategoryColor,
    newCategoryDescription,
    setNewCategoryDescription,
    
    // Handlers
    fetchTransactions,
    updateTransactionCategory,
    handleSaveCategory,
    handleDeleteCategory,
    handleEditCategory,
    resetCategoryForm,
    handleDeleteAllTransactions,
    handleFileChange,
    handleUpload,
    handleAiAnalysis,
    handleSort,
  }
}
