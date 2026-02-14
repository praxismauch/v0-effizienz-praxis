"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, FileText, CheckCircle } from "lucide-react"
import * as XLSX from "xlsx"
import type { ExcelData, ChartConfig, ImportTemplate, ImportConfig } from "./excel-analyzer/types"
import { DEFAULT_IMPORT_CONFIG, DEFAULT_TEMPLATES } from "./excel-analyzer/types"
import { UploadSection } from "./excel-analyzer/upload-section"
import { AdvancedImportDialog } from "./excel-analyzer/advanced-import-dialog"
import { DataAnalysisSection } from "./excel-analyzer/data-analysis-section"

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
  const [importTemplates] = useState<ImportTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null)
  const [importConfig, setImportConfig] = useState<ImportConfig>(DEFAULT_IMPORT_CONFIG)
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
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsUploading(false)
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
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
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
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveStandard(true)
    else if (e.type === "dragleave") setDragActiveStandard(false)
  }

  const handleDropStandard = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveStandard(false)
    const files = e.dataTransfer.files
    if (files?.[0]) {
      handleFileUpload({ target: { files: [files[0]] } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const handleDragAdvanced = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveAdvanced(true)
    else if (e.type === "dragleave") setDragActiveAdvanced(false)
  }

  const handleDropAdvanced = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAdvanced(false)
    const files = e.dataTransfer.files
    if (files?.[0]) {
      handleAdvancedFileUpload({ target: { files: [files[0]] } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const validateData = () => {
    const errors: string[] = []
    if (!selectedTemplate) errors.push("Bitte wählen Sie ein Import-Template aus")
    if (Object.keys(columnMappings).length === 0) errors.push("Bitte ordnen Sie mindestens eine Spalte zu")
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
    setTimeout(() => {
      const newFile: ExcelData = {
        fileName: `imported_${Date.now()}.xlsx`,
        uploadDate: new Date().toISOString().split("T")[0],
        columns: Object.values(columnMappings),
        rowCount: previewData.length,
        data: previewData.map((row) => {
          const mappedRow: Record<string, any> = {}
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

  const filteredData = useMemo(() => {
    if (!selectedFile) return []
    let data = selectedFile.data
    if (chartConfig.timeRange !== "all") {
      const now = new Date()
      const daysBack =
        chartConfig.timeRange === "30d" ? 30 : chartConfig.timeRange === "90d" ? 90 : chartConfig.timeRange === "1y" ? 365 : 0
      if (daysBack > 0) {
        const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
        data = data.filter((item) => new Date(item[chartConfig.xAxis]) >= cutoffDate)
      }
    }
    return data
  }, [selectedFile, chartConfig.timeRange, chartConfig.xAxis])

  return (
    <div className="space-y-6">
      <UploadSection
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        dragActiveStandard={dragActiveStandard}
        dragActiveAdvanced={dragActiveAdvanced}
        onFileUpload={handleFileUpload}
        onAdvancedFileUpload={handleAdvancedFileUpload}
        onDragStandard={handleDragStandard}
        onDropStandard={handleDropStandard}
        onDragAdvanced={handleDragAdvanced}
        onDropAdvanced={handleDropAdvanced}
      />

      {/* Import Templates */}
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

      <AdvancedImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        importConfig={importConfig}
        onImportConfigChange={setImportConfig}
        selectedTemplate={selectedTemplate}
        columnHeaders={columnHeaders}
        columnMappings={columnMappings}
        onColumnMappingsChange={setColumnMappings}
        previewData={previewData}
        validationErrors={validationErrors}
        isUploading={isUploading}
        onProcessImport={processImport}
      />

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
                        {file.rowCount} Zeilen &bull; {file.columns.length} Spalten &bull; {file.uploadDate}
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

      {selectedFile && (
        <DataAnalysisSection
          selectedFile={selectedFile}
          chartConfig={chartConfig}
          onChartConfigChange={setChartConfig}
          filteredData={filteredData}
        />
      )}
    </div>
  )
}

export default ExcelUploadAnalyzer
