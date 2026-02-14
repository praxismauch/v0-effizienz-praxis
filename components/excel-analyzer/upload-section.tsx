"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileSpreadsheet, Settings } from "lucide-react"

interface UploadSectionProps {
  isUploading: boolean
  uploadProgress: number
  dragActiveStandard: boolean
  dragActiveAdvanced: boolean
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onAdvancedFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
  onDragStandard: (e: React.DragEvent) => void
  onDropStandard: (e: React.DragEvent) => void
  onDragAdvanced: (e: React.DragEvent) => void
  onDropAdvanced: (e: React.DragEvent) => void
}

export function UploadSection({
  isUploading,
  uploadProgress,
  dragActiveStandard,
  dragActiveAdvanced,
  onFileUpload,
  onAdvancedFileUpload,
  onDragStandard,
  onDropStandard,
  onDragAdvanced,
  onDropAdvanced,
}: UploadSectionProps) {
  return (
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
            onDragEnter={onDragStandard}
            onDragLeave={onDragStandard}
            onDragOver={onDragStandard}
            onDrop={onDropStandard}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileUpload}
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
            onDragEnter={onDragAdvanced}
            onDragLeave={onDragAdvanced}
            onDragOver={onDragAdvanced}
            onDrop={onDropAdvanced}
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onAdvancedFileUpload}
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
  )
}
