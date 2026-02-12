import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

// Human-readable German labels for known tables
const TABLE_LABELS: Record<string, string> = {
  users: "Benutzer",
  practices: "Praxen",
  practice_members: "Praxis-Mitglieder",
  practice_settings: "Praxis-Einstellungen",
  rooms: "Räume",
  arbeitsplaetze: "Arbeitsplätze",
  contacts: "Kontakte",
  tasks: "Aufgaben",
  task_comments: "Aufgaben-Kommentare",
  documents: "Dokumente",
  document_folders: "Dokumenten-Ordner",
  appointments: "Termine",
  surveys: "Umfragen",
  survey_responses: "Umfrage-Antworten",
  medical_devices: "Medizingeräte",
  inventory_items: "Inventar-Artikel",
  inventory_bills: "Rechnungen",
  equipment: "Arbeitsmittel",
  certifications: "Zertifizierungen",
  training_events: "Schulungstermine",
  training_participants: "Schulungsteilnehmer",
  org_chart_positions: "Organigramm-Positionen",
  teams: "Teams",
  team_members: "Team-Mitglieder",
  goals: "Ziele",
  milestones: "Meilensteine",
  protocols: "Protokolle",
  protocol_items: "Protokoll-Punkte",
  absences: "Abwesenheiten",
  absence_requests: "Abwesenheitsanträge",
  working_hours: "Arbeitszeiten",
  time_entries: "Zeiteinträge",
  shifts: "Schichten",
  shift_templates: "Schichtvorlagen",
  locations: "Standorte",
  notifications: "Benachrichtigungen",
  audit_logs: "Audit-Logs",
  specialty_groups: "Fachrichtungen",
  orga_categories: "Organisations-Kategorien",
  checklists: "Checklisten",
  checklist_items: "Checklisten-Einträge",
  test_checklist_templates: "Test-Checklisten-Vorlagen",
  workflows: "Workflows",
  workflow_steps: "Workflow-Schritte",
  homeoffice_policies: "Homeoffice-Richtlinien",
  kpi_definitions: "KPI-Definitionen",
  kpi_values: "KPI-Werte",
  practice_parameters: "Praxis-Parameter",
  sidebar_preferences: "Sidebar-Einstellungen",
  dashboard_widget_settings: "Dashboard-Widget-Einstellungen",
  weekly_summary_settings: "Wochen-Report-Einstellungen",
  calendar_events: "Kalender-Termine",
  messages: "Nachrichten",
  message_threads: "Nachrichtenverläufe",
  files: "Dateien",
  tags: "Tags",
  notes: "Notizen",
  templates: "Vorlagen",
  suppliers: "Lieferanten",
  patients: "Patienten",
  patient_records: "Patientenakten",
  prescriptions: "Rezepte",
  invoices: "Rechnungen",
  payments: "Zahlungen",
  reports: "Berichte",
  feedback: "Feedback",
  announcements: "Ankündigungen",
  maintenance_records: "Wartungsprotokollen",
  device_inspections: "Geräteprüfungen",
  quality_reports: "Qualitätsberichte",
}

// Categorize tables by function
function categorizeTable(tableName: string): string {
  if (tableName.match(/^(users|practice_members|teams|team_members|org_chart)/)) return "Personal & Organisation"
  if (tableName.match(/^(task|checklist|workflow)/)) return "Aufgaben & Workflows"
  if (tableName.match(/^(document|file|template)/)) return "Dokumente & Dateien"
  if (tableName.match(/^(appointment|calendar|schedule|shift|absence|working_hour|time_entr)/)) return "Termine & Zeiten"
  if (tableName.match(/^(room|arbeitspl|location|equipment)/)) return "Räume & Ausstattung"
  if (tableName.match(/^(medical_device|inventory|maintenance|device_inspection)/)) return "Inventar & Geräte"
  if (tableName.match(/^(survey|feedback|quality)/)) return "Umfragen & Qualität"
  if (tableName.match(/^(training|certification)/)) return "Schulungen & Zertifizierungen"
  if (tableName.match(/^(practice|setting|sidebar|dashboard|homeoffice|kpi|parameter|weekly)/)) return "Einstellungen & Konfiguration"
  if (tableName.match(/^(contact|message|notification|announcement)/)) return "Kommunikation"
  if (tableName.match(/^(invoice|payment|bill|supplier)/)) return "Finanzen"
  if (tableName.match(/^(protocol|audit|report|log)/)) return "Protokolle & Berichte"
  if (tableName.match(/^(goal|milestone)/)) return "Ziele & Meilensteine"
  if (tableName.match(/^(patient|prescription)/)) return "Patienten"
  if (tableName.match(/^(tag|note|specialty)/)) return "Stammdaten"
  return "Sonstige"
}

// Map Postgres types to simple type labels
function mapPgType(dataType: string, udtName: string): string {
  if (["text", "character varying", "varchar", "char", "character", "name", "citext"].includes(udtName)) return "string"
  if (["int4", "int8", "int2", "numeric", "float4", "float8"].includes(udtName)) return "number"
  if (["bool"].includes(udtName)) return "boolean"
  if (["jsonb", "json"].includes(udtName)) return "json"
  if (["uuid"].includes(udtName)) return "uuid"
  if (["timestamp", "timestamptz", "date"].includes(udtName)) return "date"
  if (["ARRAY"].includes(dataType)) return "array"
  return dataType
}

export async function GET(request: Request) {
  await cookies()

  const startTime = Date.now()

  try {
    // Use PostgREST OpenAPI schema to discover all tables and columns
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/openapi+json",
      },
    })

    if (!response.ok) {
      throw new Error(`PostgREST schema fetch failed: ${response.status}`)
    }

    const schema = await response.json()
    const tableColumnsMap: Record<string, any[]> = {}

    // Parse OpenAPI definitions into our table/column format
    const definitions = schema.definitions || {}
    for (const [tableName, def] of Object.entries(definitions) as [string, any][]) {
      const props = def.properties || {}
      const requiredFields = def.required || []
      
      const cols = Object.entries(props).map(([name, prop]: [string, any]) => ({
        column_name: name,
        data_type: prop.format || prop.type || "text",
        is_nullable: requiredFields.includes(name) ? "NO" : "YES",
        column_default: prop.default || null,
        udt_name: prop.format || prop.type || "text",
      }))
      
      tableColumnsMap[tableName] = cols
    }

    // Filter out internal/system tables and views
    const systemTables = new Set(["schema_migrations", "migrations", "buckets", "objects", "s3_multipart_uploads", "s3_multipart_uploads_parts", "secrets", "decrypted_secrets", "refresh_tokens", "instances", "audit_log_entries", "schema_version", "sessions", "mfa_factors", "mfa_challenges", "mfa_amr_claims", "sso_providers", "sso_domains", "saml_providers", "saml_relay_states", "flow_state", "identities", "one_time_tokens", "ticket_stats"])
    
    const filteredTables = Object.keys(tableColumnsMap)
      .filter((t) => !systemTables.has(t) && !t.startsWith("_"))
      .sort()

    // Build results for each table
    const results = filteredTables.map((tableName) => {
      const columns = tableColumnsMap[tableName] || []
      const label = TABLE_LABELS[tableName] || tableName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      const category = categorizeTable(tableName)

      // Count row data via columns analysis
      const hasId = columns.some((c: any) => c.column_name === "id")
      const hasPracticeId = columns.some((c: any) => c.column_name === "practice_id")
      const hasCreatedAt = columns.some((c: any) => c.column_name === "created_at")
      const hasUpdatedAt = columns.some((c: any) => c.column_name === "updated_at")
      const hasDeletedAt = columns.some((c: any) => c.column_name === "deleted_at")

      const issues: any[] = []

      // Check for common best-practice columns
      if (!hasId) {
        issues.push({
          field: "id",
          label: "ID",
          severity: "warning",
          message: "Tabelle hat keine 'id' Spalte",
        })
      }

      if (!hasCreatedAt) {
        issues.push({
          field: "created_at",
          label: "Erstellt am",
          severity: "warning",
          message: "Tabelle hat keine 'created_at' Spalte",
        })
      }

      const fields = columns.map((col: any) => ({
        name: col.column_name,
        label: col.column_name.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type: mapPgType(col.data_type, col.udt_name),
        required: col.is_nullable === "NO" && !col.column_default,
        existsInDb: true,
        dbType: `${col.data_type} (${col.udt_name})`,
        dbNullable: col.is_nullable === "YES",
      }))

      const hasErrors = issues.some((i: any) => i.severity === "error")
      const hasWarnings = issues.some((i: any) => i.severity === "warning")

      return {
        id: tableName,
        name: label,
        table: tableName,
        category,
        component: "",
        columnCount: columns.length,
        hasPracticeId,
        hasCreatedAt,
        hasUpdatedAt,
        hasDeletedAt,
        status: hasErrors ? "error" : hasWarnings ? "warning" : "ok",
        issues,
        fields,
      }
    })

    // Summary stats
    const categories = [...new Set(results.map((r) => r.category))].sort()
    const categoryStats = categories.map((cat) => ({
      name: cat,
      count: results.filter((r) => r.category === cat).length,
    }))

    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error").length,
      totalColumns: results.reduce((sum, r) => sum + r.columnCount, 0),
      withPracticeId: results.filter((r) => r.hasPracticeId).length,
      categories: categoryStats,
    }

    const durationMs = Date.now() - startTime

    // Save to history (fire-and-forget)
    const origin = new URL(request.url).origin
    fetch(`${origin}/api/super-admin/form-db-sync-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scan_type: "db-schema",
        summary,
        total: summary.total,
        ok: summary.ok,
        warnings: summary.warnings,
        errors: summary.errors,
        duration_ms: durationMs,
      }),
    }).catch((err) => console.error("[v0] Failed to save db-schema history:", err))

    return NextResponse.json({ results, summary, duration_ms: durationMs })
  } catch (error) {
    console.error("[v0] Form-DB sync check error:", error)
    return NextResponse.json(
      { error: "Fehler beim Prüfen der Form-DB-Synchronisation" },
      { status: 500 },
    )
  }
}
