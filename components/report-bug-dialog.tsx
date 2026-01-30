"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bug, Upload, X, Loader2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { useTicketConfig } from "@/lib/tickets/hooks"
import { typesToOptions, prioritiesToOptions } from "@/lib/tickets/utils"


// Helper function to upload file via API
async function uploadFileToServer(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Upload failed")
  }

  const data = await response.json()
  return data.url
}

interface ReportBugDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onTicketCreated?: () => void
}

function ReportBugDialog({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
  onTicketCreated,
}: ReportBugDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen : setInternalOpen

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("bug")
  const [priority, setPriority] = useState("medium")
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [batchImportOpen, setBatchImportOpen] = useState(false)
  const [batchText, setBatchText] = useState("")
  const [batchImporting, setBatchImporting] = useState(false)
  const { toast } = useToast()
  const { currentUser } = useUser()

  const { types, priorities, isLoading: configLoading } = useTicketConfig()

  const typeOptions = types ? typesToOptions(types) : []
  const priorityOptions = priorities ? prioritiesToOptions(priorities) : []

  useEffect(() => {
    if (!open) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter((item) => item.type.startsWith("image/"))

      if (imageItems.length > 0) {
        e.preventDefault()
        setUploadingScreenshot(true)

        try {
          for (const item of imageItems) {
            const file = item.getAsFile()
            if (file) {
              const url = await uploadFileToServer(file)
              setScreenshots((prev) => [...prev, url])
            }
          }

          toast({
            title: "Erfolg",
            description: `${imageItems.length} Screenshot(s) aus Zwischenablage hochgeladen`,
          })
        } catch (error) {
          console.error("[v0] Error uploading pasted image:", error)
          toast({
            title: "Fehler",
            description: "Bild aus Zwischenablage konnte nicht hochgeladen werden",
            variant: "destructive",
          })
        } finally {
          setUploadingScreenshot(false)
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => document.removeEventListener("paste", handlePaste)
  }, [open, toast])

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie nur Bilddateien hoch",
        variant: "destructive",
      })
      return
    }

    setUploadingScreenshot(true)
    try {
      for (const file of imageFiles) {
        const url = await uploadFileToServer(file)
        setScreenshots((prev) => [...prev, url])
      }

      toast({
        title: "Erfolg",
        description: `${imageFiles.length} Screenshot(s) hochgeladen`,
      })
    } catch (error) {
      console.error("[v0] Error uploading screenshot:", error)
      toast({
        title: "Fehler",
        description: "Screenshot konnte nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingScreenshot(false)
      // Reset the input
      e.target.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "Fehler",
        description: "Bitte laden Sie nur Bilddateien hoch",
        variant: "destructive",
      })
      return
    }

    setUploadingScreenshot(true)
    try {
      for (const file of imageFiles) {
        const url = await uploadFileToServer(file)
        setScreenshots((prev) => [...prev, url])
      }

      toast({
        title: "Erfolg",
        description: `${imageFiles.length} Screenshot(s) hochgeladen`,
      })
    } catch (error) {
      console.error("[v0] Error uploading screenshots:", error)
      toast({
        title: "Fehler",
        description: "Screenshots konnten nicht hochgeladen werden",
        variant: "destructive",
      })
    } finally {
      setUploadingScreenshot(false)
    }
  }

  const handleRemoveScreenshot = (url: string) => {
    setScreenshots(screenshots.filter((s) => s !== url))
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen Titel ein",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          description,
          type,
          priority,
          screenshot_urls: screenshots,
          practice_id: currentUser?.practice_id || null,
          user_name: currentUser?.name,
          user_email: currentUser?.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Error response from API:", data)
        throw new Error(data.error || "Failed to create ticket")
      }

      toast({
        title: "Erfolg",
        description: "Ihr Ticket wurde erfolgreich erstellt",
      })

      window.dispatchEvent(new CustomEvent("ticketCreated", { detail: data.ticket }))

      onTicketCreated?.()

      setOpen?.(false)
      setTitle("")
      setDescription("")
      setType("bug")
      setPriority("medium")
      setScreenshots([])
    } catch (error) {
      console.error("[v0] Error creating ticket:", error)
      const errorMessage = error instanceof Error ? error.message : "Ticket konnte nicht erstellt werden"
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBatchImport = async () => {
    if (!batchText.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie mindestens einen Bug-Titel ein",
        variant: "destructive",
      })
      return
    }

    const lines = batchText.split("\n").filter((line) => line.trim() !== "")

    if (lines.length === 0) {
      toast({
        title: "Fehler",
        description: "Keine gültigen Bug-Titel gefunden",
        variant: "destructive",
      })
      return
    }

    setBatchImporting(true)
    let successCount = 0
    let failCount = 0

    try {
      for (const line of lines) {
        try {
          const response = await fetch("/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              title: line.trim(),
              description: "",
              type: "bug",
              priority: "medium",
              screenshot_urls: [],
              practice_id: currentUser?.practice_id || null,
              user_name: currentUser?.name,
              user_email: currentUser?.email,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            window.dispatchEvent(new CustomEvent("ticketCreated", { detail: data.ticket }))
            successCount++
          } else {
            failCount++
          }
        } catch (error) {
          console.error("[v0] Error creating batch ticket:", error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Erfolg",
          description: `${successCount} Ticket(s) erfolgreich erstellt${failCount > 0 ? `, ${failCount} fehlgeschlagen` : ""}`,
        })
        onTicketCreated?.()
      }

      if (failCount === lines.length) {
        toast({
          title: "Fehler",
          description: "Alle Tickets konnten nicht erstellt werden",
          variant: "destructive",
        })
      }

      setBatchImportOpen(false)
      setOpen?.(false)
      setBatchText("")
    } catch (error) {
      console.error("[v0] Error in batch import:", error)
      toast({
        title: "Fehler",
        description: "Batch-Import fehlgeschlagen",
        variant: "destructive",
      })
    } finally {
      setBatchImporting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bug className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Bug oder Problem melden</DialogTitle>
            <DialogDescription>
              Beschreiben Sie das Problem, das Sie festgestellt haben. Screenshots helfen uns, das Problem schneller zu
              lösen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="Kurze Beschreibung des Problems"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Typ</Label>
                <Select value={type} onValueChange={setType} disabled={configLoading}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priorität</Label>
                <Select value={priority} onValueChange={setPriority} disabled={configLoading}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Beschreiben Sie das Problem im Detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Screenshots</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isDragging ? "border-primary bg-primary/5" : "border-muted"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-wrap gap-2">
                  {screenshots.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Screenshot ${index + 1}`}
                        className="h-20 w-20 object-cover rounded border"
                      />
                      <button
                        onClick={() => handleRemoveScreenshot(url)}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="h-20 w-20 flex items-center justify-center border-2 border-dashed rounded cursor-pointer hover:bg-muted transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleScreenshotUpload}
                      disabled={uploadingScreenshot}
                      multiple
                    />
                    {uploadingScreenshot ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {isDragging
                    ? "Lassen Sie die Dateien los..."
                    : "Ziehen Sie Bilder hierher, klicken Sie zum Hochladen oder drücken Sie Strg+V"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBatchImportOpen(true)
              }}
              className="w-full sm:w-auto sm:mr-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              Batch Import
            </Button>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setOpen?.(false)} className="flex-1 sm:flex-initial">
                Abbrechen
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="flex-1 sm:flex-initial">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ticket erstellen
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchImportOpen} onOpenChange={setBatchImportOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Batch Import - Mehrere Bugs erstellen</DialogTitle>
            <DialogDescription>
              Fügen Sie mehrere Bug-Titel ein (ein Titel pro Zeile). Alle Bugs werden automatisch mit Typ "Bug" und
              Priorität "Mittel" erstellt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="batch-text">Bug-Titel (ein Titel pro Zeile)</Label>
              <Textarea
                id="batch-text"
                placeholder="Login funktioniert nicht&#10;Dashboard lädt nicht&#10;Fehler beim Speichern&#10;..."
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {batchText.split("\n").filter((line) => line.trim() !== "").length} Bug(s) werden erstellt
              </p>
            </div>

            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <p className="font-medium">Automatische Einstellungen:</p>
              <p className="text-muted-foreground">
                • Typ: <span className="font-medium text-foreground">Bug</span>
              </p>
              <p className="text-muted-foreground">
                • Priorität: <span className="font-medium text-foreground">Mittel</span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchImportOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleBatchImport} disabled={batchImporting || !batchText.trim()}>
              {batchImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {batchImporting
                ? "Erstelle..."
                : `${batchText.split("\n").filter((line) => line.trim() !== "").length} Bugs erstellen`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReportBugDialog
export { ReportBugDialog }
