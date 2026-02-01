"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Globe, LinkIcon, Eye, Download, ImageIcon, ZoomIn, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Candidate, Document } from "../types"
import { formatDate } from "../utils"

interface DocumentsCardProps {
  candidate: Candidate
  onViewDocument: (doc: Document) => void
}

interface DocumentFile {
  name?: string
  filename?: string
  url: string
  size?: number
  type?: string
  uploadedAt?: string
}

interface CategorizedDocuments {
  lebenslauf?: DocumentFile[]
  bewerbung?: DocumentFile[]
  zeugnisse?: DocumentFile[]
  bilder?: DocumentFile[]
  sonstiges?: DocumentFile[]
}

const categoryLabels: Record<string, string> = {
  lebenslauf: "Lebenslauf",
  bewerbung: "Bewerbung",
  zeugnisse: "Zeugnisse",
  bilder: "Bilder & Medien",
  sonstiges: "Sonstiges",
}

const isImageFile = (file: DocumentFile): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  const fileName = (file.name || file.filename || '').toLowerCase()
  return imageExtensions.some(ext => fileName.endsWith(ext)) || (file.type?.startsWith('image/') ?? false)
}

export function DocumentsCard({ candidate, onViewDocument }: DocumentsCardProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [previewImageName, setPreviewImageName] = useState<string>("")

  // Check if documents is categorized object or legacy array
  const isCategorizedDocuments = candidate.documents && !Array.isArray(candidate.documents)
  const categorizedDocs = isCategorizedDocuments ? (candidate.documents as unknown as CategorizedDocuments) : null
  const legacyDocs = !isCategorizedDocuments && Array.isArray(candidate.documents) ? candidate.documents : []

  // Check if there are any documents at all
  const hasExternalLinks = candidate.resume_url || candidate.portfolio_url || candidate.linkedin_url
  const hasCategorizedDocs = categorizedDocs && Object.values(categorizedDocs).some(arr => arr && arr.length > 0)
  const hasLegacyDocs = legacyDocs.length > 0
  const hasAnyContent = hasExternalLinks || hasCategorizedDocs || hasLegacyDocs

  const openImagePreview = (url: string, name: string) => {
    setPreviewImage(url)
    setPreviewImageName(name)
  }

  const renderDocumentFile = (doc: DocumentFile, idx: number) => {
    const fileName = doc.filename || doc.name || "Dokument"
    const isImage = isImageFile(doc)

    return (
      <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          {isImage ? (
            <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 border border-border">
              <img src={doc.url} alt={fileName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm truncate max-w-[200px]">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {doc.size && `${(doc.size / 1024).toFixed(1)} KB`}
              {doc.uploadedAt && ` • ${formatDate(doc.uploadedAt)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (isImage) {
                openImagePreview(doc.url, fileName)
              } else {
                onViewDocument({
                  name: fileName,
                  url: doc.url,
                  type: doc.type,
                })
              }
            }}
          >
            {isImage ? <ZoomIn className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={doc.url} download={fileName}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumente & Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* External Links */}
            {hasExternalLinks && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Externe Links
                </p>
                <div className="space-y-2">
                  {candidate.resume_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Lebenslauf</p>
                          <p className="text-xs text-muted-foreground">Online Lebenslauf</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {candidate.portfolio_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Portfolio</p>
                          <p className="text-xs text-muted-foreground">Online Portfolio</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                  {candidate.linkedin_url && (
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <LinkIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">LinkedIn</p>
                          <p className="text-xs text-muted-foreground">LinkedIn Profil</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
)}
                      </div>
                    </div>
                  ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filesArray.map((file, idx) => renderDocumentFile(file, idx))}
                        </div>
                      )}

            {/* Categorized Documents */}
            {hasCategorizedDocs && categorizedDocs && (
              <>
                {Object.entries(categorizedDocs).map(([category, files]) => {
                  // Ensure files is an array before processing
                  const filesArray = Array.isArray(files) ? files : []
                  if (filesArray.length === 0) return null

                  const isImageCategory = category === 'bilder'

                  return (
                    <div key={category}>
                      <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        {isImageCategory ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        {categoryLabels[category] || category}
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded-full">
                          {filesArray.length}
                        </span>
                      </p>

                      {/* Image Grid for bilder category */}
                      {isImageCategory ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {filesArray.map((file, idx) => (
                            <div
                              key={idx}
                              className="relative group rounded-lg overflow-hidden border border-border bg-muted/50 aspect-square cursor-pointer"
                              onClick={() => openImagePreview(file.url, file.name || file.filename || 'Bild')}
                            >
                              <img
                                src={file.url}
                                alt={file.name || file.filename || 'Bild'}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openImagePreview(file.url, file.name || file.filename || 'Bild')
                                  }}
                                >
                                  <ZoomIn className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="icon"
                                  className="h-8 w-8"
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <a href={file.url} download={file.name || file.filename}>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                                <p className="text-xs text-white truncate">
                                  {file.name || file.filename || 'Bild'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {files.map((file, idx) => renderDocumentFile(file, idx))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}

            {/* Legacy Documents (flat array) */}
            {hasLegacyDocs && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Hochgeladene Dokumente
                </p>
                <div className="space-y-2">
                  {legacyDocs.map((doc, idx) => renderDocumentFile(doc as DocumentFile, idx))}
                </div>
              </div>
            )}

            {/* No documents message */}
            {!hasAnyContent && (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Keine Dokumente oder Links verfügbar</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate pr-8">{previewImageName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted/50">
            {previewImage && (
              <img
                src={previewImage}
                alt={previewImageName}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              asChild
            >
              <a href={previewImage!} download={previewImageName}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(previewImage!, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              In neuem Tab
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPreviewImage(null)}
            >
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
