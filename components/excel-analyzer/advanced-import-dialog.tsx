"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, AlertCircle, Save, RefreshCw, Database } from "lucide-react"
import type { ImportConfig, ImportTemplate } from "./types"

interface AdvancedImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importConfig: ImportConfig
  onImportConfigChange: (config: ImportConfig) => void
  selectedTemplate: ImportTemplate | null
  columnHeaders: string[]
  columnMappings: Record<string, string>
  onColumnMappingsChange: (mappings: Record<string, string>) => void
  previewData: any[]
  validationErrors: string[]
  isUploading: boolean
  onProcessImport: () => void
}

export function AdvancedImportDialog({
  open,
  onOpenChange,
  importConfig,
  onImportConfigChange,
  selectedTemplate,
  columnHeaders,
  columnMappings,
  onColumnMappingsChange,
  previewData,
  validationErrors,
  isUploading,
  onProcessImport,
}: AdvancedImportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Erweiterte Import-Konfiguration</DialogTitle>
          <DialogDescription>
            Konfigurieren Sie Spalten-Mappings und Validierungsregeln für Ihren Import
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Konfiguration</TabsTrigger>
            <TabsTrigger value="mapping">Spalten-Mapping</TabsTrigger>
            <TabsTrigger value="preview">Vorschau</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Zeilen überspringen</Label>
                <Input
                  type="number"
                  value={importConfig.skipRows}
                  onChange={(e) =>
                    onImportConfigChange({ ...importConfig, skipRows: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Datumsformat</Label>
                <Select
                  value={importConfig.dateFormat}
                  onValueChange={(value) => onImportConfigChange({ ...importConfig, dateFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zahlenformat</Label>
                <Select
                  value={importConfig.numberFormat}
                  onValueChange={(value) => onImportConfigChange({ ...importConfig, numberFormat: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DE">{"Deutsch (1.234,56)"}</SelectItem>
                    <SelectItem value="US">{"US (1,234.56)"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zeichenkodierung</Label>
                <Select
                  value={importConfig.encoding}
                  onValueChange={(value) => onImportConfigChange({ ...importConfig, encoding: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTF-8">UTF-8</SelectItem>
                    <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                    <SelectItem value="Windows-1252">Windows-1252</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHeaders"
                checked={importConfig.hasHeaders}
                onCheckedChange={(checked) =>
                  onImportConfigChange({ ...importConfig, hasHeaders: !!checked })
                }
              />
              <Label htmlFor="hasHeaders">Erste Zeile enthält Spaltenüberschriften</Label>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {selectedTemplate && (
              <Alert>
                <Database className="h-4 w-4" />
                <AlertDescription>
                  {"Template \""}{selectedTemplate.name}{"\" ausgewählt. Ordnen Sie die Excel-Spalten den Template-Feldern zu."}
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-3">
              {previewData.length > 0 &&
                columnHeaders.map((excelColumn) => (
                  <div key={excelColumn} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <Label className="font-medium">{excelColumn}</Label>
                      <p className="text-sm text-muted-foreground">Beispiel: {previewData[0][excelColumn]}</p>
                    </div>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <Select
                        value={columnMappings[excelColumn] || "default"}
                        onValueChange={(value) =>
                          onColumnMappingsChange({ ...columnMappings, [excelColumn]: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Zielfeld auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Nicht zuordnen</SelectItem>
                          {selectedTemplate &&
                            Object.values(selectedTemplate.columnMappings).map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-3 border-b">
                <h4 className="font-medium">Datenvorschau ({previewData.length} Zeilen)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {columnHeaders.map((col) => (
                        <th key={col} className="p-2 text-left border-r">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        {row.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex} className="p-2 border-r">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={onProcessImport} disabled={isUploading || validationErrors.length > 0}>
                {isUploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Import starten
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
