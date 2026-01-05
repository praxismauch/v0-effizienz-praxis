"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { SignaturePad } from "@/components/signature-pad"
import { FileSignature, Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DocumentSignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: {
    id: string
    name: string
    file_url?: string
  } | null
  onSigned?: () => void
}

export function DocumentSignDialog({ open, onOpenChange, document, onSigned }: DocumentSignDialogProps) {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [signerName, setSignerName] = useState(currentUser?.name || "")
  const [signerRole, setSignerRole] = useState(currentUser?.role || "")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isSigning, setIsSigning] = useState(false)

  const handleSign = async () => {
    if (!document || !signatureData || !signerName || !agreedToTerms) {
      toast.error("Bitte füllen Sie alle erforderlichen Felder aus und unterschreiben Sie das Dokument.")
      return
    }

    if (!currentPractice?.id || !currentUser?.id) {
      toast.error("Benutzer oder Praxis nicht gefunden.")
      return
    }

    setIsSigning(true)

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/documents/${document.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature_data: signatureData,
          signer_name: signerName,
          signer_role: signerRole,
          signed_by: currentUser.id,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Fehler beim Signieren")
      }

      toast.success("Dokument erfolgreich unterschrieben")
      onOpenChange(false)
      resetForm()
      onSigned?.()
    } catch (error) {
      console.error("Error signing document:", error)
      toast.error(error instanceof Error ? error.message : "Fehler beim Signieren des Dokuments")
    } finally {
      setIsSigning(false)
    }
  }

  const resetForm = () => {
    setSignatureData(null)
    setSignerName(currentUser?.name || "")
    setSignerRole(currentUser?.role || "")
    setAgreedToTerms(false)
  }

  if (!document) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            Dokument unterschreiben
          </DialogTitle>
          <DialogDescription>
            Sie unterschreiben das Dokument: <strong>{document.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Signer Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signerName">Name des Unterzeichners *</Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Ihr vollständiger Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signerRole">Position / Rolle</Label>
              <Input
                id="signerRole"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value)}
                placeholder="z.B. Arzt, MFA, Praxismanager"
              />
            </div>
          </div>

          {/* Signature Pad */}
          <SignaturePad onSignatureChange={setSignatureData} />

          {/* Legal Agreement */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Mit Ihrer Unterschrift bestätigen Sie, dass Sie das Dokument gelesen und verstanden haben und den Inhalt
              akzeptieren.
            </AlertDescription>
          </Alert>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
              Ich bestätige, dass ich berechtigt bin, dieses Dokument zu unterschreiben, und dass meine elektronische
              Unterschrift rechtlich bindend ist.
            </label>
          </div>

          {!signatureData && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Bitte unterschreiben Sie im Feld oben, um fortzufahren.</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSigning}>
            Abbrechen
          </Button>
          <Button onClick={handleSign} disabled={isSigning || !signatureData || !signerName || !agreedToTerms}>
            {isSigning ? (
              "Wird unterschrieben..."
            ) : (
              <>
                <FileSignature className="mr-2 h-4 w-4" />
                Dokument unterschreiben
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentSignDialog
