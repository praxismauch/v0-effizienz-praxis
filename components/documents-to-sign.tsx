"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileSignature,
  Search,
  MoreVertical,
  FileText,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { DocumentSignDialog } from "@/components/document-sign-dialog"
import { DocumentSignaturesList } from "@/components/document-signatures-list"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"

interface Document {
  id: string
  name: string
  file_url: string
  file_type: string
  signature_required: boolean
  signature_status: string
  signature_deadline: string | null
  created_at: string
  signatures_count?: number
}

export function DocumentsToSign() {
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)
  const [showSignaturesList, setShowSignaturesList] = useState<string | null>(null)

  useEffect(() => {
    if (currentPractice?.id) {
      fetchDocuments()
    }
  }, [currentPractice?.id])

  useEffect(() => {
    if (searchQuery) {
      setFilteredDocuments(documents.filter((doc) => doc.name.toLowerCase().includes(searchQuery.toLowerCase())))
    } else {
      setFilteredDocuments(documents)
    }
  }, [searchQuery, documents])

  const fetchDocuments = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/documents?all=true`)
      if (response.ok) {
        const data = await response.json()
        // Fetch signature counts for each document
        const docsWithCounts = await Promise.all(
          data.map(async (doc: Document) => {
            try {
              const sigRes = await fetch(`/api/practices/${currentPractice.id}/documents/${doc.id}/signatures`)
              if (sigRes.ok) {
                const sigs = await sigRes.json()
                return { ...doc, signatures_count: sigs.length }
              }
            } catch {
              // Ignore errors
            }
            return { ...doc, signatures_count: 0 }
          }),
        )
        setDocuments(docsWithCounts)
        setFilteredDocuments(docsWithCounts)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast.error("Fehler beim Laden der Dokumente")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setIsSignDialogOpen(true)
  }

  const handleViewSignatures = (docId: string) => {
    setShowSignaturesList(showSignaturesList === docId ? null : docId)
  }

  const getStatusBadge = (doc: Document) => {
    const count = doc.signatures_count || 0

    if (count === 0) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700">
          <Clock className="h-3 w-3 mr-1" />
          Nicht unterschrieben
        </Badge>
      )
    }

    if (doc.signature_status === "fully_signed") {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Vollständig ({count})
        </Badge>
      )
    }

    if (doc.signature_status === "partially_signed") {
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Teilweise ({count})
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
        <FileSignature className="h-3 w-3 mr-1" />
        {count} Unterschrift(en)
      </Badge>
    )
  }

  const getFileIcon = (fileType: string) => {
    return <FileText className="h-5 w-5 text-blue-600" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Dokumente werden geladen...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                Dokumente unterschreiben
              </CardTitle>
              <CardDescription>Unterschreiben Sie Dokumente digital und verwalten Sie Unterschriften</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dokument suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 text-sm text-muted-foreground">
              <span>{documents.length} Dokumente</span>
              <span>|</span>
              <span>{documents.reduce((acc, doc) => acc + (doc.signatures_count || 0), 0)} Unterschriften</span>
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Keine Dokumente gefunden</p>
              <p className="text-sm">Laden Sie Dokumente im Tab "Dateien & Ordner" hoch, um sie zu unterschreiben.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dokument</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erstellt am</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <>
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(doc.file_type)}
                            <span className="font-medium">{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{doc.file_type?.split("/")[1]?.toUpperCase() || "Datei"}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(doc)}</TableCell>
                        <TableCell>{format(new Date(doc.created_at), "dd.MM.yyyy", { locale: de })}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleSignDocument(doc)}>
                                <FileSignature className="h-4 w-4 mr-2" />
                                Unterschreiben
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewSignatures(doc.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Unterschriften anzeigen
                              </DropdownMenuItem>
                              {doc.file_url && (
                                <DropdownMenuItem asChild>
                                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Herunterladen
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {showSignaturesList === doc.id && (
                        <TableRow>
                          <TableCell colSpan={5} className="bg-muted/30 p-4">
                            <DocumentSignaturesList documentId={doc.id} documentName={doc.name} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentSignDialog
        open={isSignDialogOpen}
        onOpenChange={setIsSignDialogOpen}
        document={selectedDocument}
        onSigned={() => {
          fetchDocuments()
          setSelectedDocument(null)
        }}
      />
    </div>
  )
}

export default DocumentsToSign
