"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { FileText, Sparkles, Download, ExternalLink, FileImage, FileSpreadsheet, File, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
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

/**
 * PDF Canvas Renderer using PDF.js via CDN
 * Renders PDF pages to canvas elements - works on all browsers including mobile
 */
function PdfCanvasViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const pdfDocRef = useRef<any>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)

  // Load PDF.js from CDN
  useEffect(() => {
    const loadPdfJs = async () => {
      if ((window as any).pdfjsLib) return (window as any).pdfjsLib
      
      return new Promise((resolve, reject) => {
        const script = window.document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
        script.type = "module"
        
        // Use a different approach - fetch as text and eval
        fetch("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.mjs")
          .then(() => {
            // Fallback: use the classic UMD build
            const s = window.document.createElement("script")
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js"
            s.onload = () => resolve((window as any).pdfjsLib)
            s.onerror = reject
            window.document.head.appendChild(s)
          })
          .catch(() => {
            // Direct UMD fallback
            const s = window.document.createElement("script")
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.min.js"
            s.onload = () => resolve((window as any).pdfjsLib)
            s.onerror = reject
            window.document.head.appendChild(s)
          })
      })
    }

    let cancelled = false

    const init = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const pdfjsLib = await loadPdfJs()
        if (cancelled) return
        
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js"

        const loadingTask = pdfjsLib.getDocument(url)
        const pdf = await loadingTask.promise
        if (cancelled) return
        
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        setLoading(false)
      } catch (err: any) {
        if (cancelled) return
        console.error("[v0] PDF.js load error:", err)
        setError(err?.message || "PDF konnte nicht geladen werden")
        setLoading(false)
      }
    }

    init()
    return () => { cancelled = true }
  }, [url])

  // Render current page
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current || loading) return

    const renderPage = async () => {
      try {
        // Cancel any ongoing render
        if (renderTaskRef.current) {
          try { renderTaskRef.current.cancel() } catch {}
        }

        const page = await pdfDocRef.current.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return

        const viewport = page.getViewport({ scale: scale * 1.5 }) // 1.5x for crisp rendering
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        canvas.height = viewport.height
        canvas.width = viewport.width
        canvas.style.width = `${viewport.width / 1.5}px`
        canvas.style.height = `${viewport.height / 1.5}px`

        const renderTask = page.render({ canvasContext: ctx, viewport })
        renderTaskRef.current = renderTask
        await renderTask.promise
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("[v0] PDF render error:", err)
        }
      }
    }

    renderPage()
  }, [currentPage, scale, loading])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
        <p className="text-sm text-muted-foreground">PDF wird geladen...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <FileText className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">PDF-Vorschau fehlgeschlagen</p>
        <p className="text-xs text-muted-foreground/70 max-w-sm text-center">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF toolbar */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[80px] text-center">
          Seite {currentPage} / {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
          disabled={scale <= 0.5}
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setScale((s) => Math.min(3, s + 0.25))}
          disabled={scale >= 3}
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
      </div>
      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4 bg-muted/30">
        <canvas ref={canvasRef} className="shadow-lg rounded" />
      </div>
    </div>
  )
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

  // Build a proxy URL to fetch document server-side (avoids CORS/X-Frame-Options)
  const getProxyUrl = useCallback((url: string) => {
    return `/api/documents/proxy?url=${encodeURIComponent(url)}`
  }, [])

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
                  {document.category || document.name?.split(".").pop() || document.file_type.split("/").pop()}
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
                  const img = e.currentTarget
                  if (!img.src.includes("/api/documents/proxy")) {
                    img.src = getProxyUrl(document.file_url)
                  }
                }}
              />
            </div>
          ) : canPreviewPdf ? (
            /* PDF.js canvas-based renderer - works on all browsers */
            <PdfCanvasViewer url={getProxyUrl(document.file_url)} />
          ) : canPreviewOffice && !iframeError ? (
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
