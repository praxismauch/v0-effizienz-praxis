"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  FolderOpen,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  ImageIcon,
  File,
  Upload,
  Clock,
  AlertCircle,
} from "lucide-react"

interface ImportedFile {
  id: string
  name: string
  size: number
  type: string
  source: string
  category: string
  targetSection: string
  status: "pending" | "processing" | "completed" | "failed"
  error?: string
  createdAt: string
  aiConfidence?: number
}

interface ExternalDataImportProps {
  practiceId: string
}

export function ExternalDataImport({ practiceId }: ExternalDataImportProps) {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [includeSubfolders, setIncludeSubfolders] = useState(true)
  const [autoImport, setAutoImport] = useState(false)
  const [importSchedule, setImportSchedule] = useState<string>("manual")
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  // Check Google Drive connection status
  useEffect(() => {
    checkConnectionStatus()
  }, [practiceId])

  const checkConnectionStatus = async () => {
    try {
      const res = await fetch(`/api/external-data/google-drive/status?practiceId=${practiceId}`)
      const data = await res.json()
      setIsConnected(data.connected)
    } catch (error) {
      console.error("Failed to check connection:", error)
    }
  }

  const connectGoogleDrive = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/external-data/google-drive/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceId }),
      })

      const data = await res.json()

      if (data.authUrl) {
        // Open Google OAuth in new window
        window.open(data.authUrl, "_blank", "width=600,height=700")

        // Poll for connection status
        const pollInterval = setInterval(async () => {
          await checkConnectionStatus()
          const statusRes = await fetch(`/api/external-data/google-drive/status?practiceId=${practiceId}`)
          const statusData = await statusRes.json()

          if (statusData.connected) {
            setIsConnected(true)
            clearInterval(pollInterval)
            toast({
              title: "Erfolgreich verbunden",
              description: "Google Drive wurde erfolgreich verbunden.",
            })
          }
        }, 2000)

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000)
      }
    } catch (error) {
      toast({
        title: "Verbindungsfehler",
        description: "Google Drive konnte nicht verbunden werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectFolder = async () => {
    try {
      const res = await fetch(`/api/external-data/google-drive/folders?practiceId=${practiceId}`)
      const data = await res.json()

      // In a real implementation, this would open a folder picker
      // For now, we'll show available folders
      console.log("Available folders:", data.folders)

      toast({
        title: "Ordner auswählen",
        description: "Ordnerauswahl wird geöffnet...",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ordner konnten nicht geladen werden.",
        variant: "destructive",
      })
    }
  }

  const startImport = async () => {
    if (!selectedFolder) {
      toast({
        title: "Kein Ordner ausgewählt",
        description: "Bitte wählen Sie einen Ordner aus.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      const res = await fetch("/api/external-data/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practiceId,
          source: "google-drive",
          folderId: selectedFolder,
          includeSubfolders,
        }),
      })

      const data = await res.json()

      if (data.success) {
        // Simulate progress
        let progress = 0
        const progressInterval = setInterval(() => {
          progress += 10
          setImportProgress(progress)

          if (progress >= 100) {
            clearInterval(progressInterval)
            loadImportHistory()
            toast({
              title: "Import abgeschlossen",
              description: `${data.filesProcessed} Dateien wurden erfolgreich importiert.`,
            })
          }
        }, 500)
      }
    } catch (error) {
      toast({
        title: "Import fehlgeschlagen",
        description: "Dateien konnten nicht importiert werden.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  const loadImportHistory = async () => {
    try {
      const res = await fetch(`/api/external-data/history?practiceId=${practiceId}`)
      const data = await res.json()
      setImportedFiles(data.files || [])
    } catch (error) {
      console.error("Failed to load import history:", error)
    }
  }

  useEffect(() => {
    if (isConnected) {
      loadImportHistory()
    }
  }, [isConnected])

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "kv-abrechnung": "bg-blue-500",
      documents: "bg-green-500",
      protocols: "bg-purple-500",
      team: "bg-orange-500",
      other: "bg-gray-500",
    }
    return colors[category] || colors.other
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Externe Datenquellen
          </CardTitle>
          <CardDescription>Importieren Sie automatisch Dateien aus externen Quellen wie Google Drive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Drive Connection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Google Drive</Label>
                <p className="text-sm text-muted-foreground">Verbinden Sie Ihr Google Drive Konto</p>
              </div>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verbunden
                </Badge>
              ) : (
                <Button onClick={connectGoogleDrive} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Verbinden
                </Button>
              )}
            </div>
          </div>

          {isConnected && (
            <>
              {/* Folder Selection */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="folder-select">Quellordner</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folder-select"
                      placeholder="Ordner auswählen..."
                      value={selectedFolder}
                      readOnly
                      className="flex-1"
                    />
                    <Button onClick={selectFolder} variant="outline">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Durchsuchen
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="subfolders">Unterordner einbeziehen</Label>
                  <Switch id="subfolders" checked={includeSubfolders} onCheckedChange={setIncludeSubfolders} />
                </div>
              </div>

              {/* Auto Import Settings */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-import">Automatischer Import</Label>
                    <p className="text-sm text-muted-foreground">
                      Dateien automatisch in regelmäßigen Abständen importieren
                    </p>
                  </div>
                  <Switch id="auto-import" checked={autoImport} onCheckedChange={setAutoImport} />
                </div>

                {autoImport && (
                  <div className="space-y-2">
                    <Label htmlFor="schedule">Zeitplan</Label>
                    <Select value={importSchedule} onValueChange={setImportSchedule}>
                      <SelectTrigger id="schedule">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manuell</SelectItem>
                        <SelectItem value="hourly">Stündlich</SelectItem>
                        <SelectItem value="daily">Täglich</SelectItem>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Import Action */}
              <div className="pt-4 border-t">
                <Button onClick={startImport} disabled={isImporting || !selectedFolder} className="w-full">
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importiere Dateien...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import starten
                    </>
                  )}
                </Button>

                {isImporting && (
                  <div className="mt-4 space-y-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm text-center text-muted-foreground">{importProgress}% abgeschlossen</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Import History */}
      {isConnected && importedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Import-Verlauf
            </CardTitle>
            <CardDescription>Übersicht aller importierten Dateien und deren Kategorisierung</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {importedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">{getFileIcon(file.type)}</div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        {file.status === "completed" && (
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                        {file.status === "failed" && <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />}
                        {file.status === "processing" && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>{file.source}</span>
                        <span>•</span>
                        <span>{new Date(file.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-xs ${getCategoryColor(file.category)} text-white`}>
                          {file.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          → {file.targetSection}
                        </Badge>
                        {file.aiConfidence && (
                          <Badge variant="outline" className="text-xs">
                            KI: {Math.round(file.aiConfidence * 100)}%
                          </Badge>
                        )}
                      </div>

                      {file.error && (
                        <div className="flex items-start gap-1 text-xs text-red-600 mt-1">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>{file.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExternalDataImport
