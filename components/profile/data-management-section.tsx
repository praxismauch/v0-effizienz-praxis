"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Download, Trash2, Shield, AlertTriangle, FileText, Database } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"

export function DataManagementSection() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExportData = async () => {
    if (!currentUser) return

    setIsExporting(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/export-data`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Fehler beim Exportieren der Daten")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `meine-daten-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Daten exportiert",
        description: "Ihre persönlichen Daten wurden erfolgreich heruntergeladen.",
      })
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
      toast({
        title: "Fehler beim Export",
        description: "Ihre Daten konnten nicht exportiert werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!currentUser) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/delete-account`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Fehler beim Löschen des Kontos")
      }

      toast({
        title: "Konto gelöscht",
        description: "Ihr Konto und alle zugehörigen Daten wurden permanent gelöscht.",
      })

      // Redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/"
      }, 2000)
    } catch (error) {
      console.error("[v0] Error deleting account:", error)
      toast({
        title: "Fehler beim Löschen",
        description: "Ihr Konto konnte nicht gelöscht werden. Bitte kontaktieren Sie den Support.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Datenexport
          </CardTitle>
          <CardDescription>Laden Sie eine Kopie Ihrer persönlichen Daten herunter (DSGVO Art. 15)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Der Export enthält alle Ihre gespeicherten persönlichen Daten in einem maschinenlesbaren JSON-Format,
              einschließlich Profildaten, Einstellungen und Aktivitätsprotokolle.
            </AlertDescription>
          </Alert>
          <Button onClick={handleExportData} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Exportiere...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Meine Daten exportieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Deletion */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Konto löschen
          </CardTitle>
          <CardDescription>Löschen Sie Ihr Konto und alle zugehörigen Daten permanent (DSGVO Art. 17)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Achtung:</strong> Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden
              permanent gelöscht, einschließlich:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>Persönliche Informationen und Profildaten</li>
                <li>Alle Einstellungen und Präferenzen</li>
                <li>Aktivitätsprotokolle und Verlauf</li>
                <li>Alle hochgeladenen Dateien und Dokumente</li>
              </ul>
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Konto permanent löschen
          </Button>
        </CardContent>
      </Card>

      {/* Cookie Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cookie-Verwaltung
          </CardTitle>
          <CardDescription>Verwalten Sie Ihre Cookie-Einstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Cookies helfen uns, Ihre Erfahrung zu verbessern. Sie können Ihre Präferenzen jederzeit ändern.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("cookie-consent")
              window.location.reload()
            }}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            Cookie-Einstellungen ändern
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Sind Sie sicher?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Diese Aktion löscht permanent:</p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Ihr gesamtes Konto</li>
                <li>Alle persönlichen Daten</li>
                <li>Alle Einstellungen und Präferenzen</li>
                <li>Alle hochgeladenen Dateien</li>
                <li>Ihren gesamten Aktivitätsverlauf</li>
              </ul>
              <p className="font-semibold mt-4">Diese Aktion kann nicht rückgängig gemacht werden!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Lösche...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ja, Konto löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
