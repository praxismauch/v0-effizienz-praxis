"use client"

import { useState, useEffect, useCallback } from "react"
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
import { FileText, Sparkles, Download, ExternalLink, FileImage, FileSpreadsheet, File, Loader2 } from "lucide-react"
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

function getFileIcon(fileType: string, fileName: string) {
  const ext = fileName?.toLowerCase().split(".").pop() || ""
  if (fileType.startsWith("image/")) return FileImage
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return FileSpreadsheet
  if (fileType === "application/pdf" || ext === "pdf") return FileText
  return File
}

function isPdf(fileType: string, fileName: string) {
  return fileType === "application/pdf" || 
    fileType?.includes("pdf") || 
    fileName?.toLowerCase().endsWith(".pdf")
}

function isImage(fileType: string, fileName?: string) {
  if (fileType?.startsWith("image/")) return true
  const ext = fileName?.toLowerCase().split(".").pop() || ""
  return ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext)
}

function isOfficeDoc(fileName: string) {
  const ext = fileName?.toLowerCase().split(".").pop() || ""
  return ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext)
}

function isTextFile(fileName: string) {
  const ext = fileName?.toLowerCase().split(".").pop() || ""
  return ["txt", "csv", "json", "xml", "html", "htm", "md"].includes(ext)
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
  const [iframeError, setIframeError] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [blobLoading, setBlobLoading] = useState(false)

  const docFileUrl = document?.file_url
  const docFileType = document?.file_type
  const docName = document?.name

  // Build a proxy URL to fetch document server-side (avoids CORS/X-Frame-Options)
  const getProxyUrl = useCallback((url: string) => {
    return `/api/documents/proxy?url=${encodeURIComponent(url)}`
  }, [])

  // Fetch PDF via server-side proxy to bypass CORS restrictions
  useEffect(() => {
    if (!open || !docFileUrl || !docName) return

    const docIsPdf = isPdf(docFileType || "", docName)
    if (!docIsPdf) return

    let cancelled = false
    setBlobLoading(true)
    setIframeError(false)

    const proxyUrl = getProxyUrl(docFileUrl)

    fetch(proxyUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`Proxy returned ${res.status}`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }))
        setBlobUrl(url)
        setBlobLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        // Fallback: try direct fetch (works if same-origin or CORS allowed)
        fetch(docFileUrl)
          .then((res) => {
            if (!res.ok) throw new Error(`Direct fetch ${res.status}`)
            return res.blob()
          })
          .then((blob) => {
            if (cancelled) return
            const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }))
            setBlobUrl(url)
            setBlobLoading(false)
          })
          .catch(() => {
            if (cancelled) return
            setBlobLoading(false)
            // Don't set iframeError - let the Google Docs viewer fallback try
          })
      })

    return () => { cancelled = true }
  }, [open, docFileUrl, docFileType, docName, getProxyUrl])

  // Cleanup blob URL when dialog closes
  useEffect(() => {
    if (!open && blobUrl) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
      setIframeError(false)
    }
  }, [open, blobUrl])

  if (!document) return null

  const IconComponent = getFileIcon(document.file_type, document.name)
  const canPreviewPdf = isPdf(document.file_type, document.name)
  const canPreviewOffice = isOfficeDoc(document.name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <IconComponent className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">{document.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{formatFileSize(document.file_size)}</span>
                <span className="text-xs text-muted-foreground">{'|'}</span>
                <span className="text-xs text-muted-foreground uppercase">
                  {document.name?.split(".").pop() || document.file_type.split("/").pop()}
                </span>
                {document.ai_analysis && (
                  <Badge variant="secondary" className="gap-1 h-5 text-[10px]">
                    <Sparkles className="h-2.5 w-2.5" />
                    KI-analysiert
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => window.open(document.file_url, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {t("documents.openInNewTab", "Neuer Tab")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onDownload(document)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              {t("documents.download", "Herunterladen")}
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-muted/20 relative">
          {isImage(document.file_type, document.name) ? (
            <div className="flex items-center justify-center h-full p-6">
              <img
                src={document.file_url || "/placeholder.svg"}
                alt={document.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                crossOrigin="anonymous"
                onError={(e) => {
                  // Retry via proxy if direct image load fails
                  const img = e.currentTarget
                  if (!img.src.includes("/api/documents/proxy")) {
                    img.src = getProxyUrl(document.file_url)
                  }
                }}
              />
            </div>
          ) : canPreviewPdf ? (
            <div className="relative w-full h-full">
              {blobLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted/20 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                  <p className="text-sm text-muted-foreground">PDF wird geladen...</p>
                </div>
              )}
              {blobUrl ? (
                /* Strategy 1: Render from local blob URL (no CORS issues) */
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=1&view=FitH`}
                  title={document.name}
                  className="w-full h-full border-0"
                  style={{ minHeight: "100%" }}
                />
              ) : !blobLoading ? (
                /* Strategy 2: Use server-side proxy URL directly in iframe */
                <iframe
                  src={getProxyUrl(document.file_url)}
                  title={document.name}
                  className="w-full h-full border-0"
                  style={{ minHeight: "100%" }}
                />
              ) : null}
            </div>
          ) : canPreviewOffice && !iframeError ? (
            /* Use Microsoft Office Online viewer for Office docs */
            <div className="relative w-full h-full">
              <iframe
                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.file_url)}`}
                title={document.name}
                className="w-full h-full border-0"
                onError={() => setIframeError(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 border">
                <IconComponent className="h-10 w-10 text-muted-foreground/60" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  {t("documents.previewNotAvailable", "Vorschau nicht verfügbar")}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {t(
                    "documents.previewFallbackDesc",
                    "Dieses Dokument kann nicht direkt angezeigt werden. Bitte laden Sie es herunter oder öffnen Sie es in einem neuen Tab.",
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(document.file_url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  {t("documents.openInNewTab", "In neuem Tab öffnen")}
                </Button>
                <Button size="sm" onClick={() => onDownload(document)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {t("documents.download", "Herunterladen")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t px-6 py-3 bg-background">
          <div className="flex gap-2">
            {document.ai_analysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onViewAIAnalysis(document)
                }}
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {t("documents.viewAIAnalysis", "KI-Analyse anzeigen")}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onAnalyze(document)
              }}
              disabled={!isAiEnabled}
              className="gap-1.5 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white hover:text-white border-0"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {t("documents.analyze", "Analysieren")}
            </Button>
          </div>
          <Button variant="default" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.close", "Schließen")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
