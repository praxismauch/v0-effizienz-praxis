"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Table2,
  ArrowRight,
} from "lucide-react"
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

// Maps field keys to German labels
const FIELD_LABELS: Record<string, { label: string; description: string }> = {
  dateIndex: { label: "Datum", description: "Buchungsdatum der Transaktion" },
  categoryIndex: { label: "Kategorie", description: "Art der Buchung" },
  senderIndex: { label: "Name", description: "Auftraggeber / Empfänger" },
  descriptionIndex: { label: "Verwendungszweck", description: "Buchungstext / Referenz" },
  amountIndex: { label: "Betrag", description: "Transaktionsbetrag" },
}

// Check if a mapping field was likely auto-detected (header matches known patterns)
function isAutoDetected(headers: string[], index: number, fieldKey: string): boolean {
  if (!headers[index]) return false
  const h = headers[index].toLowerCase().trim()
  const patterns: Record<string, string[]> = {
    dateIndex: ["buchungstag", "buchungsdatum", "datum", "date", "valuta", "wertstellung"],
    amountIndex: ["betrag", "amount", "umsatz", "soll/haben", "soll", "haben", "buchungsbetrag"],
    senderIndex: ["empfänger", "empfaenger", "auftraggeber", "beguenstigter", "begünstigter", "name", "kontoname"],
    descriptionIndex: ["verwendungszweck", "buchungstext", "beschreibung", "text", "zahlungsgrund"],
    categoryIndex: ["kategorie", "category", "buchungsart", "art", "typ", "umsatzart"],
  }
  return (patterns[fieldKey] || []).some((p) => h.includes(p))
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
  const headers = previewData[0] || []
  const dataRows = previewData.slice(1, 4) // Show 3 data rows

  // Which column indices are mapped
  const mappedIndices = new Set([
    mapping.dateIndex,
    mapping.categoryIndex,
    mapping.senderIndex,
    mapping.descriptionIndex,
    mapping.amountIndex,
  ])

  return (
    <Card>
      <CardContent className="pt-6">
        {!uploadStats ? (
          <div className="space-y-4">
            {/* Drop zone */}
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
              <div className="space-y-5 border rounded-lg p-5 bg-muted/30">
                {/* File info header */}
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground font-medium">Vorschau:</p>
                    <h3 className="text-lg font-semibold text-foreground truncate">{file.name}</h3>
                  </div>
                  <Badge variant="outline" className="shrink-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Auto-Mapping
                  </Badge>
                </div>

                {/* Column mapping section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    Spaltenzuordnung
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((fieldKey) => {
                      const { label, description } = FIELD_LABELS[fieldKey]
                      const mappingKey = fieldKey as keyof CSVMapping
                      const value = mapping[mappingKey]
                      const autoDetected = isAutoDetected(headers, value, fieldKey)

                      return (
                        <div
                          key={fieldKey}
                          className={`space-y-1.5 p-3 rounded-lg border transition-colors ${
                            autoDetected
                              ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                              : "bg-background border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">{label}</Label>
                            {autoDetected && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                erkannt
                              </span>
                            )}
                          </div>
                          <select
                            className="w-full p-2 border rounded-md bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            value={value}
                            onChange={(e) =>
                              setMapping({ ...mapping, [mappingKey]: Number(e.target.value) })
                            }
                          >
                            {headers.map((header, i) => (
                              <option key={i} value={i}>
                                {header} (Spalte {i + 1})
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-muted-foreground">{description}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Data preview table */}
                {dataRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Table2 className="h-4 w-4 text-primary" />
                      Datenvorschau ({dataRows.length} von {previewData.length - 1} Zeilen)
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/60">
                            {headers.map((header, i) => (
                              <th
                                key={i}
                                className={`px-3 py-2 text-left font-medium whitespace-nowrap border-b ${
                                  mappedIndices.has(i)
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="truncate max-w-[120px]">{header}</span>
                                  {mappedIndices.has(i) && (
                                    <span className="text-[9px] font-normal opacity-75">
                                      {Object.entries(mapping).find(
                                        ([, val]) => val === i,
                                      )?.[0]
                                        ? FIELD_LABELS[
                                            Object.entries(mapping).find(
                                              ([, val]) => val === i,
                                            )![0]
                                          ]?.label
                                        : ""}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {dataRows.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}
                            >
                              {headers.map((_, colIndex) => (
                                <td
                                  key={colIndex}
                                  className={`px-3 py-1.5 border-b whitespace-nowrap max-w-[150px] truncate ${
                                    mappedIndices.has(colIndex)
                                      ? "bg-primary/5 font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                  title={row[colIndex] || ""}
                                >
                                  {row[colIndex] || "-"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Import button */}
                <Button onClick={onUpload} disabled={uploading} className="w-full" size="lg">
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Wird importiert...
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
          /* Upload complete stats */
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
