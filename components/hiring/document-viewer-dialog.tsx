"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface DocumentViewerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    name: string
    url: string
    type?: string
  } | null
}

export function DocumentViewerDialog({ open, onOpenChange, document }: DocumentViewerDialogProps) {
  if (!document) return null

  const getFileType = (url: string, type?: string) => {
    if (type) return type
    const extension = url.split(".").pop()?.toLowerCase()
    if (["pdf"].includes(extension || "")) return "pdf"
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) return "image"
    return "other"
  }

  const fileType = getFileType(document.url, document.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate pr-4">{document.name}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={document.url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden rounded-lg border bg-muted/50">
          {fileType === "pdf" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="font-medium text-sm">PDF-Vorschau nicht verfügbar</p>
                <p className="text-sm text-muted-foreground">
                  PDF-Dateien können aus Sicherheitsgründen nicht eingebettet werden. Bitte öffnen Sie die Datei in einem neuen Tab oder laden Sie sie herunter.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <a href={document.url} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-2" />
                    In neuem Tab öffnen
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={document.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Herunterladen
                  </a>
                </Button>
              </div>
            </div>
          )}
          {fileType === "image" && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={document.url || "/placeholder.svg"}
                alt={document.name}
                className="max-w-full max-h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          )}
          {fileType === "other" && (
            <div className="w-full h-full flex items-center justify-center p-8">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">Vorschau für diesen Dateityp nicht verfügbar</p>
                <Button asChild>
                  <a href={document.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Datei herunterladen
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewerDialog
