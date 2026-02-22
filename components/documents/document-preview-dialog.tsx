"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileText, Sparkles, Download } from "lucide-react"
import { useTranslation } from "@/contexts/translation-context"
import type { Document } from "./types"
import { formatFileSize } from "./utils"

interface DocumentPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: Document | null
  isAiEnabled: boolean
  onViewAIAnalysis: (doc: Document) => void
  onAnalyze: (doc: Document) => void
  onDownload: (doc: Document) => void
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
  isAiEnabled,
  onViewAIAnalysis,
  onAnalyze,
  onDownload,
}: DocumentPreviewDialogProps) {
  const { t } = useTranslation()

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-5 w-5" />
            {document.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            <span>{formatFileSize(document.file_size)}</span>
            {document.ai_analysis && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                {t("documents.analyzed", "KI-analysiert")}
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/30">
          {document.file_type.startsWith("image/") ? (
            <div className="flex items-center justify-center h-full p-4">
              <img
                src={document.file_url || "/placeholder.svg"}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          ) : document.file_type === "application/pdf" || document.name?.toLowerCase().endsWith(".pdf") ? (
            <iframe
              src={document.file_url}
              title={document.name}
              className="w-full h-full rounded"
              style={{ minHeight: "500px" }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">
                {t("documents.previewNotAvailable", "Vorschau für diesen Dateityp nicht verfügbar")}
              </p>
              <Button onClick={() => onDownload(document)}>
                <Download className="mr-2 h-4 w-4" />
                {t("documents.download", "Herunterladen")}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {document.ai_analysis && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  onViewAIAnalysis(document)
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                onAnalyze(document)
              }}
              disabled={!isAiEnabled}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("documents.analyze", "Mit KI analysieren")}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onDownload(document)}>
              <Download className="mr-2 h-4 w-4" />
              {t("documents.download", "Herunterladen")}
            </Button>
            <Button onClick={() => onOpenChange(false)}>{t("common.close", "Schließen")}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
