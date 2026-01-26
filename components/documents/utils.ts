import type { Document } from "./types"

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function filterDocuments(
  documents: Document[],
  searchQuery: string,
  fileTypeFilter: string
): Document[] {
  return documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType =
      fileTypeFilter === "all" ||
      (fileTypeFilter === "pdf" && doc.file_type === "application/pdf") ||
      (fileTypeFilter === "doc" && (doc.file_type.includes("word") || doc.file_type.includes("document"))) ||
      (fileTypeFilter === "xls" && (doc.file_type.includes("sheet") || doc.file_type.includes("excel"))) ||
      (fileTypeFilter === "image" && doc.file_type.startsWith("image/"))
    return matchesSearch && matchesType
  })
}

export function sortDocuments(documents: Document[], sortBy: string): Document[] {
  return [...documents].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.name.localeCompare(b.name)
      case "name-desc":
        return b.name.localeCompare(a.name)
      case "date-asc":
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
}

export const DEFAULT_FOLDERS = [
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
