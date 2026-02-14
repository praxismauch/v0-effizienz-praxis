"use client"

export interface ExcelData {
  fileName: string
  uploadDate: string
  columns: string[]
  rowCount: number
  data: Record<string, any>[]
}

export interface ChartConfig {
  type: "line" | "area" | "bar" | "pie"
  xAxis: string
  yAxis: string[]
  timeRange: string
  groupBy?: string
}

export interface ImportTemplate {
  id: string
  name: string
  description: string
  columnMappings: Record<string, string>
  validationRules: ValidationRule[]
}

export interface ValidationRule {
  column: string
  type: "required" | "numeric" | "date" | "email" | "range"
  params?: any
}

export interface ImportConfig {
  skipRows: number
  hasHeaders: boolean
  dateFormat: string
  numberFormat: string
  encoding: string
  delimiter: string
}

export const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  skipRows: 0,
  hasHeaders: true,
  dateFormat: "DD.MM.YYYY",
  numberFormat: "DE",
  encoding: "UTF-8",
  delimiter: ",",
}

export const DEFAULT_TEMPLATES: ImportTemplate[] = [
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
]

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
]
