"use client"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FileText, MoreVertical, Download } from "lucide-react"
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

  const DocumentDropdownMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className={viewMode === "grid" ? "h-7 w-7 p-0" : ""}>
          <MoreVertical className={viewMode === "grid" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[999999]">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onPreview(doc)
          }}
        >
          {t("documents.preview", "Vorschau")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onViewAIAnalysis(doc)
          }}
        >
          {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onAnalyze(doc)
          }}
          disabled={!isAiEnabled}
        >
          {t("documents.analyze", "Analyzieren")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onManagePermissions(doc.id)
          }}
        >
          {t("documents.permissions", "Berechtigungen verwalten")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onMove(doc)
          }}
        >
          {t("documents.move", "Verschieben")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onDelete(doc.id)
          }}
        >
          {t("documents.delete", "Löschen")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  if (viewMode === "list") {
    return (
      <Card className="w-full bg-background hover:bg-muted/50 transition-colors border-border">
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
            <DocumentDropdownMenu />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className="w-full bg-background hover:bg-muted/50 transition-colors border-border cursor-pointer"
      onClick={() => onPreview(doc)}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 space-y-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-muted flex-shrink-0">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="truncate text-sm font-medium">{doc.name}</div>
        </div>
        <DocumentDropdownMenu />
      </CardHeader>
      <CardContent className="flex items-center justify-between p-3 pt-0">
        <Badge variant="outline" className="text-xs">
          {formatFileSize(doc.file_size)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-transparent"
          onClick={(e) => {
            e.stopPropagation()
            onDownload(doc)
          }}
        >
          <Download className="mr-1 h-3 w-3" />
          {t("documents.download", "Herunterladen")}
        </Button>
      </CardContent>
    </Card>
  )
}
