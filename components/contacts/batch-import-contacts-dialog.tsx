"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"

interface BatchImportContactsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BatchImportContactsDialog({ open, onOpenChange, onSuccess }: BatchImportContactsDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserClient()
  const { currentUser } = useUser()

  async function handleFileUpload(file: File) {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie eine CSV- oder Excel-Datei hoch",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      if (!currentUser?.practice_id) throw new Error("Keine Praxis zugeordnet")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("practice_id", currentUser.practice_id)
      formData.append("created_by", currentUser.id)

      const response = await fetch("/api/contacts/batch-import", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Import fehlgeschlagen")

      const result = await response.json()

      toast({
        title: "Erfolg",
        description: `${result.imported} Kontakte wurden importiert`,
      })
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kontakte importieren</DialogTitle>
        </DialogHeader>
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center"
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFileUpload(file)
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Kontakte werden importiert...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">CSV- oder Excel-Datei hochladen</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Ziehen Sie eine Datei hierher oder klicken Sie zum Hochladen
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                id="file-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
              />
              <Button type="button" onClick={() => document.getElementById("file-upload")?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Datei hochladen
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BatchImportContactsDialog
