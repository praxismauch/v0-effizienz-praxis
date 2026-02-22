"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  FileText,
  MoreVertical,
  Download,
  Eye,
  Sparkles,
  Shield,
  Move,
  Trash2,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  File,
} from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { Document } from "./types"
import { formatFileSize } from "./utils"

interface DocumentCardProps {
  document: Document
  viewMode: "grid" | "list"
  isAiEnabled: boolean
  onPreview: (doc: Document) => void
  onViewAIAnalysis: (doc: Document) => void
  onAnalyze: (doc: Document) => void
  onManagePermissions: (docId: string) => void
  onMove: (doc: Document) => void
  onDelete: (docId: string) => void
  onDownload: (doc: Document) => void
}

// Get file icon and color based on file type
function getFileTypeInfo(fileName: string | undefined | null) {
  const ext = (fileName || "").split(".").pop()?.toLowerCase() || ""

  if (["pdf"].includes(ext)) {
    return { icon: FileText, color: "#ef4444", bgColor: "#fef2f2" }
  }
  if (["doc", "docx"].includes(ext)) {
    return { icon: FileText, color: "#3b82f6", bgColor: "#eff6ff" }
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return { icon: FileSpreadsheet, color: "#22c55e", bgColor: "#f0fdf4" }
  }
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) {
    return { icon: FileImage, color: "#8b5cf6", bgColor: "#faf5ff" }
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return { icon: FileArchive, color: "#f59e0b", bgColor: "#fffbeb" }
  }
  return { icon: File, color: "#6b7280", bgColor: "#f9fafb" }
}

export function DocumentCard({
  document: doc,
  viewMode,
  isAiEnabled,
  onPreview,
  onViewAIAnalysis,
  onAnalyze,
  onManagePermissions,
  onMove,
  onDelete,
  onDownload,
}: DocumentCardProps) {
  const { t } = useTranslation()
  const fileInfo = getFileTypeInfo(doc.name)
  const FileIcon = fileInfo.icon
  const fileExt = (doc.name || "").split(".").pop()?.toUpperCase() || "FILE"

  const DocumentDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/80"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onPreview(doc)
          }}
        >
          <Eye className="h-4 w-4 mr-2" />
          {t("documents.preview", "Vorschau")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDownload(doc)
          }}
        >
          <Download className="h-4 w-4 mr-2" />
          {t("documents.download", "Herunterladen")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onViewAIAnalysis(doc)
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {t("documents.viewAIAnalysis", "KI-Analyse")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onAnalyze(doc)
          }}
          disabled={!isAiEnabled}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {t("documents.analyze", "Analysieren")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onManagePermissions(doc.id)
          }}
        >
          <Shield className="h-4 w-4 mr-2" />
          {t("documents.permissions", "Berechtigungen")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onMove(doc)
          }}
        >
          <Move className="h-4 w-4 mr-2" />
          {t("documents.move", "Verschieben")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete(doc.id)
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("documents.delete", "Löschen")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === "list") {
    return (
      <Card
        className="group relative overflow-hidden border bg-card hover:shadow-md transition-all duration-200 hover:border-border/80 cursor-pointer"
        onClick={() => onPreview(doc)}
      >
        <div className="flex items-center gap-4 p-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
            style={{ backgroundColor: fileInfo.bgColor }}
          >
            <FileIcon className="h-6 w-6" style={{ color: fileInfo.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {doc.name}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: fileInfo.bgColor, color: fileInfo.color }}
              >
                {fileExt}
              </span>
              <span>{formatFileSize(doc.file_size)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:flex"
              onClick={(e) => {
                e.stopPropagation()
                onDownload(doc)
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <DocumentDropdownMenu />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="group relative overflow-hidden border bg-card hover:shadow-lg transition-all duration-200 hover:border-border/80 cursor-pointer"
      onClick={() => onPreview(doc)}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: fileInfo.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center w-14 h-14 rounded-xl"
            style={{ backgroundColor: fileInfo.bgColor }}
          >
            <FileIcon className="h-7 w-7" style={{ color: fileInfo.color }} />
          </div>
          <DocumentDropdownMenu />
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground mb-4 line-clamp-2 group-hover:text-primary transition-colors">
          {doc.name}
        </h3>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: fileInfo.bgColor, color: fileInfo.color }}
            >
              {fileExt}
            </span>
            <span className="text-sm text-muted-foreground">{formatFileSize(doc.file_size)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onDownload(doc)
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
