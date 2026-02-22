"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTranslation } from "@/contexts/translation-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColorPicker } from "@/components/color-picker"
import { useRouter } from "next/navigation"
import {
  Upload,
  FolderPlus,
  Search,
  FileText,
  Folder,
  MoreVertical,
  Download,
  Edit,
  ChevronRight,
  Home,
  Eye,
  Sparkles,
  List,
  Grid3x3,
  Columns3,
  X,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { DocumentPermissionsDialog } from "@/components/document-permissions-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AIFolderAnalysisDialog } from "@/components/ai-folder-analysis-dialog"
import { useAiEnabled } from "@/lib/hooks/use-ai-enabled"

interface Document {
  id: string
  name: string
  description: string | null
  file_url: string
  file_type: string
  file_size: number
  folder_id: string | null
  created_by: string
  created_by_name?: string // Added for display purposes
  created_by_at: string // Fixed typo from created_at to created_by_at
  tags: string[]
  version: number
  ai_analysis: any // Adjust type as needed
  is_folder?: boolean // Added to distinguish folders if they are also in the document list
}

interface DocumentFolder {
  id: string
  name: string
  description: string | null
  parent_folder_id: string | null
  color: string
  created_at: string
  created_by_name?: string // Added for display purposes
  is_system_folder?: boolean
}

export function DocumentsManager() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { t } = useTranslation()
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [allDocuments, setAllDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<DocumentFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<DocumentFolder[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // CHANGE: Set initial loading to true to prevent content flash on mount

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [uploadFormData, setUploadFormData] = useState({
    name: "",
    description: "",
    files: [] as File[],
    folder_id: null as string | null,
    analyzeWithAI: false,
  })
  const [folderFormData, setFolderFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  })
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [folderPermissions, setFolderPermissions] = useState<
    Array<{
      type: "user" | "team"
      id: string
      name: string
      level: "view" | "edit" | "admin"
    }>
  >([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [selectedPermissionType, setSelectedPermissionType] = useState<"user" | "team">("user")
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("")
  const [selectedPermissionLevel, setSelectedPermissionLevel] = useState<"view" | "edit" | "admin">("view")

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [analyzingDocumentId, setAnalyzingDocumentId] = useState<string | null>(null) // Added state for tracking AI analysis
  const [isAIResultDialogOpen, setIsAIResultDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [customFolderOrder, setCustomFolderOrder] = useState<string[]>([])

  // AI Folder analysis state
  const [isAIFolderAnalysisOpen, setIsAIFolderAnalysisOpen] = useState(false)
  const [folderAnalysis, setFolderAnalysis] = useState<string | null>(null)
  const [folderAnalysisStats, setFolderAnalysisStats] = useState<{
    totalDocuments: number
    totalFolders: number
  } | null>(null)
  const [isAnalyzingFolder, setIsAnalyzingFolder] = useState(false)

  const [dragActive, setDragActive] = useState(false)

  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null) // Added ref for file input
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false) // Added state for controlling new folder dialog

  const { isAiEnabled } = useAiEnabled()

  const handleFolderDragStart = (e: React.DragEvent, folderId: string) => {
    setDraggingFolderId(folderId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    if (draggingFolderId && draggingFolderId !== folderId) {
      setDragOverFolderId(folderId)
    }
  }

  const handleFolderDragLeave = () => {
    setDragOverFolderId(null)
  }

  const handleFolderDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    if (!draggingFolderId || draggingFolderId === targetFolderId) return

    const currentOrder = customFolderOrder.length > 0 ? customFolderOrder : folders.map((f) => f.id)
    const dragIndex = currentOrder.indexOf(draggingFolderId)
    const dropIndex = currentOrder.indexOf(targetFolderId)

    const newOrder = [...currentOrder]
    newOrder.splice(dragIndex, 1)
    newOrder.splice(dropIndex, 0, draggingFolderId)

    setCustomFolderOrder(newOrder)
    setDraggingFolderId(null)
    setDragOverFolderId(null)

    toast.success("Ordnerreihenfolge aktualisiert")
  }

  const baseFolders =
    isEditMode && customFolderOrder.length > 0
      ? (customFolderOrder.map((id) => folders.find((f) => f.id === id)).filter(Boolean) as DocumentFolder[])
      : folders

  // When searching, filter folders by name too
  const displayFolders = searchQuery.trim()
    ? baseFolders.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : baseFolders

  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    documentId: string
    documentName: string
    summary: string
    documentType: string
    keyPoints: string[]
    categories: string[]
    tags: string[]
    detectedEntities: {
      dates: string[]
      amounts: string[]
      names: string[]
    }
    recommendations: string[]
    relevanceScore: number
  } | null>(null)

  const [editedAIResult, setEditedAIResult] = useState<{
    documentId: string // Added documentId to editedAIResult
    documentName: string // Added documentName to editedAIResult
    summary: string
    documentType: string
    keyPoints: string[]
    categories: string[]
    tags: string[]
    detectedEntities: {
      dates: string[]
      amounts: string[]
      names: string[]
    }
    relevanceScore: number
    recommendations: string[]
  } | null>(null)

  const [newKeyPoint, setNewKeyPoint] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newTag, setNewTag] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newAmount, setNewAmount] = useState("")
  const [newName, setNewName] = useState("")
  const [newRecommendation, setNewRecommendation] = useState("")

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false)
  const [documentToMove, setDocumentToMove] = useState<Document | null>(null)
  const [selectedMoveFolder, setSelectedMoveFolder] = useState<string | null>(null)

  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("name-asc")
  const [viewMode, setViewMode] = useState<"grid" | "list" | "finder">("grid")

  const [hasCheckedDefaultFolders, setHasCheckedDefaultFolders] = useState(false)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setUploadFormData((prev) => ({ ...prev, files }))
      setIsUploadDialogOpen(true)
    }
  }

  const handleViewAIAnalysis = (doc: Document) => {
    if (!doc.ai_analysis) return

    const analysis = doc.ai_analysis as {
      summary: string
      documentType: string
      keyPoints: string[]
      categories: string[]
      tags: string[]
      detectedEntities: {
        dates: string[]
        amounts: string[]
        names: string[]
      }
      recommendations: string[]
      relevanceScore: number
    }

    setAiAnalysisResult({
      documentId: doc.id,
      documentName: doc.name,
      summary: analysis.summary,
      documentType: analysis.documentType,
      keyPoints: analysis.keyPoints,
      categories: analysis.categories,
      tags: analysis.tags,
      detectedEntities: analysis.detectedEntities,
      recommendations: analysis.recommendations,
      relevanceScore: analysis.relevanceScore,
    })
    setEditedAIResult({
      documentId: doc.id,
      documentName: doc.name,
      summary: analysis.summary,
      documentType: analysis.documentType,
      keyPoints: analysis.keyPoints,
      categories: analysis.categories,
      tags: analysis.tags,
      detectedEntities: analysis.detectedEntities,
      recommendations: analysis.recommendations,
      relevanceScore: analysis.relevanceScore,
    })
    setIsEditMode(false)
    setIsAIResultDialogOpen(true)
  }

  // CHANGE: Simplified initial data fetch with proper loading state management
  useEffect(() => {
    const loadInitialData = async () => {
      if (!currentPractice?.id) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        await Promise.all([fetchDocuments(), fetchFolders(), fetchAllDocuments(), fetchUsersAndTeams()])
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [currentPractice?.id])

  // CHANGE: Separate effect for folder navigation (no loading overlay)
  useEffect(() => {
    if (currentPractice?.id && currentFolderId !== null) {
      fetchDocuments()
      fetchFolders()
    }
  }, [currentFolderId])

  const fetchDocuments = async () => {
    if (!currentPractice?.id) return
    try {
      // CHANGE: Only show loading overlay on subsequent fetches, not initial load
      const params = new URLSearchParams({
        practiceId: currentPractice!.id,
        ...(currentFolderId && { folderId: currentFolderId }),
      })
      const response = await fetch(`/api/practices/${currentPractice!.id}/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Augment data with created_by_name
        const documentsWithNames = await Promise.all(
          data.map(async (doc: Document) => {
            // Potentially fetch user/team names here if not available from API
            // For now, assuming it's not directly available and keeping it simple
            return { ...doc, created_by_name: doc.created_by } // Placeholder
          }),
        )
        setDocuments(documentsWithNames)
        console.log("[SERVER]", "[v0] Documents fetched successfully:", data.length, "documents")
      } else {
        console.error("Failed to fetch documents:", response.statusText)
        toast.error(t("documents.errors.fetchFailed", "Fehler beim Abrufen der Dokumente"))
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast.error(t("documents.errors.fetchFailed", "Fehler beim Abrufen der Dokumente"))
    }
  }

  const fetchAllDocuments = async () => {
    if (!currentPractice?.id) return
    try {
      const params = new URLSearchParams({
        practiceId: currentPractice!.id,
        all: "true",
      })
      const response = await fetch(`/api/practices/${currentPractice!.id}/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAllDocuments(data)
      } else {
        throw new Error(`Failed to fetch all documents: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching all documents:", error)
      toast.error(t("documents.errors.fetchAllFailed", "Fehler beim Abrufen aller Dokumente"))
    }
  }

  const fetchFolders = async () => {
    if (!currentPractice?.id) return
    try {
      const params = new URLSearchParams({
        practiceId: currentPractice!.id,
        ...(currentFolderId && { parentId: currentFolderId }),
      })
      const response = await fetch(`/api/practices/${currentPractice!.id}/document-folders?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Augment data with created_by_name
        const foldersWithNames = await Promise.all(
          data.map(async (folder: DocumentFolder) => {
            // Potentially fetch user/team names here if not available from API
            return { ...folder, created_by_name: folder.id } // Placeholder
          }),
        )
        setFolders(foldersWithNames)
      } else {
        throw new Error(`Failed to fetch folders: ${response.statusText}`)
      }
    } catch (error) {
      console.error("Error fetching folders:", error)
      toast.error(t("documents.errors.fetchFoldersFailed", "Fehler beim Abrufen der Ordner"))
    }
  }

  const fetchUsersAndTeams = async () => {
    if (!currentPractice?.id) return

    try {
      const [usersRes, teamsRes] = await Promise.all([
        fetch(`/api/practices/${currentPractice.id}/users`),
        fetch(`/api/practices/${currentPractice.id}/teams`),
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      } else {
        console.error("Failed to fetch users:", usersRes.statusText)
        toast.error(t("documents.errors.fetchUsersFailed", "Fehler beim Abrufen der Benutzer"))
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      } else {
        console.error("Failed to fetch teams:", teamsRes.statusText)
        toast.error(t("documents.errors.fetchTeamsFailed", "Fehler beim Abrufen der Teams"))
      }
    } catch (error) {
      console.error("Error fetching users and teams:", error)
      toast.error(t("documents.errors.fetchUsersAndTeamsFailed", "Fehler beim Abrufen von Benutzern und Teams"))
    }
  }

  const handleUploadDocument = async () => {
    if (uploadFormData.files.length === 0 || !currentPractice?.id || !currentUser?.id) {
      if (uploadFormData.files.length === 0) toast.error("Bitte wählen Sie mindestens eine Datei aus.")
      if (!currentPractice?.id) toast.error("Keine Praxis ausgewählt.")
      if (!currentUser?.id) toast.error("Benutzer ist nicht angemeldet.")
      return
    }

    setIsUploading(true)
    let successCount = 0

    try {
      const { compressImageIfLarge } = await import("@/lib/image-compression")
      for (const file of uploadFormData.files) {
        try {
          const processedFile = file.type.startsWith("image/") ? await compressImageIfLarge(file) : file
          const formData = new FormData()
          formData.append("file", processedFile)

          const uploadResponse = await fetch(`/api/practices/${currentPractice.id}/upload`, {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text()
            throw new Error(errorText || "Fehler beim Hochladen der Datei")
          }

          const { url: blobUrl } = await uploadResponse.json()

          let aiAnalysis = null
          if (uploadFormData.analyzeWithAI) {
            try {
              const analysisResponse = await fetch("/api/analyze-document", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  fileUrl: blobUrl,
                  fileName: file.name,
                  fileType: file.type,
                }),
              })

              if (analysisResponse.ok) {
                aiAnalysis = await analysisResponse.json()
              } else {
                console.error("AI analysis failed for file:", file.name, await analysisResponse.text())
                toast.warning(`KI-Analyse für ${file.name} fehlgeschlagen.`)
              }
            } catch (error) {
              console.error("Error during AI analysis call:", error)
              toast.warning(
                `Fehler bei der KI-Analyse für ${file.name}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
              )
            }
          }

          const response = await fetch(`/api/practices/${currentPractice.id}/documents`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: uploadFormData.name || file.name,
              description: uploadFormData.description,
              file_url: blobUrl,
              file_type: file.type,
              file_size: file.size,
              folder_id: uploadFormData.folder_id,
              created_by: currentUser.id,
              ai_analysis: aiAnalysis,
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Fehler beim Erstellen des Dokuments ${file.name}: ${errorText}`)
          }

          successCount++
        } catch (error) {
          console.error(`Error processing file: ${file.name}`, error)
          toast.error(`${file.name}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`)
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} von ${uploadFormData.files.length} Datei(en) erfolgreich hochgeladen`)
        setIsUploadDialogOpen(false)
        setUploadFormData({ name: "", description: "", files: [], folder_id: null, analyzeWithAI: false })
        await fetchDocuments()
        await fetchAllDocuments() // Fetch all documents again after upload
      } else if (uploadFormData.files.length > 0) {
        toast.error("Keine Dateien erfolgreich hochgeladen.")
      }
    } catch (error) {
      console.error("Error in handleUploadDocument:", error)
      toast.error(error instanceof Error ? error.message : "Unbekannter Fehler beim Hochladen")
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!folderFormData.name || !currentPractice?.id || !currentUser?.id) {
      if (!folderFormData.name) {
        toast.error("Der Ordnername ist erforderlich.")
      } else if (!currentPractice?.id) {
        toast.error("Keine Praxis ausgewählt.")
      } else if (!currentUser?.id) {
        toast.error("Benutzer nicht authentifiziert.")
      }
      return
    }

    try {
      const isEditing = editingFolderId !== null
      const url = isEditing
        ? `/api/practices/${currentPractice.id}/document-folders/${editingFolderId}`
        : `/api/practices/${currentPractice.id}/document-folders`
      const method = isEditing ? "PATCH" : "POST"

      const folderData = {
        practice_id: currentPractice.id,
        name: folderFormData.name,
        description: folderFormData.description,
        parent_folder_id: currentFolderId, // Create folder in the current directory
        color: folderFormData.color,
        created_by: currentUser.id,
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(folderData),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || "Fehler beim Speichern des Ordners")
      }

      toast.success(isEditing ? "Ordner erfolgreich aktualisiert" : "Ordner erfolgreich erstellt")
      setIsFolderDialogOpen(false)
      setShowNewFolderDialog(false) // Close the new folder dialog as well
      setFolderFormData({ name: "", description: "", color: "#3b82f6" })
      setEditingFolderId(null)
      fetchFolders() // Refresh folders in the current view
      if (isEditing) {
        // If editing a folder, we might need to update the folder path if the current folder was edited
        // However, simple refresh is usually sufficient. If it's the root folder, no path change.
        // If editing a subfolder, the path remains correct.
      } else {
        // If creating a new folder, refresh the path if the new folder is in the current path
        // This is handled by navigating into it later if needed.
      }
    } catch (error) {
      console.error("Error saving folder:", error)
      toast.error(error instanceof Error ? error.message : "Interner Serverfehler")
    }
  }

  const handleEditFolder = (folder: DocumentFolder) => {
    setEditingFolderId(folder.id)
    setFolderFormData({
      name: folder.name,
      description: folder.description || "",
      color: folder.color || "#3b82f6",
    })
    setIsFolderDialogOpen(true)
  }

  const handleDeleteFolder = async (folderId: string) => {
    if (!currentPractice?.id) return

    const folderToDelete = folders.find((f) => f.id === folderId)
    if (folderToDelete?.is_system_folder) {
      toast.error("Systemordner können nicht gelöscht werden")
      return
    }

    if (
      !confirm(
        "Sind Sie sicher, dass Sie diesen Ordner löschen möchten? Alle Dokumente darin werden ebenfalls gelöscht.",
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/document-folders/${folderId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Fehler beim Löschen des Ordners")
      }

      toast.success("Ordner erfolgreich gelöscht")
      fetchFolders() // Refresh current view
      fetchDocuments() // Refresh documents in current view
      await fetchAllDocuments() // Fetch all documents again after folder deletion
      // If the deleted folder was the current folder, navigate to its parent
      if (currentFolderId === folderId) {
        handleNavigateToPathFolder(folderPath.length - 2) // Navigate to parent
      }
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast.error("Fehler beim Löschen des Ordners")
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm(t("documents.delete.confirm", "Sind Sie sicher, dass Sie dieses Dokument löschen möchten?"))) return

    try {
      const response = await fetch(`/api/practices/${currentPractice!.id}/documents/${documentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success(t("documents.delete.success", "Dokument erfolgreich gelöscht"))
        fetchDocuments()
        await fetchAllDocuments() // Fetch all documents again after document deletion
      } else {
        const errorText = await response.text()
        throw new Error(errorText || "Fehler beim Löschen des Dokuments")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast.error(t("documents.delete.error", "Fehler beim Löschen des Dokuments"))
    }
  }

  const handleManageDocumentPermissions = (documentId: string) => {
    setSelectedDocumentId(documentId)
    setSelectedFolderId(null)
    fetchUsersAndTeams() // Ensure users and teams are up-to-date
    setIsPermissionsDialogOpen(true)
  }

  const handleManageFolderPermissions = (folderId: string) => {
    setSelectedFolderId(folderId)
    setSelectedDocumentId(null)
    fetchUsersAndTeams() // Ensure users and teams are up-to-date
    setIsPermissionsDialogOpen(true)
  }

  const handleAddFolderPermission = () => {
    if (!selectedPermissionId || !currentPractice?.id) return

    const selectedItem =
      selectedPermissionType === "user"
        ? users.find((u) => u.id === selectedPermissionId)
        : teams.find((t) => t.id === selectedPermissionId)

    if (!selectedItem) return

    if (folderPermissions.some((p) => p.id === selectedPermissionId && p.type === selectedPermissionType)) {
      toast.error(t("documents.permissions.alreadyExists", "Berechtigung bereits vorhanden"))
      return
    }

    setFolderPermissions([
      ...folderPermissions,
      {
        type: selectedPermissionType,
        id: selectedPermissionId,
        name: "name" in selectedItem ? selectedItem.name : "",
        level: selectedPermissionLevel,
      },
    ])

    setSelectedPermissionId("")
  }

  const handleRemoveFolderPermission = (id: string, type: "user" | "team") => {
    setFolderPermissions(folderPermissions.filter((p) => !(p.id === id && p.type === type)))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleNavigateToFolder = (folder: DocumentFolder) => {
    setFolderPath([...folderPath, folder])
    setCurrentFolderId(folder.id)
  }

  const handleNavigateToRoot = () => {
    setFolderPath([])
    setCurrentFolderId(null)
  }

  // This function counts files recursively, assuming allDocuments is up-to-date
  const getRecursiveFileCount = (folderId: string | null): number => {
    if (!allDocuments) return 0

    let count = 0
    for (const doc of allDocuments) {
      if (doc.folder_id === folderId && !doc.is_folder) {
        count++
      }
      // Recursively count files in subfolders, but only if `doc` is considered a folder
      // This requires a clear distinction between documents and folders within allDocuments
      // For now, assuming is_folder flag is set correctly if folders are included in allDocuments
      if (doc.is_folder && doc.folder_id === folderId) {
        count += getRecursiveFileCount(doc.id)
      }
    }
    return count
  }

  const getSubfolderCount = (folderId: string): number => {
    return folders.filter((f) => f.parent_folder_id === folderId).length
  }

  const handleNavigateToPathFolder = (index: number) => {
    const newPath = folderPath.slice(0, index + 1)
    setFolderPath(newPath)
    setCurrentFolderId(newPath[newPath.length - 1]?.id || null)
  }

  // When searching, search across ALL documents; otherwise only current folder
  const searchSource = searchQuery.trim() ? allDocuments : documents

  const filteredDocuments = searchSource
    .filter((doc) => {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        !query ||
        doc.name.toLowerCase().includes(query) ||
        (doc.description && doc.description.toLowerCase().includes(query)) ||
        (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(query)))
      const matchesType =
        fileTypeFilter === "all" ||
        (fileTypeFilter === "pdf" && doc.file_type === "application/pdf") ||
        (fileTypeFilter === "doc" && (doc.file_type.includes("word") || doc.file_type.includes("document"))) ||
        (fileTypeFilter === "xls" && (doc.file_type.includes("sheet") || doc.file_type.includes("excel"))) ||
        (fileTypeFilter === "image" && doc.file_type.startsWith("image/"))
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name)
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "date-asc":
          // Ensure created_at is available for sorting, fall back if not
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateA - dateB
        case "date-desc":
          const dateDescA = a.created_at ? new Date(a.created_at).getTime() : 0
          const dateDescB = b.created_at ? new Date(b.created_at).getTime() : 0
          return dateDescB - dateDescA
        case "size-asc":
          return a.file_size - b.file_size
        case "size-desc":
          return b.file_size - a.file_size
        default:
          return 0
      }
    })

  const handleOpenUploadDialog = () => {
    setUploadFormData({
      name: "",
      description: "",
      files: [],
      folder_id: currentFolderId, // Default to current folder
      analyzeWithAI: false,
    })
    setIsUploadDialogOpen(true)
  }

  const handleUploadToFolder = (folderId: string) => {
    setUploadFormData({
      name: "",
      description: "",
      files: [],
      folder_id: folderId,
      analyzeWithAI: false,
    })
    setIsUploadDialogOpen(true)
  }

  const handlePreviewDocument = async (doc: Document) => {
    setPreviewDocument(doc)
    setPreviewBlobUrl(null)
    setIsPreviewDialogOpen(true)

    // Fetch PDF/document as blob to bypass X-Frame-Options restrictions
    if (doc.file_type === "application/pdf" && doc.file_url) {
      setIsLoadingPreview(true)
      try {
        const response = await fetch(doc.file_url)
        const blob = await response.blob()
        const blobUrl = URL.createObjectURL(blob)
        setPreviewBlobUrl(blobUrl)
      } catch (error) {
        console.error("Error loading preview:", error)
      } finally {
        setIsLoadingPreview(false)
      }
    }
  }

  // Cleanup blob URLs when preview closes
  useEffect(() => {
    if (!isPreviewDialogOpen && previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl)
      setPreviewBlobUrl(null)
    }
  }, [isPreviewDialogOpen, previewBlobUrl])

  const handleAnalyzeDocument = async (doc: Document) => {
    if (!currentPractice?.id) {
      toast.error("Keine Praxis ausgewählt.")
      return
    }
    if (!isAiEnabled) {
      toast.info("KI-Analyse ist für diese Praxis nicht aktiviert.")
      return
    }

    setAnalyzingDocumentId(doc.id)
    toast.info(t("documents.analyze.starting", "KI-Analyse wird gestartet..."))

    try {

      const analysisResponse = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: doc.file_url,
          fileName: doc.name,
          fileType: doc.file_type,
        }),
      })

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text() // Use analysisResponse here, not response
        console.error("[v0] Client - AI analysis failed:", errorText)
        throw new Error(`AI analysis failed: ${errorText}`)
      }

      const aiAnalysis = await analysisResponse.json()

      const result = {
        documentId: doc.id,
        documentName: doc.name,
        summary: aiAnalysis.summary || "",
        documentType: aiAnalysis.documentType || "Unbekannt",
        keyPoints: aiAnalysis.keyPoints || [],
        categories: aiAnalysis.categories || [],
        tags: aiAnalysis.tags || [],
        detectedEntities: aiAnalysis.detectedEntities || { dates: [], amounts: [], names: [] },
        recommendations: aiAnalysis.recommendations || [],
        relevanceScore: aiAnalysis.relevanceScore || 5,
      }

      setAiAnalysisResult(result)
      setEditedAIResult({
        documentId: result.documentId,
        documentName: result.documentName,
        summary: result.summary,
        documentType: result.documentType,
        keyPoints: [...result.keyPoints],
        categories: [...result.categories],
        tags: [...result.tags],
        detectedEntities: {
          dates: [...result.detectedEntities.dates],
          amounts: [...result.detectedEntities.amounts],
          names: [...result.detectedEntities.names],
        },
        recommendations: [...result.recommendations],
        relevanceScore: result.relevanceScore,
      })
      setIsEditMode(false)
      setIsAIResultDialogOpen(true)

      toast.success(t("documents.analyze.success", "KI-Analyse erfolgreich abgeschlossen"))
    } catch (error) {
      console.error("[v0] Client - Error analyzing document:", error)
      toast.error(t("documents.analyze.error", "KI-Analyse fehlgeschlagen"))
    } finally {
      setAnalyzingDocumentId(null)
    }
  }

  const handleSaveAIAnalysis = async () => {
    if (!aiAnalysisResult || !editedAIResult || !currentPractice?.id) return

    try {
      const updateResponse = await fetch(
        `/api/practices/${currentPractice.id}/documents/${aiAnalysisResult.documentId}/ai-analysis`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ai_analysis: editedAIResult,
          }),
        },
      )

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text()
        throw new Error(`Failed to save AI analysis: ${errorText}`)
      }

      toast.success(t("documents.analyze.saved", "KI-Analyse gespeichert"))
      setIsAIResultDialogOpen(false)
      setAiAnalysisResult(null)
      setEditedAIResult(null)
      await fetchDocuments() // Refresh documents to reflect saved analysis
      await fetchAllDocuments() // Fetch all documents again after saving AI analysis
    } catch (error) {
      console.error("Error saving AI analysis:", error)
      toast.error(t("documents.analyze.saveFailed", "Fehler beim Speichern der Analyse"))
    }
  }

  const handleMoveDocument = async () => {
    if (!documentToMove || !currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/documents/${documentToMove.id}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: selectedMoveFolder,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Fehler beim Verschieben des Dokuments")
      }

      toast.success(t("documents.move.success", "Dokument erfolgreich verschoben"))
      setIsMoveDialogOpen(false)
      setDocumentToMove(null)
      setSelectedMoveFolder(null)
      await fetchDocuments() // Refresh current document list
      await fetchAllDocuments() // Fetch all documents again after moving a document
    } catch (error) {
      console.error("Error moving document:", error)
      toast.error(t("documents.move.error", "Fehler beim Verschieben des Dokuments"))
    }
  }

  const handleOpenMoveDialog = (doc: Document) => {
    setDocumentToMove(doc)
    setSelectedMoveFolder(doc.folder_id) // Set initial selection to current folder
    setIsMoveDialogOpen(true)
  }

  const handleDownloadDocument = (doc: Document) => {
    window.open(doc.file_url, "_blank")
  }

  const handleAnalyzeFolder = async () => {
    if (!currentPractice?.id) {
      toast.error("Keine Praxis ausgewählt.")
      return
    }

    setIsAnalyzingFolder(true)
    setIsAIFolderAnalysisOpen(true)
    toast.info("KI-Ordneranalyse wird gestartet...")

    try {
      const currentFolderName = folderPath.length > 0 ? folderPath[folderPath.length - 1].name : "Hauptordner"

      const response = await fetch("/api/documents/analyze-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: currentFolderId,
          folderName: currentFolderName,
          practiceId: currentPractice.id,
          allDocuments: allDocuments,
          allFolders: folders,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Ordneranalyse fehlgeschlagen: ${errorText}`)
      }

      const result = await response.json()
      setFolderAnalysis(result.analysis)
      setFolderAnalysisStats(result.stats)
      toast.success("KI-Ordneranalyse erfolgreich abgeschlossen")
    } catch (error) {
      console.error("Error analyzing folder:", error)
      toast.error("Fehler bei der Ordneranalyse")
      setIsAIFolderAnalysisOpen(false)
    } finally {
      setIsAnalyzingFolder(false)
    }
  }

  const createDefaultFolders = async () => {
    if (!currentPractice?.id || !currentUser?.id) return

    const defaultFolders = [
      { name: "BWA", description: "Standard-Ordner für BWA", color: "#3b82f6", isSystem: false },
      { name: "Abrechnungen", description: "Standard-Ordner für Abrechnungen", color: "#10b981", isSystem: false },
      { name: "Zulassungen", description: "Standard-Ordner für Zulassungen", color: "#f59e0b", isSystem: false },
      { name: "Auswertungen", description: "Standard-Ordner für Auswertungen", color: "#8b5cf6", isSystem: false },
      { name: "Verträge", description: "Standard-Ordner für Verträge", color: "#ec4899", isSystem: false },
      { name: "Sonstiges", description: "Standard-Ordner für Sonstiges", color: "#6b7280", isSystem: false },
      { name: "Protokolle", description: "Standard-Ordner für Protokolle", color: "#14b8a6", isSystem: false },
      { name: "Email Dokumente", description: "Dokumente per E-Mail empfangen", color: "#0ea5e9", isSystem: true },
      { name: "Handbücher", description: "Praxis-Handbücher und QM-Dokumente", color: "#f97316", isSystem: false },
    ]

    try {
      const params = new URLSearchParams({
        practiceId: currentPractice.id,
      })
      const response = await fetch(`/api/practices/${currentPractice.id}/document-folders?${params}`)
      const existingFolders = response.ok ? await response.json() : []
      const existingFolderNames = new Set(
        existingFolders.filter((f: DocumentFolder) => f.parent_folder_id === null).map((f: DocumentFolder) => f.name),
      )

      for (const folder of defaultFolders) {
        if (!existingFolderNames.has(folder.name)) {
          await fetch(`/api/practices/${currentPractice.id}/document-folders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              practice_id: currentPractice.id,
              name: folder.name,
              description: folder.description,
              parent_folder_id: null,
              color: folder.color,
              created_by: currentUser.id,
              is_system_folder: folder.isSystem,
            }),
          })
        }
      }
      await fetchFolders()
    } catch (error) {
      console.error("[v0] Error creating default folders:", error)
    }
  }

  // Fetch initial data on mount
  useEffect(() => {
    if (currentPractice?.id) {
      fetchDocuments()
      fetchFolders()
      fetchAllDocuments()
      fetchUsersAndTeams()
    }
  }, [currentPractice?.id]) // Only re-fetch if practice changes

  useEffect(() => {
    const checkAndCreateDefaultFolders = async () => {
      if (!currentPractice?.id || !currentUser?.id || hasCheckedDefaultFolders) return

      setHasCheckedDefaultFolders(true)

      try {
        await createDefaultFolders()
      } catch (error) {
        console.error("[v0] Error checking for default folders:", error)
      }
    }

    checkAndCreateDefaultFolders()
  }, [currentPractice?.id, currentUser?.id])

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("documents.loading", "Dokumente werden geladen...")}
            </p>
          </div>
        </div>
      )}

      {!isLoading && (
        <>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("documents.search", "Dokumente durchsuchen...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("documents.filter", "Filtern")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("documents.allTypes", "Alle Typen")}</SelectItem>
                <SelectItem value="pdf">{t("documents.pdf", "PDF")}</SelectItem>
                <SelectItem value="doc">{t("documents.doc", "Word Dokumente")}</SelectItem>
                <SelectItem value="xls">{t("documents.xls", "Excel Dateien")}</SelectItem>
                <SelectItem value="image">{t("documents.images", "Bilder")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("documents.sort", "Sortieren")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">{t("documents.nameAsc", "Name (A-Z)")}</SelectItem>
                <SelectItem value="name-desc">{t("documents.nameDesc", "Name (Z-A)")}</SelectItem>
                <SelectItem value="date-asc">{t("documents.dateAsc", "Datum (Älteste)")}</SelectItem>
                <SelectItem value="date-desc">{t("documents.dateDesc", "Datum (Neueste)")}</SelectItem>
                <SelectItem value="size-asc">{t("documents.sizeAsc", "Größe (Kleinste)")}</SelectItem>
                <SelectItem value="size-desc">{t("documents.sizeDesc", "Größe (Größte)")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-9 px-3"
                title="Listenansicht"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-9 px-3"
                title="Kachelansicht"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "finder" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("finder")}
                className="h-9 px-3"
                title="Finder-Ansicht"
              >
                <Columns3 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={handleNavigateToRoot} className="h-8 px-2">
                <Home className="h-4 w-4" />
              </Button>
              {folderPath.map((folder, index) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigateToPathFolder(index)}
                    className="h-8 px-2 hover:bg-muted"
                  >
                    {folder.name}
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setIsEditMode(!isEditMode)
                  if (!isEditMode && customFolderOrder.length === 0) {
                    setCustomFolderOrder(folders.map((f) => f.id))
                  }
                }}
                variant={isEditMode ? "default" : "outline"}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditMode ? "Fertig" : "Ansicht bearbeiten"}
              </Button>
              <Button
                onClick={() => {
                  setEditingFolderId(null) // Ensure it's a new folder creation
                  setFolderFormData({ name: "", description: "", color: "#3b82f6" }) // Reset form
                  setIsFolderDialogOpen(true)
                  setShowNewFolderDialog(true) // Open the new folder dialog
                }}
                variant="outline"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                {t("documents.newFolder", "Neuer Ordner")}
              </Button>
              <Button onClick={handleOpenUploadDialog}>
                <Upload className="mr-2 h-4 w-4" />
                {t("documents.upload", "Hochladen")}
              </Button>
              <Button
                onClick={handleAnalyzeFolder}
                className="gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">
                  {t("documents.aiAnalyzeCurrentFolder", "KI-Analyse aktueller Ordner")}
                </span>
              </Button>
            </div>
          </div>

          {dragActive && (
            <div
              className="fixed inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-center"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleFileDrop}
            >
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
                <p className="text-lg font-medium text-primary">Dateien hier ablegen</p>
                <p className="text-sm text-muted-foreground">Loslassen zum Hochladen</p>
              </div>
            </div>
          )}

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleFileDrop}
          >
            {/* Finder view mode */}
            {viewMode === "finder" && (
              <div className="flex border rounded-lg bg-background overflow-hidden" style={{ minHeight: 480 }}>
                {/* Sidebar: folder tree */}
                <div className="w-64 border-r bg-muted/30 overflow-y-auto flex-shrink-0">
                  <div className="p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">Ordner</h4>
                    <button
                      onClick={handleNavigateToRoot}
                      className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${!currentFolderId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                    >
                      <Home className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Alle Ordner</span>
                    </button>
                    <div className="mt-1 space-y-0.5">
                      {displayFolders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => handleNavigateToFolder(folder)}
                          className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors ${currentFolderId === folder.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                        >
                          <Folder className="h-4 w-4 flex-shrink-0" style={{ color: folder.color || "#3b82f6" }} />
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">
                            {getRecursiveFileCount(folder.id)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Main content: file list */}
                <div className="flex-1 overflow-y-auto">
                  {/* Subfolders */}
                  {displayFolders.length > 0 && (
                    <div className="border-b">
                      <div className="px-4 py-2 bg-muted/20">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {displayFolders.length} Ordner
                        </span>
                      </div>
                      {displayFolders.map((folder) => (
                        <div
                          key={folder.id}
                          onClick={() => handleNavigateToFolder(folder)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          <div
                            className="flex items-center justify-center w-8 h-8 rounded-lg"
                            style={{ backgroundColor: `${folder.color || "#3b82f6"}15` }}
                          >
                            <Folder className="h-4.5 w-4.5" style={{ color: folder.color || "#3b82f6" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{folder.name}</div>
                            {folder.description && (
                              <div className="text-xs text-muted-foreground truncate">{folder.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                            <span>{getRecursiveFileCount(folder.id)} Dateien</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Files */}
                  {filteredDocuments.length > 0 && (
                    <div>
                      <div className="px-4 py-2 bg-muted/20">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {filteredDocuments.length} Dateien
                        </span>
                      </div>
                      {filteredDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          onClick={() => handlePreviewDocument(doc)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/5">
                            <FileText className="h-4.5 w-4.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{doc.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.tags && doc.tags.length > 0 && <span className="mr-2">{doc.tags[0]}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                            {doc.ai_analysis && (
                              <Badge variant="secondary" className="text-[10px] py-0 h-5 bg-primary/10 text-primary border-primary/20">
                                <Sparkles className="h-3 w-3 mr-0.5" />
                                KI
                              </Badge>
                            )}
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span className="w-20 text-right">{new Date(doc.created_by_at).toLocaleDateString("de-DE")}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-[999999]">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlePreviewDocument(doc) }}>
                                  <Eye className="h-4 w-4 mr-2" />Vorschau
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownloadDocument(doc) }}>
                                  <Download className="h-4 w-4 mr-2" />Herunterladen
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenMoveDialog(doc) }}>
                                  Verschieben
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id) }} className="text-destructive">
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {displayFolders.length === 0 && filteredDocuments.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                      <Folder className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">Dieser Ordner ist leer</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid and List views */}
            {viewMode !== "finder" && displayFolders.length > 0 && (
              <>
              {/* Folders section header */}
              <div className="flex items-center gap-2 mb-3">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Ordner ({displayFolders.length})
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div
                className={
                  viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"
                }
              >
                {displayFolders.map((folder) => {
                  const isDragOver = dragOverFolderId === folder.id

                  if (viewMode === "list") {
                    return (
                      <Card
                        key={folder.id}
                        className={`w-full bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors ${isDragOver ? "border-primary bg-primary/10 ring-2 ring-primary/20" : ""} ${isEditMode ? "cursor-grab active:cursor-grabbing" : ""}`}
                        draggable={isEditMode}
                        onDragStart={(e) => isEditMode && handleFolderDragStart(e, folder.id)}
                        onDragOver={(e) => isEditMode && handleFolderDragOver(e, folder.id)}
                        onDragLeave={handleFolderDragLeave}
                        onDrop={(e) => isEditMode && handleFolderDrop(e, folder.id)}
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="flex items-center justify-center w-10 h-10 rounded-lg"
                              style={{ backgroundColor: `${folder.color || "#3b82f6"}20` }}
                            >
                              <Folder className="h-6 w-6" style={{ color: folder.color || "#3b82f6" }} />
                            </div>
                            <div className="truncate font-semibold text-base">{folder.name}</div>
                            <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <Folder className="h-3 w-3 mr-1" />
                                {getSubfolderCount(folder.id)} {t("documents.subfolders", "Unterordner")}
                              </Badge>
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                <FileText className="h-3 w-3 mr-1" />
                                {getRecursiveFileCount(folder.id)} {t("documents.files", "Dateien")}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-[999999]">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleNavigateToFolder(folder)
                                  }}
                                >
                                  {t("documents.open", "Öffnen")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditFolder(folder)
                                  }}
                                >
                                  {t("documents.edit", "Bearbeiten")}
                                </DropdownMenuItem>
                                {!folder.is_system_folder && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteFolder(folder.id)
                                    }}
                                  >
                                    {t("documents.delete", "Löschen")}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleUploadToFolder(folder.id)
                                  }}
                                >
                                  {t("documents.uploadToFolder", "In diesen Ordner hochladen")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                  return (
                    <Card
                      key={folder.id}
                      className={`group relative w-full border-2 bg-gradient-to-br from-background to-muted/20 hover:shadow-lg hover:border-primary/40 transition-all duration-300 ${isDragOver ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-xl" : "hover:shadow-md"} ${isEditMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}`}
                      onClick={() => !isEditMode && handleNavigateToFolder(folder)}
                      draggable={isEditMode}
                      onDragStart={(e) => {
                        if (isEditMode) {
                          e.stopPropagation()
                          handleFolderDragStart(e, folder.id)
                        }
                      }}
                      onDragOver={(e) => {
                        if (isEditMode) {
                          e.stopPropagation()
                          handleFolderDragOver(e, folder.id)
                        }
                      }}
                      onDragLeave={handleFolderDragLeave}
                      onDrop={(e) => {
                        if (isEditMode) {
                          e.stopPropagation()
                          handleFolderDrop(e, folder.id)
                        }
                      }}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className="flex items-center justify-center w-14 h-14 rounded-xl shadow-sm ring-1 ring-black/5"
                              style={{ backgroundColor: `${folder.color || "#3b82f6"}15` }}
                            >
                              <Folder className="h-8 w-8" style={{ color: folder.color || "#3b82f6" }} />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <h3 className="font-semibold text-base leading-tight truncate">{folder.name}</h3>
                              {folder.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">{folder.description}</p>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[999999]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNavigateToFolder(folder)
                                }}
                              >
                                {t("documents.open", "Öffnen")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditFolder(folder)
                                }}
                              >
                                {t("documents.edit", "Bearbeiten")}
                              </DropdownMenuItem>
                              {!folder.is_system_folder && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteFolder(folder.id)
                                  }}
                                >
                                  {t("documents.delete", "Löschen")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleUploadToFolder(folder.id)
                                }}
                              >
                                {t("documents.uploadToFolder", "In diesen Ordner hochladen")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 text-foreground border-border text-xs font-medium"
                          >
                            <Folder className="h-3 w-3 mr-1.5" />
                            {getSubfolderCount(folder.id)} {t("documents.subfolders", "Unterordner")}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 text-foreground border-border text-xs font-medium"
                          >
                            <FileText className="h-3 w-3 mr-1.5" />
                            {getRecursiveFileCount(folder.id)} {t("documents.files", "Dateien")}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              </>
            )}

            {viewMode !== "finder" && displayFolders.length === 0 && documents.length === 0 && (
              <Card className="p-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="rounded-full bg-muted p-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Dieser Ordner ist leer</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Laden Sie Dateien hoch oder erstellen Sie Unterordner, um Ihre Dokumente zu organisieren.
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowNewFolderDialog(true)}>
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Unterordner erstellen
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Datei hochladen
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {viewMode !== "finder" && documents.length > 0 && (
              <>
              {/* Files section header */}
              <div className="flex items-center gap-2 mb-3 mt-6">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Dateien ({filteredDocuments.length})
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div
                className={
                  viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-2"
                }
              >
                {filteredDocuments.map((doc) => {
                  if (viewMode === "list") {
                    return (
                      <Card
                        key={doc.id}
                        className="w-full bg-background hover:bg-muted/50 transition-colors border-border"
                      >
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            </div>
                            <div className="truncate font-medium">{doc.name}</div>
                            <Badge variant="outline" className="ml-auto flex-shrink-0">
                              {formatFileSize(doc.file_size)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                              <Download className="mr-2 h-4 w-4" />
                              {t("documents.download", "Herunterladen")}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-[999999]">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handlePreviewDocument(doc)
                                  }}
                                >
                                  {t("documents.preview", "Vorschau")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewAIAnalysis(doc)
                                  }}
                                >
                                  {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAnalyzeDocument(doc)
                                  }}
                                  disabled={!isAiEnabled}
                                >
                                  {t("documents.analyze", "Analyzieren")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleManageDocumentPermissions(doc.id)
                                  }}
                                >
                                  {t("documents.permissions", "Berechtigungen verwalten")}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenMoveDialog(doc)
                                  }}
                                >
                                  {t("documents.move", "Verschieben")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteDocument(doc.id)
                                  }}
                                >
                                  {t("documents.delete", "Löschen")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                  return (
                    <Card
                      key={doc.id}
                      className="group relative w-full bg-background hover:shadow-lg hover:border-primary/30 transition-all duration-300 border-2 cursor-pointer overflow-hidden"
                      onClick={() => handlePreviewDocument(doc)}
                    >
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm ring-1 ring-primary/10 flex-shrink-0">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex flex-col gap-1 flex-1 min-w-0">
                              <h3 className="font-semibold text-sm leading-tight truncate">{doc.name}</h3>
                              <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="z-[999999]">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreviewDocument(doc)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t("documents.preview", "Vorschau")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDownloadDocument(doc)
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                {t("documents.download", "Herunterladen")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewAIAnalysis(doc)
                                }}
                                disabled={!doc.ai_analysis}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAnalyzeDocument(doc)
                                }}
                                disabled={!isAiEnabled}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                {t("documents.analyze", "Analyzieren")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleManageDocumentPermissions(doc.id)
                                }}
                              >
                                {t("documents.permissions", "Berechtigungen verwalten")}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenMoveDialog(doc)
                                }}
                              >
                                {t("documents.move", "Verschieben")}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteDocument(doc.id)
                                }}
                                className="text-destructive"
                              >
                                {t("documents.delete", "Löschen")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2">
                          {doc.ai_analysis && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              <Sparkles className="h-3 w-3 mr-1" />
                              KI analysiert
                            </Badge>
                          )}
                          {doc.tags && doc.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {doc.tags[0]}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              </>
            )}
          </div>
        </>
      )}

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              {previewDocument?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-4">
              <span>{previewDocument && formatFileSize(previewDocument.file_size)}</span>
              {previewDocument?.ai_analysis && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {t("documents.analyzed", "KI-analysiert")}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
            {previewDocument && (
              <>
                {previewDocument.file_type.startsWith("image/") ? (
                  <div className="flex items-center justify-center h-full p-4">
                    <img
                      src={previewDocument.file_url || "/placeholder.svg"}
                      alt={previewDocument.name}
                      className="max-w-full max-h-full object-contain rounded"
                    />
                  </div>
                ) : previewDocument.file_type === "application/pdf" ? (
                  isLoadingPreview ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Vorschau wird geladen...</p>
                    </div>
                  ) : previewBlobUrl ? (
                    <iframe src={previewBlobUrl} className="w-full h-full" title={previewDocument.name} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <FileText className="h-16 w-16 text-muted-foreground" />
                      <p className="text-muted-foreground">Vorschau konnte nicht geladen werden</p>
                      <Button onClick={() => handleDownloadDocument(previewDocument)}>
                        <Download className="mr-2 h-4 w-4" />
                        {t("documents.download", "Herunterladen")}
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {t("documents.previewNotAvailable", "Vorschau für diesen Dateityp nicht verfügbar")}
                    </p>
                    <Button onClick={() => handleDownloadDocument(previewDocument)}>
                      <Download className="mr-2 h-4 w-4" />
                      {t("documents.download", "Herunterladen")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {previewDocument?.ai_analysis && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsPreviewDialogOpen(false)
                    handleViewAIAnalysis(previewDocument)
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  if (previewDocument) {
                    setIsPreviewDialogOpen(false)
                    handleAnalyzeDocument(previewDocument)
                  }
                }}
                disabled={!isAiEnabled}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("documents.analyze", "Mit KI analysieren")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => previewDocument && handleDownloadDocument(previewDocument)}>
                <Download className="mr-2 h-4 w-4" />
                {t("documents.download", "Herunterladen")}
              </Button>
              <Button onClick={() => setIsPreviewDialogOpen(false)}>{t("common.close", "Schließen")}</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("documents.upload", "Dokument hochladen")}</DialogTitle>
            <DialogDescription>
              {t("documents.uploadDescription", "Laden Sie ein neues Dokument in Ihre Praxis hoch")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-name">
                {t("documents.name", "Name")} ({t("common.optional", "optional")})
              </Label>
              <Input
                id="document-name"
                placeholder={t("documents.namePlaceholder", "Dokumentname")}
                value={uploadFormData.name}
                onChange={(e) => setUploadFormData({ ...uploadFormData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="document-folder">
                {t("documents.folder", "Ordner")} ({t("common.optional", "optional")})
              </Label>
              <Select
                value={uploadFormData.folder_id || "root"}
                onValueChange={(value) =>
                  setUploadFormData({ ...uploadFormData, folder_id: value === "root" ? null : value })
                }
              >
                <SelectTrigger id="document-folder">
                  <SelectValue>
                    {uploadFormData.folder_id
                      ? folders.find((f) => f.id === uploadFormData.folder_id)?.name ||
                        folderPath.find((f) => f.id === uploadFormData.folder_id)?.name ||
                        t("documents.mainFolder", "Hauptordner")
                      : t("documents.mainFolder", "Hauptordner")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">{t("documents.mainFolder", "Hauptordner")}</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="document-description">{t("documents.description", "Beschreibung")}</Label>
              <Textarea
                id="document-description"
                placeholder={t("documents.descriptionPlaceholder", "Dokumentbeschreibung")}
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData({ ...uploadFormData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="analyze-with-ai"
                checked={uploadFormData.analyzeWithAI}
                onChange={(e) => setUploadFormData({ ...uploadFormData, analyzeWithAI: e.target.checked })}
                className="h-4 w-4"
                disabled={!isAiEnabled} // Disable checkbox if AI is not enabled
              />
              <Label
                htmlFor="analyze-with-ai"
                className={`cursor-pointer ${!isAiEnabled ? "text-muted-foreground opacity-70" : ""}`}
              >
                {t("documents.analyzeWithAI", "Mit KI analysieren")}
              </Label>
            </div>

            <div>
              <Label>{t("documents.files", "Dateien")}</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                }`}
                onDragEnter={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragging(false)
                  const files = Array.from(e.dataTransfer.files)
                  setUploadFormData((prev) => ({ ...prev, files }))
                }}
              >
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : []
                    setUploadFormData((prev) => ({ ...prev, files }))
                  }}
                  className="hidden"
                  id="document-files"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  ref={fileInputRef}
                />
                <label htmlFor="document-files" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    {t("documents.clickOrDrag", "Klicken Sie hier oder ziehen Sie Dateien hierher")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (max. 50MB pro Datei)
                  </p>
                </label>
                {uploadFormData.files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadFormData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-left">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const fileUrl = URL.createObjectURL(file)
                              window.open(fileUrl, "_blank")
                            }}
                            title="Vorschau"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadFormData((prev) => ({
                                ...prev,
                                files: prev.files.filter((_, i) => i !== index),
                              }))
                            }}
                            title="Entfernen"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleUploadDocument} disabled={isUploading || uploadFormData.files.length === 0}>
              {isUploading ? t("documents.uploading", "Wird hochgeladen...") : t("documents.upload", "Hochladen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Folder Dialog */}
      <Dialog
        open={isFolderDialogOpen || showNewFolderDialog} // Changed to include showNewFolderDialog
        onOpenChange={(open) => {
          setIsFolderDialogOpen(open)
          setShowNewFolderDialog(open) // Synchronize with showNewFolderDialog
          if (!open) {
            setEditingFolderId(null)
            setFolderFormData({ name: "", description: "", color: "#3b82f6" })
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFolderId
                ? t("documents.editFolder", "Ordner bearbeiten")
                : t("documents.newFolder", "Neuer Ordner")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">{t("documents.folderName", "Ordnername")}</Label>
              <Input
                id="folder-name"
                value={folderFormData.name}
                onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="folder-description">{t("documents.description", "Beschreibung")}</Label>
              <Textarea
                id="folder-description"
                value={folderFormData.description}
                onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
              />
            </div>
            <ColorPicker
              id="folder-color"
              label={t("documents.color", "Farbe")}
              value={folderFormData.color}
              onChange={(color) => setFolderFormData({ ...folderFormData, color })}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFolderDialogOpen(false)
                setShowNewFolderDialog(false) // Also close the new folder dialog
              }}
            >
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleCreateFolder}>
              {editingFolderId ? t("common.save", "Speichern") : t("common.create", "Erstellen")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Document Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("documents.move", "Dokument verschieben")}</DialogTitle>
            <DialogDescription>{t("documents.moveDescription", "Wählen Sie einen Zielordner")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedMoveFolder || "root"}
              onValueChange={(value) => setSelectedMoveFolder(value === "root" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("documents.selectFolder", "Ordner auswählen")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">{t("documents.mainFolder", "Hauptordner")}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              {t("common.cancel", "Abbrechen")}
            </Button>
            <Button onClick={handleMoveDocument}>{t("documents.move", "Verschieben")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Folder Analysis Dialog */}
      <AIFolderAnalysisDialog
        isOpen={isAIFolderAnalysisOpen}
        onClose={() => {
          setIsAIFolderAnalysisOpen(false)
          setFolderAnalysis(null)
          setFolderAnalysisStats(null)
        }}
        analysis={folderAnalysis}
        folderName={folderPath.length > 0 ? folderPath[folderPath.length - 1].name : "Hauptordner"}
        stats={folderAnalysisStats}
        isLoading={isAnalyzingFolder}
      />

      {/* Document Permissions Dialog */}
      <DocumentPermissionsDialog
        isOpen={isPermissionsDialogOpen}
        onClose={() => {
          setIsPermissionsDialogOpen(false)
          setSelectedDocumentId(null)
          setSelectedFolderId(null)
        }}
        documentId={selectedDocumentId}
        folderId={selectedFolderId}
        practiceId={currentPractice?.id || ""}
      />
    </div>
  )
}

export default DocumentsManager
