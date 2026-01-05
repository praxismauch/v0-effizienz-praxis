"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileSpreadsheet,
  BarChart3,
  LineChartIcon,
  PieChartIcon,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  Settings,
  MapPin,
  CheckCircle,
  AlertCircle,
  Save,
  FileText,
  Database,
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import * as XLSX from "xlsx"

interface ExcelData {
  fileName: string
  uploadDate: string
  columns: string[]
  rowCount: number
  data: Record<string, any>[]
}

interface ChartConfig {
  type: "line" | "area" | "bar" | "pie"
  xAxis: string
  yAxis: string[]
  timeRange: string
  groupBy?: string
}

interface ImportTemplate {
  id: string
  name: string
  description: string
  columnMappings: Record<string, string>
  validationRules: ValidationRule[]
}

interface ValidationRule {
  column: string
  type: "required" | "numeric" | "date" | "email" | "range"
  params?: any
}

interface ImportConfig {
  skipRows: number
  hasHeaders: boolean
  dateFormat: string
  numberFormat: string
  encoding: string
  delimiter: string
}

export function ExcelUploadAnalyzer() {
  const [uploadedFiles, setUploadedFiles] = useState<ExcelData[]>([
    {
      fileName: "praxis_daten_2024.xlsx",
      uploadDate: "2024-01-28",
      columns: ["Datum", "Umsatz", "Patienten", "Behandlungen", "Mitarbeiter", "Zufriedenheit", "Kosten"],
      rowCount: 365,
      data: [],
    },
  ])
  const [selectedFile, setSelectedFile] = useState<ExcelData | null>(uploadedFiles[0] || null)
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    type: "line",
    xAxis: "Datum",
    yAxis: ["Umsatz"],
    timeRange: "all",
  })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const [importTemplates, setImportTemplates] = useState<ImportTemplate[]>([
    {
      id: "medical-data",
      name: "Medizinische Daten",
      description: "Standard-Template für Patientendaten und Behandlungen",
      columnMappings: {
        "Patient ID": "patient_id",
        Name: "patient_name",
        Datum: "date",
        Behandlung: "treatment",
        Kosten: "cost",
      },
      validationRules: [
        { column: "patient_id", type: "required" },
        { column: "date", type: "date" },
        { column: "cost", type: "numeric", params: { min: 0 } },
      ],
    },
    {
      id: "financial-data",
      name: "Finanzdaten",
      description: "Template für Umsatz- und Kostendaten",
      columnMappings: {
        Datum: "date",
        Umsatz: "revenue",
        Kosten: "costs",
        Gewinn: "profit",
      },
      validationRules: [
        { column: "date", type: "required" },
        { column: "revenue", type: "numeric" },
        { column: "costs", type: "numeric" },
      ],
    },
  ])

  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null)
  const [importConfig, setImportConfig] = useState<ImportConfig>({
    skipRows: 0,
    hasHeaders: true,
    dateFormat: "DD.MM.YYYY",
    numberFormat: "DE",
    encoding: "UTF-8",
    delimiter: ",",
  })

  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [columnHeaders, setColumnHeaders] = useState<string[]>([])

  const [dragActiveStandard, setDragActiveStandard] = useState(false)
  const [dragActiveAdvanced, setDragActiveAdvanced] = useState(false)

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate file upload and processing
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)

          // Add mock processed file
          const newFile: ExcelData = {
            fileName: file.name,
            uploadDate: new Date().toISOString().split("T")[0],
            columns: ["Datum", "Wert1", "Wert2", "Wert3", "Kategorie"],
            rowCount: Math.floor(Math.random() * 500) + 100,
            data: [],
          }

          setUploadedFiles((prev) => [...prev, newFile])
          setSelectedFile(newFile)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }, [])

  const handleAdvancedFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setShowImportDialog(true)

    // Simulate file parsing and preview generation
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      const firstRows = parsedData.slice(0, 5)
      setPreviewData(firstRows.map((row) => row.map((cell) => cell.toString())))
      setColumnHeaders(parsedData[0].map((header) => header.toString()))
    }
    reader.readAsArrayBuffer(file)

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }, [])

  const handleDragStandard = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveStandard(true)
    } else if (e.type === "dragleave") {
      setDragActiveStandard(false)
    }
  }

  const handleDropStandard = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveStandard(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        // Create a synthetic event to reuse existing upload logic
        const syntheticEvent = {
          target: { files: [file] },
        } as React.ChangeEvent<HTMLInputElement>
        handleFileUpload(syntheticEvent)
      }
    }
  }

  const handleDragAdvanced = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveAdvanced(true)
    } else if (e.type === "dragleave") {
      setDragActiveAdvanced(false)
    }
  }

  const handleDropAdvanced = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAdvanced(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file) {
        const syntheticEvent = {
          target: { files: [file] },
        } as React.ChangeEvent<HTMLInputElement>
        handleAdvancedFileUpload(syntheticEvent)
      }
    }
  }

  const validateData = () => {
    const errors: string[] = []

    if (!selectedTemplate) {
      errors.push("Bitte wählen Sie ein Import-Template aus")
    }

    if (Object.keys(columnMappings).length === 0) {
      errors.push("Bitte ordnen Sie mindestens eine Spalte zu")
    }

    // Validate against template rules
    if (selectedTemplate) {
      selectedTemplate.validationRules.forEach((rule) => {
        const mappedColumn = Object.keys(columnMappings).find((key) => columnMappings[key] === rule.column)
        if (rule.type === "required" && !mappedColumn) {
          errors.push(`Pflichtfeld '${rule.column}' ist nicht zugeordnet`)
        }
      })
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const processImport = () => {
    if (!validateData()) return

    setIsUploading(true)

    // Simulate data processing
    setTimeout(() => {
      const newFile: ExcelData = {
        fileName: `imported_${Date.now()}.xlsx`,
        uploadDate: new Date().toISOString().split("T")[0],
        columns: Object.values(columnMappings),
        rowCount: previewData.length,
        data: previewData.map((row) => {
          const mappedRow: any = {}
          Object.keys(columnMappings).forEach((originalCol) => {
            mappedRow[columnMappings[originalCol]] = row[originalCol]
          })
          return mappedRow
        }),
      }

      setUploadedFiles((prev) => [...prev, newFile])
      setSelectedFile(newFile)
      setIsUploading(false)
      setShowImportDialog(false)
      setColumnMappings({})
      setPreviewData([])
    }, 2000)
  }

  const getFilteredData = () => {
    if (!selectedFile) return []

    let data = selectedFile.data

    // Apply time range filter
    if (chartConfig.timeRange !== "all") {
      const now = new Date()
      const daysBack =
        chartConfig.timeRange === "30d"
          ? 30
          : chartConfig.timeRange === "90d"
            ? 90
            : chartConfig.timeRange === "1y"
              ? 365
              : 0

      if (daysBack > 0) {
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        data = data.filter((item) => new Date(item[chartConfig.xAxis]) >= cutoffDate)
      }
    }

    return data
  }

  const renderChart = () => {
    const data = getFilteredData()
    if (!data.length) return null

    const colors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"]

    switch (chartConfig.type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={chartConfig.xAxis} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={chartConfig.xAxis} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.3}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey={chartConfig.xAxis} className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              {chartConfig.yAxis.map((key, index) => (
                <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        const pieData = data.slice(0, 10).map((item, index) => ({
          name: item[chartConfig.xAxis],
          value: item[chartConfig.yAxis[0]],
          color: colors[index % colors.length],
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Excel-Datei hochladen
          </CardTitle>
          <CardDescription>Laden Sie Excel-Dateien mit erweiterten Import-Optionen hoch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Standard Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActiveStandard ? "border-primary bg-primary/10" : "border-border"
              }`}
              onDragEnter={handleDragStandard}
              onDragLeave={handleDragStandard}
              onDragOver={handleDragStandard}
              onDrop={handleDropStandard}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="excel-upload"
                disabled={isUploading}
              />
              <label htmlFor="excel-upload" className="cursor-pointer">
                <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Standard Import</p>
                <p className="text-xs text-muted-foreground">Schneller Upload mit Standardeinstellungen</p>
                <p className="text-xs text-muted-foreground mt-1">Oder Datei hierher ziehen</p>
              </label>
            </div>

            {/* Advanced Upload */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActiveAdvanced ? "border-primary bg-primary/20" : "border-primary/50 bg-primary/5"
              }`}
              onDragEnter={handleDragAdvanced}
              onDragLeave={handleDragAdvanced}
              onDragOver={handleDragAdvanced}
              onDrop={handleDropAdvanced}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleAdvancedFileUpload}
                className="hidden"
                id="advanced-excel-upload"
                disabled={isUploading}
              />
              <label htmlFor="advanced-excel-upload" className="cursor-pointer">
                <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-primary">Erweiterte Import-Optionen</p>
                <p className="text-xs text-muted-foreground">Mit Spalten-Mapping und Validierung</p>
                <p className="text-xs text-muted-foreground mt-1">Oder Datei hierher ziehen</p>
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">{uploadProgress}% abgeschlossen</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Import-Templates
          </CardTitle>
          <CardDescription>Vordefinierte Templates für häufige Datentypen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {importTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    <div className="flex gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {Object.keys(template.columnMappings).length} Spalten
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.validationRules.length} Regeln
                      </Badge>
                    </div>
                  </div>
                  {selectedTemplate?.id === template.id && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
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
                      setImportConfig((prev) => ({ ...prev, skipRows: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Datumsformat</Label>
                  <Select
                    value={importConfig.dateFormat}
                    onValueChange={(value) => setImportConfig((prev) => ({ ...prev, dateFormat: value }))}
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
                    onValueChange={(value) => setImportConfig((prev) => ({ ...prev, numberFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DE">Deutsch (1.234,56)</SelectItem>
                      <SelectItem value="US">US (1,234.56)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Zeichenkodierung</Label>
                  <Select
                    value={importConfig.encoding}
                    onValueChange={(value) => setImportConfig((prev) => ({ ...prev, encoding: value }))}
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
                  onCheckedChange={(checked) => setImportConfig((prev) => ({ ...prev, hasHeaders: !!checked }))}
                />
                <Label htmlFor="hasHeaders">Erste Zeile enthält Spaltenüberschriften</Label>
              </div>
            </TabsContent>

            <TabsContent value="mapping" className="space-y-4">
              {selectedTemplate && (
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Template "{selectedTemplate.name}" ausgewählt. Ordnen Sie die Excel-Spalten den Template-Feldern zu.
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
                          onValueChange={(value) => setColumnMappings((prev) => ({ ...prev, [excelColumn]: value }))}
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
                          {row.map((cell, cellIndex) => (
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
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={processImport} disabled={isUploading || validationErrors.length > 0}>
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

      {/* Uploaded Files */}
      <Card>
        <CardHeader>
          <CardTitle>Hochgeladene Dateien</CardTitle>
          <CardDescription>Wählen Sie eine Datei zur Analyse aus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedFile?.fileName === file.fileName
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => setSelectedFile(file)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.rowCount} Zeilen • {file.columns.length} Spalten • {file.uploadDate}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedFile?.fileName === file.fileName ? "default" : "secondary"}>
                    {selectedFile?.fileName === file.fileName ? "Ausgewählt" : "Verfügbar"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Data Analysis */}
      {selectedFile && (
        <Card>
          <CardHeader>
            <CardTitle>Datenanalyse - {selectedFile.fileName}</CardTitle>
            <CardDescription>Konfigurieren Sie Parameter und Zeiträume für die Visualisierung</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="configure" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="configure" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Konfiguration
                </TabsTrigger>
                <TabsTrigger value="visualize" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Visualisierung
                </TabsTrigger>
              </TabsList>

              <TabsContent value="configure" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Diagrammtyp</label>
                    <Select
                      value={chartConfig.type}
                      onValueChange={(value: any) => setChartConfig((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">
                          <div className="flex items-center gap-2">
                            <LineChartIcon className="h-4 w-4" />
                            Liniendiagramm
                          </div>
                        </SelectItem>
                        <SelectItem value="area">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Flächendiagramm
                          </div>
                        </SelectItem>
                        <SelectItem value="bar">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Balkendiagramm
                          </div>
                        </SelectItem>
                        <SelectItem value="pie">
                          <div className="flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" />
                            Kreisdiagramm
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">X-Achse (Zeit)</label>
                    <Select
                      value={chartConfig.xAxis}
                      onValueChange={(value) => setChartConfig((prev) => ({ ...prev, xAxis: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedFile.columns.map((column) => (
                          <SelectItem key={column} value={column}>
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Zeitraum</label>
                    <Select
                      value={chartConfig.timeRange}
                      onValueChange={(value) => setChartConfig((prev) => ({ ...prev, timeRange: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Daten</SelectItem>
                        <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                        <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                        <SelectItem value="1y">Letztes Jahr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button className="gap-2 w-full">
                      <RefreshCw className="h-4 w-4" />
                      Aktualisieren
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Y-Achse Parameter (Werte)</label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {selectedFile.columns
                      .filter((col) => col !== chartConfig.xAxis)
                      .map((column) => (
                        <div key={column} className="flex items-center space-x-2">
                          <Checkbox
                            id={column}
                            checked={chartConfig.yAxis.includes(column)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setChartConfig((prev) => ({
                                  ...prev,
                                  yAxis: [...prev.yAxis, column],
                                }))
                              } else {
                                setChartConfig((prev) => ({
                                  ...prev,
                                  yAxis: prev.yAxis.filter((y) => y !== column),
                                }))
                              }
                            }}
                          />
                          <label htmlFor={column} className="text-sm">
                            {column}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visualize" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">
                      {chartConfig.type === "line"
                        ? "Liniendiagramm"
                        : chartConfig.type === "area"
                          ? "Flächendiagramm"
                          : chartConfig.type === "bar"
                            ? "Balkendiagramm"
                            : "Kreisdiagramm"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {chartConfig.yAxis.join(", ")} über {chartConfig.xAxis}
                    </p>
                  </div>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Exportieren
                  </Button>
                </div>

                <div className="border border-border rounded-lg p-4">{renderChart()}</div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Datenpunkte</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{getFilteredData().length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Parameter</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">{chartConfig.yAxis.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Zeitraum</span>
                      </div>
                      <p className="text-2xl font-bold mt-1">
                        {chartConfig.timeRange === "all"
                          ? "Alle"
                          : chartConfig.timeRange === "30d"
                            ? "30T"
                            : chartConfig.timeRange === "90d"
                              ? "90T"
                              : "1J"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ExcelUploadAnalyzer
