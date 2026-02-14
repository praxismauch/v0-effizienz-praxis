// ─── DB Schema Check types ───
export interface FieldIssue {
  field: string
  label: string
  severity: "error" | "warning"
  message: string
  fix?: string
}

export interface FieldResult {
  name: string
  label: string
  type: string
  required: boolean
  existsInDb: boolean
  dbType?: string
  dbNullable?: boolean
}

export interface FormResult {
  id: string
  name: string
  table: string
  category?: string
  component: string
  columnCount?: number
  hasPracticeId?: boolean
  hasCreatedAt?: boolean
  hasUpdatedAt?: boolean
  hasDeletedAt?: boolean
  status: "ok" | "warning" | "error" | "missing_table"
  issues: FieldIssue[]
  fields: FieldResult[]
}

export interface CategoryStat {
  name: string
  count: number
}

export interface SyncData {
  results: FormResult[]
  summary: {
    total: number
    ok: number
    warnings: number
    errors: number
    totalColumns?: number
    withPracticeId?: number
    categories?: CategoryStat[]
  }
}

// ─── Form Scan types ───
export interface FormScanIssue {
  severity: "error" | "warning" | "info"
  message: string
}

export interface FormScanResult {
  id: string
  componentFile: string
  method: string
  apiUrl: string
  apiUrlNormalized: string
  lineNumber: number
  formFields: string[]
  apiRoute: string | null
  apiRouteFile: string | null
  targetTables: string[]
  dbFields: Record<string, string[]>
  status: "ok" | "warning" | "error"
  issues: FormScanIssue[]
}

export interface FormScanData {
  results: FormScanResult[]
  summary: {
    totalSubmissions: number
    uniqueComponents: number
    uniqueApiRoutes: number
    uniqueTables: number
    ok: number
    warnings: number
    errors: number
    methodCounts: { POST: number; PATCH: number; PUT: number }
    scannedFiles: number
    scannedApiRoutes: number
  }
}

// ─── History types ───
export interface HistoryEntry {
  id: string
  scan_type: "db-schema" | "form-scan"
  summary: any
  total: number
  ok: number
  warnings: number
  errors: number
  duration_ms: number | null
  created_at: string
}
