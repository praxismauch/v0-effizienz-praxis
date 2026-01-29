"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  Mail,
  Server,
  Lock,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Clock,
  Upload,
  Settings2,
  History,
  AlertCircle,
} from "lucide-react"

interface EmailConfig {
  id: string
  practice_id: string
  email_address: string
  email_type: string
  imap_host: string
  imap_port: number
  imap_user: string
  use_ssl: boolean
  target_folder_id: string | null
  allowed_file_types: string[]
  max_file_size_mb: number
  auto_analyze_with_ai: boolean
  is_active: boolean
  last_check_at: string | null
  last_error: string | null
  emails_processed: number
  documents_uploaded: number
  created_at: string
  updated_at: string
  processed_emails?: ProcessedEmail[]
}

interface ProcessedEmail {
  id: string
  from_address: string
  subject: string
  received_at: string
  processed_at: string
  attachments_count: number
  documents_created: number
  status: string
  error_message: string | null
}

interface Folder {
  id: string
  name: string
  parent_folder_id: string | null
}

interface EmailUploadConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  userId: string
  config?: EmailConfig | null
  folders: Folder[]
  onSaved: () => void
}

const FILE_TYPE_OPTIONS = [
  { value: "application/pdf", label: "PDF", icon: "📄" },
  { value: "application/msword", label: "DOC", icon: "📝" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX", icon: "📝" },
  { value: "application/vnd.ms-excel", label: "XLS", icon: "📊" },
  { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "XLSX", icon: "📊" },
]

export function EmailUploadConfigDialog({
  open,
  onOpenChange,
  practiceId,
  userId,
  config,
  folders,
  onSaved,
}: EmailUploadConfigDialogProps) {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message?: string
    error?: string
    details?: any
  } | null>(null)
  const [activeTab, setActiveTab] = useState("connection")

  const [formData, setFormData] = useState({
    email_address: "",
    imap_host: "",
    imap_port: 993,
    imap_user: "",
    imap_password: "",
    use_ssl: true,
    target_folder_id: "",
    allowed_file_types: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    max_file_size_mb: 25,
    auto_analyze_with_ai: false,
    is_active: true,
  })

  useEffect(() => {
    if (config) {
      setFormData({
        email_address: config.email_address || "",
        imap_host: config.imap_host || "",
        imap_port: config.imap_port || 993,
        imap_user: config.imap_user || "",
        imap_password: "", // Don't populate password
        use_ssl: config.use_ssl !== false,
        target_folder_id: config.target_folder_id || "",
        allowed_file_types: config.allowed_file_types || [],
        max_file_size_mb: config.max_file_size_mb || 25,
        auto_analyze_with_ai: config.auto_analyze_with_ai || false,
        is_active: config.is_active !== false,
      })
    } else {
      setFormData({
        email_address: "",
        imap_host: "",
        imap_port: 993,
        imap_user: "",
        imap_password: "",
        use_ssl: true,
        target_folder_id: "",
        allowed_file_types: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        max_file_size_mb: 25,
        auto_analyze_with_ai: false,
        is_active: true,
      })
    }
    setTestResult(null)
  }, [config, open])

  const handleTestConnection = async () => {
    if (!config?.id) {
      toast.error("Bitte speichern Sie zuerst die Konfiguration")
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const response = await fetch(`/api/practices/${practiceId}/email-upload-config/${config.id}/test`, {
        method: "POST",
      })
      const result = await response.json()
      setTestResult(result)

      if (result.success) {
        toast.success("Verbindung erfolgreich!")
      } else {
        toast.error(result.error || "Verbindung fehlgeschlagen")
      }
    } catch (error) {
      setTestResult({ success: false, error: "Netzwerkfehler" })
      toast.error("Verbindungstest fehlgeschlagen")
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.email_address || !formData.imap_host || !formData.imap_user) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email_address)) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein")
      return
    }

    // Validate IMAP host format
    if (formData.imap_host && !formData.imap_host.includes(".")) {
      toast.error("Bitte geben Sie einen gültigen IMAP-Host ein (z.B. imap.gmail.com)")
      return
    }

    // Validate port number
    if (formData.imap_port < 1 || formData.imap_port > 65535) {
      toast.error("IMAP-Port muss zwischen 1 und 65535 liegen")
      return
    }

    if (!config && !formData.imap_password) {
      toast.error("Bitte geben Sie ein Passwort ein")
      return
    }

    setLoading(true)

    try {
      const url = config
        ? `/api/practices/${practiceId}/email-upload-config/${config.id}`
        : `/api/practices/${practiceId}/email-upload-config`

      const method = config ? "PATCH" : "POST"

      const payload: any = {
        ...formData,
        target_folder_id: formData.target_folder_id || null,
        created_by: userId,
      }

      // Only include password if it was changed
      if (!formData.imap_password) {
        delete payload.imap_password
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Fehler beim Speichern")
      }

      toast.success(config ? "Konfiguration aktualisiert" : "Konfiguration erstellt")
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern")
    } finally {
      setLoading(false)
    }
  }

  const toggleFileType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      allowed_file_types: prev.allowed_file_types.includes(type)
        ? prev.allowed_file_types.filter((t) => t !== type)
        : [...prev.allowed_file_types, type],
    }))
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !loading) {
      // Reset test results and tab when closing
      setTestResult(null)
      setActiveTab("connection")
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {config ? "E-Mail Upload Konfiguration bearbeiten" : "Neue E-Mail Upload Konfiguration"}
          </DialogTitle>
          <DialogDescription>
            Konfigurieren Sie eine E-Mail-Adresse, um Dokumente automatisch per E-Mail hochzuladen
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connection" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Verbindung
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Einstellungen
            </TabsTrigger>
            {config && (
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Verlauf
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="connection" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email_address">E-Mail-Adresse *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email_address"
                    type="email"
                    placeholder="dokumente@praxis.de"
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="imap_host">IMAP Server *</Label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="imap_host"
                      placeholder="imap.example.com"
                      value={formData.imap_host}
                      onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="imap_port">Port</Label>
                  <Input
                    id="imap_port"
                    type="number"
                    value={formData.imap_port}
                    onChange={(e) => setFormData({ ...formData, imap_port: Number.parseInt(e.target.value) || 993 })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imap_user">Benutzername *</Label>
                <Input
                  id="imap_user"
                  placeholder="benutzername@praxis.de"
                  value={formData.imap_user}
                  onChange={(e) => setFormData({ ...formData, imap_user: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="imap_password">Passwort {config ? "(leer lassen um beizubehalten)" : "*"}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="imap_password"
                    type="password"
                    placeholder={config ? "••••••••" : "Passwort eingeben"}
                    value={formData.imap_password}
                    onChange={(e) => setFormData({ ...formData, imap_password: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="use_ssl"
                    checked={formData.use_ssl}
                    onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                  />
                  <Label htmlFor="use_ssl">SSL/TLS verwenden</Label>
                </div>
              </div>

              {config && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="w-full bg-transparent"
                  >
                    {testing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Verbindung testen
                  </Button>

                  {testResult && (
                    <Alert
                      className={`mt-3 ${testResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                    >
                      <AlertDescription className="flex items-start gap-2">
                        {testResult.success ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        )}
                        <div>
                          <p className={testResult.success ? "text-green-800" : "text-red-800"}>
                            {testResult.success ? testResult.message : testResult.error}
                          </p>
                          {testResult.details && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {testResult.details.totalMessages} Nachrichten, {testResult.details.unseenMessages}{" "}
                              ungelesen
                            </p>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="target_folder">Zielordner</Label>
                <Select
                  value={formData.target_folder_id}
                  onValueChange={(value) => setFormData({ ...formData, target_folder_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Automatisch (Email Uploads)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatisch (Email Uploads)</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          {folder.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Erlaubte Dateitypen</Label>
                <div className="flex flex-wrap gap-2">
                  {FILE_TYPE_OPTIONS.map((type) => (
                    <Badge
                      key={type.value}
                      variant={formData.allowed_file_types.includes(type.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleFileType(type.value)}
                    >
                      <span className="mr-1">{type.icon}</span>
                      {type.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="max_size">Maximale Dateigröße (MB)</Label>
                <Input
                  id="max_size"
                  type="number"
                  min={1}
                  max={100}
                  value={formData.max_file_size_mb}
                  onChange={(e) =>
                    setFormData({ ...formData, max_file_size_mb: Number.parseInt(e.target.value) || 25 })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">KI-Analyse</p>
                    <p className="text-sm text-muted-foreground">Dokumente automatisch mit KI analysieren</p>
                  </div>
                </div>
                <Switch
                  checked={formData.auto_analyze_with_ai}
                  onCheckedChange={(checked) => setFormData({ ...formData, auto_analyze_with_ai: checked })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Aktiv</p>
                    <p className="text-sm text-muted-foreground">E-Mails automatisch abrufen und verarbeiten</p>
                  </div>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {config && (
            <TabsContent value="history" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Statistiken</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{config.emails_processed}</p>
                      <p className="text-sm text-muted-foreground">E-Mails verarbeitet</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Upload className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{config.documents_uploaded}</p>
                      <p className="text-sm text-muted-foreground">Dokumente hochgeladen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {config.last_check_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Letzte Prüfung: {new Date(config.last_check_at).toLocaleString("de-DE")}
                </div>
              )}

              {config.last_error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{config.last_error}</AlertDescription>
                </Alert>
              )}

              {config.processed_emails && config.processed_emails.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Letzte E-Mails</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {config.processed_emails.slice(0, 10).map((email) => (
                      <Card key={email.id} className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-sm line-clamp-1">{email.subject || "Kein Betreff"}</p>
                            <p className="text-xs text-muted-foreground">{email.from_address}</p>
                          </div>
                          <Badge variant={email.status === "success" ? "default" : "destructive"}>
                            {email.documents_created} Dok.
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(email.processed_at).toLocaleString("de-DE")}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {config ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EmailUploadConfigDialog
