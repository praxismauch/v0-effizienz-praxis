"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Globe,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  FileText,
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { upload } from "@vercel/blob/client"

interface ReviewImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  practiceId: string
  onImportComplete: () => void
}

const ReviewImportDialog = ({ open, onOpenChange, practiceId, onImportComplete }: ReviewImportDialogProps) => {
  const [activeTab, setActiveTab] = useState("csv")
  const [platform, setPlatform] = useState<string>("jameda")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // CSV Import state
  const [csvData, setCsvData] = useState("")
  const [parsedReviews, setParsedReviews] = useState<any[]>([])

  // Apify state
  const [apifyApiKey, setApifyApiKey] = useState("")
  const [doctorUrl, setDoctorUrl] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [city, setCity] = useState("")
  const [specialty, setSpecialty] = useState("")

  // Google Business state
  const [googleAccessToken, setGoogleAccessToken] = useState("")
  const [googleAccountId, setGoogleAccountId] = useState("")
  const [googleLocationId, setGoogleLocationId] = useState("")

  // AI Extraction state
  const [extractionText, setExtractionText] = useState("")
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const resetState = () => {
    setResult(null)
    setError(null)
    setParsedReviews([])
  }

  // Parse CSV data
  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) return []

    const headers = lines[0].split(/[,;\t]/).map((h) => h.trim().toLowerCase().replace(/"/g, ""))
    const reviews: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,;\t]/).map((v) => v.trim().replace(/"/g, ""))
      if (values.length >= 2) {
        const review: any = {}
        headers.forEach((header, index) => {
          if (values[index]) {
            // Map common header names
            if (header.includes("name") || header.includes("autor") || header.includes("reviewer")) {
              review.reviewer_name = values[index]
            } else if (header.includes("rating") || header.includes("bewertung") || header.includes("stern")) {
              review.rating = values[index]
            } else if (header.includes("text") || header.includes("kommentar") || header.includes("comment")) {
              review.review_text = values[index]
            } else if (header.includes("date") || header.includes("datum")) {
              review.review_date = values[index]
            } else if (header.includes("kategorie") || header.includes("category")) {
              review.category = values[index]
            }
          }
        })
        if (review.rating || review.review_text) {
          reviews.push(review)
        }
      }
    }

    return reviews
  }

  const handleCSVChange = (text: string) => {
    setCsvData(text)
    const parsed = parseCSV(text)
    setParsedReviews(parsed)
  }

  // File drop handler for images
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      })
      setUploadedImageUrl(blob.url)
    } catch (err: any) {
      setError("Fehler beim Hochladen: " + err.message)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  // Import handlers
  const handleCSVImport = async () => {
    if (parsedReviews.length === 0) {
      setError("Keine Bewertungen zum Importieren gefunden")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews/import/csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          reviews: parsedReviews,
          fileName: "csv_import",
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResult(data)
      onImportComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApifyImport = async () => {
    if (!apifyApiKey) {
      setError("Apify API Key erforderlich")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews/import/apify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apifyApiKey,
          doctorUrl,
          doctorName,
          city,
          specialty,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResult(data)
      onImportComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleImport = async () => {
    if (!googleAccessToken || !googleAccountId || !googleLocationId) {
      setError("Alle Google Business Profile Felder erforderlich")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews/import/google-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: googleAccessToken,
          accountId: googleAccountId,
          locationId: googleLocationId,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResult(data)
      onImportComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIExtraction = async () => {
    if (!extractionText && !uploadedImageUrl) {
      setError("Text oder Bild erforderlich")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/practices/${practiceId}/reviews/import/ai-extract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          textContent: extractionText || undefined,
          imageUrl: uploadedImageUrl || undefined,
          fileName: uploadedImageUrl ? "image_extraction" : "text_extraction",
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResult(data)
      onImportComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bewertungen importieren
          </DialogTitle>
          <DialogDescription>
            Importieren Sie Bewertungen aus verschiedenen Quellen automatisch oder manuell
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform selector for CSV and AI */}
          {(activeTab === "csv" || activeTab === "ai") && (
            <div className="space-y-2">
              <Label>Plattform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="jameda">Jameda</SelectItem>
                  <SelectItem value="sanego">Sanego</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v)
              resetState()
            }}
          >
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="csv" className="flex items-center gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">CSV/Text</span>
              </TabsTrigger>
              <TabsTrigger value="apify" className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Jameda API</span>
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center gap-1">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="hidden sm:inline">Google API</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">KI-Extraktion</span>
              </TabsTrigger>
            </TabsList>

            {/* CSV Import */}
            <TabsContent value="csv" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CSV/Text Import</CardTitle>
                  <CardDescription>
                    Fügen Sie Bewertungsdaten im CSV-Format ein. Spalten: name, rating, text, date, category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={`name;rating;text;date\nMax Mustermann;5;Sehr zufrieden!;2024-01-15\nAnna Schmidt;4;Gute Beratung;2024-01-10`}
                    value={csvData}
                    onChange={(e) => handleCSVChange(e.target.value)}
                    className="min-h-[200px] font-mono text-sm"
                  />
                  {parsedReviews.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{parsedReviews.length} Bewertungen erkannt</AlertDescription>
                    </Alert>
                  )}
                  <Button onClick={handleCSVImport} disabled={isLoading || parsedReviews.length === 0}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Importieren
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Apify Jameda */}
            <TabsContent value="apify" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Jameda Bewertungen via Apify
                    <Badge variant="secondary">Automatisch</Badge>
                  </CardTitle>
                  <CardDescription>Automatischer Import von Jameda-Bewertungen über den Apify Scraper</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Sie benötigen einen Apify Account und API Key.{" "}
                      <a
                        href="https://apify.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline inline-flex items-center gap-1"
                      >
                        Apify Account erstellen <ExternalLink className="h-3 w-3" />
                      </a>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Apify API Key *</Label>
                    <Input
                      type="password"
                      value={apifyApiKey}
                      onChange={(e) => setApifyApiKey(e.target.value)}
                      placeholder="apify_api_..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Jameda Arzt-URL (optional)</Label>
                    <Input
                      value={doctorUrl}
                      onChange={(e) => setDoctorUrl(e.target.value)}
                      placeholder="https://www.jameda.de/arzt/..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Direkte URL zu Ihrem Jameda-Profil für schnelleren Import
                    </p>
                  </div>

                  <div className="text-sm text-muted-foreground">Oder suchen nach:</div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Arztname</Label>
                      <Input
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        placeholder="Dr. Max Mustermann"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stadt</Label>
                      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="München" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Fachrichtung</Label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Hausarzt, Zahnarzt, ..."
                    />
                  </div>

                  <Button onClick={handleApifyImport} disabled={isLoading || !apifyApiKey}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />}
                    Bewertungen abrufen
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Google Business Profile */}
            <TabsContent value="google" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Google Business Profile API
                    <Badge variant="secondary">Offiziell</Badge>
                  </CardTitle>
                  <CardDescription>Importieren Sie Ihre Google-Bewertungen über die offizielle API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Sie benötigen Zugang zur Google Business Profile API.{" "}
                      <a
                        href="https://developers.google.com/my-business"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline inline-flex items-center gap-1"
                      >
                        Dokumentation <ExternalLink className="h-3 w-3" />
                      </a>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Access Token *</Label>
                    <Input
                      type="password"
                      value={googleAccessToken}
                      onChange={(e) => setGoogleAccessToken(e.target.value)}
                      placeholder="ya29.a0..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Account ID *</Label>
                      <Input
                        value={googleAccountId}
                        onChange={(e) => setGoogleAccountId(e.target.value)}
                        placeholder="123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location ID *</Label>
                      <Input
                        value={googleLocationId}
                        onChange={(e) => setGoogleLocationId(e.target.value)}
                        placeholder="987654321"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGoogleImport}
                    disabled={isLoading || !googleAccessToken || !googleAccountId || !googleLocationId}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Bewertungen importieren
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Extraction */}
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    KI-gestützte Extraktion
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">KI</Badge>
                  </CardTitle>
                  <CardDescription>
                    Laden Sie Screenshots oder kopieren Sie Text, und die KI extrahiert die Bewertungen automatisch
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Image upload */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Screenshot hochladen
                    </Label>
                    <div
                      {...getRootProps()}
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        isDragActive
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50"
                      }`}
                    >
                      <input {...getInputProps()} />
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Wird hochgeladen...</span>
                        </div>
                      ) : uploadedImageUrl ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500" />
                          <p className="text-sm text-green-600">Bild hochgeladen</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setUploadedImageUrl(null)
                            }}
                          >
                            Anderes Bild
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {isDragActive ? "Hier ablegen..." : "Screenshot hierher ziehen oder klicken"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground">oder</div>

                  {/* Text input */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Text einfügen
                    </Label>
                    <Textarea
                      value={extractionText}
                      onChange={(e) => setExtractionText(e.target.value)}
                      placeholder="Kopieren Sie hier den Text mit den Bewertungen ein..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <Button onClick={handleAIExtraction} disabled={isLoading || (!extractionText && !uploadedImageUrl)}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Mit KI extrahieren
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Result display */}
          {result && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Import erfolgreich! {result.imported || result.totalExtracted || 0} Bewertungen importiert
                {result.skipped > 0 && `, ${result.skipped} übersprungen (bereits vorhanden)`}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ReviewImportDialog
