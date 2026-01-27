"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import type { CSVMapping, UploadStats } from "./types"

interface UploadTabProps {
  file: File | null
  previewData: string[][]
  mapping: CSVMapping
  setMapping: (mapping: CSVMapping) => void
  uploadStats: UploadStats | null
  setUploadStats: (stats: UploadStats | null) => void
  uploading: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onUpload: () => void
}

export function UploadTab({
  file,
  previewData,
  mapping,
  setMapping,
  uploadStats,
  setUploadStats,
  uploading,
  onFileChange,
  onUpload,
}: UploadTabProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {!uploadStats ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
              <Input
                type="file"
                accept=".csv,.txt"
                onChange={onFileChange}
                className="hidden"
                id="csv-upload"
              />
              <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl font-semibold mb-2">CSV-Datei hochladen</p>
              <p className="text-sm text-muted-foreground mb-6">
                Unterstützte Formate: CSV, TXT (mit Semikolon oder Komma getrennt)
              </p>
              <Label htmlFor="csv-upload" className="flex justify-center">
                <Button size="lg" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="h-5 w-5 mr-2" />
                    Datei auswählen
                  </span>
                </Button>
              </Label>
            </div>

            {file && previewData.length > 0 && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <FileText className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Vorschau:</p>
                    <h3 className="text-lg font-semibold text-foreground">{file.name}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label>Spalte Datum</Label>
                    <select
                      className="w-full p-2 border rounded bg-background text-sm"
                      value={mapping.dateIndex}
                      onChange={(e) => setMapping({ ...mapping, dateIndex: Number(e.target.value) })}
                    >
                      {previewData[0]?.map((header, i) => (
                        <option key={i} value={i}>
                          {header} (Spalte {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Spalte Kategorie</Label>
                    <select
                      className="w-full p-2 border rounded bg-background text-sm"
                      value={mapping.categoryIndex}
                      onChange={(e) => setMapping({ ...mapping, categoryIndex: Number(e.target.value) })}
                    >
                      {previewData[0]?.map((header, i) => (
                        <option key={i} value={i}>
                          {header} (Spalte {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Spalte Name</Label>
                    <select
                      className="w-full p-2 border rounded bg-background text-sm"
                      value={mapping.senderIndex}
                      onChange={(e) => setMapping({ ...mapping, senderIndex: Number(e.target.value) })}
                    >
                      {previewData[0]?.map((header, i) => (
                        <option key={i} value={i}>
                          {header} (Spalte {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Spalte Verwendungszweck</Label>
                    <select
                      className="w-full p-2 border rounded bg-background text-sm"
                      value={mapping.descriptionIndex}
                      onChange={(e) => setMapping({ ...mapping, descriptionIndex: Number(e.target.value) })}
                    >
                      {previewData[0]?.map((header, i) => (
                        <option key={i} value={i}>
                          {header} (Spalte {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Spalte Betrag</Label>
                    <select
                      className="w-full p-2 border rounded bg-background text-sm"
                      value={mapping.amountIndex}
                      onChange={(e) => setMapping({ ...mapping, amountIndex: Number(e.target.value) })}
                    >
                      {previewData[0]?.map((header, i) => (
                        <option key={i} value={i}>
                          {header} (Spalte {i + 1})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button onClick={onUpload} disabled={uploading} className="w-full" size="lg">
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Transaktionen importieren
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Import abgeschlossen</h3>
              <p className="text-muted-foreground">
                {uploadStats.new} neue Transaktionen wurden erfolgreich importiert.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-2xl font-bold">{uploadStats.total}</p>
                <p className="text-xs text-muted-foreground">Gesamt</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">{uploadStats.new}</p>
                <p className="text-xs text-muted-foreground">Neu</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-yellow-600">{uploadStats.skipped}</p>
                <p className="text-xs text-muted-foreground">Übersprungen</p>
              </div>
            </div>

            {uploadStats.errors && uploadStats.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">{uploadStats.errors.length} Fehler</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Einige Zeilen konnten nicht verarbeitet werden.
                </p>
              </div>
            )}

            <Button onClick={() => setUploadStats(null)} variant="outline">
              Weitere Datei hochladen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
