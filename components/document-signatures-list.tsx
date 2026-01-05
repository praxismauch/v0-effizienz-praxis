"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileSignature, CheckCircle2, XCircle, Eye, Calendar, User } from "lucide-react"
import { usePractice } from "@/contexts/practice-context"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface DocumentSignature {
  id: string
  document_id: string
  signed_by: string
  signer_name: string
  signer_role: string | null
  signature_data: string
  signature_type: string
  signed_at: string
  is_valid: boolean
  revoked_at: string | null
  revocation_reason: string | null
}

interface DocumentSignaturesListProps {
  documentId: string
  documentName: string
}

export function DocumentSignaturesList({ documentId, documentName }: DocumentSignaturesListProps) {
  const { currentPractice } = usePractice()
  const [signatures, setSignatures] = useState<DocumentSignature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSignature, setSelectedSignature] = useState<DocumentSignature | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    if (currentPractice?.id && documentId) {
      fetchSignatures()
    }
  }, [currentPractice?.id, documentId])

  const fetchSignatures = async () => {
    if (!currentPractice?.id) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/documents/${documentId}/signatures`)
      if (response.ok) {
        const data = await response.json()
        setSignatures(data)
      }
    } catch (error) {
      console.error("Error fetching signatures:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewSignature = (signature: DocumentSignature) => {
    setSelectedSignature(signature)
    setIsPreviewOpen(true)
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Unterschriften werden geladen...</CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSignature className="h-5 w-5 text-primary" />
            Unterschriften
          </CardTitle>
          <CardDescription>
            {signatures.length === 0
              ? "Keine Unterschriften vorhanden"
              : `${signatures.filter((s) => s.is_valid).length} gültige Unterschrift(en)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {signatures.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Dieses Dokument wurde noch nicht unterschrieben.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {signatures.map((signature) => (
                <div
                  key={signature.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    signature.is_valid ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {signature.signer_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{signature.signer_name}</span>
                        {signature.is_valid ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Gültig
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                            <XCircle className="h-3 w-3 mr-1" />
                            Widerrufen
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {signature.signer_role && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {signature.signer_role}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(signature.signed_at), "dd.MM.yyyy HH:mm", { locale: de })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleViewSignature(signature)}>
                    <Eye className="h-4 w-4 mr-1" />
                    Ansehen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Unterschrift von {selectedSignature?.signer_name}</DialogTitle>
            <DialogDescription>
              Unterschrieben am{" "}
              {selectedSignature &&
                format(new Date(selectedSignature.signed_at), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
            </DialogDescription>
          </DialogHeader>
          {selectedSignature && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <img
                  src={selectedSignature.signature_data || "/placeholder.svg"}
                  alt={`Unterschrift von ${selectedSignature.signer_name}`}
                  className="max-w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium">{selectedSignature.signer_name}</p>
                </div>
                {selectedSignature.signer_role && (
                  <div>
                    <span className="text-muted-foreground">Rolle:</span>
                    <p className="font-medium">{selectedSignature.signer_role}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Typ:</span>
                  <p className="font-medium">
                    {selectedSignature.signature_type === "handwritten"
                      ? "Handschriftlich"
                      : selectedSignature.signature_type}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="font-medium">{selectedSignature.is_valid ? "Gültig" : "Widerrufen"}</p>
                </div>
              </div>
              {!selectedSignature.is_valid && selectedSignature.revocation_reason && (
                <div className="p-3 bg-red-50 rounded-lg text-sm">
                  <span className="text-red-800 font-medium">Widerrufsgrund:</span>
                  <p className="text-red-700">{selectedSignature.revocation_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default DocumentSignaturesList
