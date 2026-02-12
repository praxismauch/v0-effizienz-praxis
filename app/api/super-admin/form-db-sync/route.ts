import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

// Form schema definitions: what each form/dialog sends to the database
const FORM_SCHEMAS: FormSchema[] = [
  {
    id: "create-room",
    name: "Raum erstellen",
    table: "rooms",
    component: "components/rooms/create-room-dialog.tsx",
    fields: [
      { name: "name", type: "string", required: true, label: "Raumname" },
      { name: "description", type: "string", required: false, label: "Beschreibung" },
      { name: "room_type", type: "string", required: false, label: "Raumtyp" },
      { name: "floor", type: "string", required: false, label: "Etage" },
      { name: "capacity", type: "number", required: false, label: "Kapazität" },
      { name: "color", type: "string", required: false, label: "Farbe" },
      { name: "images", type: "json", required: false, label: "Bilder" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-contact",
    name: "Kontakt erstellen",
    table: "contacts",
    component: "app/contacts/page.tsx",
    fields: [
      { name: "name", type: "string", required: true, label: "Name" },
      { name: "company", type: "string", required: false, label: "Firma" },
      { name: "email", type: "string", required: false, label: "E-Mail" },
      { name: "phone", type: "string", required: false, label: "Telefon" },
      { name: "mobile", type: "string", required: false, label: "Mobil" },
      { name: "fax", type: "string", required: false, label: "Fax" },
      { name: "address", type: "string", required: false, label: "Adresse" },
      { name: "city", type: "string", required: false, label: "Stadt" },
      { name: "postal_code", type: "string", required: false, label: "PLZ" },
      { name: "website", type: "string", required: false, label: "Website" },
      { name: "notes", type: "string", required: false, label: "Notizen" },
      { name: "category", type: "string", required: false, label: "Kategorie" },
      { name: "is_favorite", type: "boolean", required: false, label: "Favorit" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-arbeitsplatz",
    name: "Arbeitsplatz erstellen",
    table: "arbeitsplaetze",
    component: "components/rooms/create-arbeitsplatz-dialog.tsx",
    fields: [
      { name: "name", type: "string", required: true, label: "Arbeitsplatzname" },
      { name: "description", type: "string", required: false, label: "Beschreibung" },
      { name: "arbeitsplatz_type", type: "string", required: false, label: "Typ" },
      { name: "room_id", type: "string", required: false, label: "Raum-ID" },
      { name: "color", type: "string", required: false, label: "Farbe" },
      { name: "use_room_color", type: "boolean", required: false, label: "Raumfarbe verwenden" },
      { name: "images", type: "json", required: false, label: "Bilder" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-medical-device",
    name: "Medizingerät erstellen",
    table: "medical_devices",
    component: "components/inventory/create-device-dialog.tsx",
    fields: [
      { name: "name", type: "string", required: true, label: "Gerätename" },
      { name: "manufacturer", type: "string", required: false, label: "Hersteller" },
      { name: "serial_number", type: "string", required: false, label: "Seriennummer" },
      { name: "device_type", type: "string", required: false, label: "Gerätetyp" },
      { name: "model_number", type: "string", required: false, label: "Modellnummer" },
      { name: "room_id", type: "string", required: false, label: "Raum-ID" },
      { name: "status", type: "string", required: false, label: "Status" },
      { name: "purchase_date", type: "string", required: false, label: "Kaufdatum" },
      { name: "warranty_end", type: "string", required: false, label: "Garantie bis" },
      { name: "next_maintenance", type: "string", required: false, label: "Nächste Wartung" },
      { name: "responsible_user_id", type: "string", required: false, label: "Verantwortlicher" },
      { name: "notes", type: "string", required: false, label: "Notizen" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-survey",
    name: "Umfrage erstellen",
    table: "surveys",
    component: "app/surveys/page.tsx",
    fields: [
      { name: "title", type: "string", required: true, label: "Titel" },
      { name: "description", type: "string", required: false, label: "Beschreibung" },
      { name: "survey_type", type: "string", required: false, label: "Umfragetyp" },
      { name: "status", type: "string", required: false, label: "Status" },
      { name: "is_anonymous", type: "boolean", required: false, label: "Anonym" },
      { name: "questions", type: "json", required: false, label: "Fragen" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-org-chart-position",
    name: "Organigramm-Position erstellen",
    table: "org_chart_positions",
    component: "app/organigramm/page-client.tsx",
    fields: [
      { name: "title", type: "string", required: true, label: "Positionsbezeichnung" },
      { name: "department", type: "string", required: false, label: "Abteilung" },
      { name: "parent_id", type: "string", required: false, label: "Übergeordnete Position" },
      { name: "assigned_user_id", type: "string", required: false, label: "Zugewiesene Person" },
      { name: "team_id", type: "string", required: false, label: "Team-ID" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-certification",
    name: "Zertifizierung erstellen",
    table: "certifications",
    component: "app/training/page.tsx",
    fields: [
      { name: "name", type: "string", required: true, label: "Name" },
      { name: "description", type: "string", required: false, label: "Beschreibung" },
      { name: "category", type: "string", required: false, label: "Kategorie" },
      { name: "validity_months", type: "number", required: false, label: "Gültigkeit (Monate)" },
      { name: "is_mandatory", type: "boolean", required: false, label: "Pflicht" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-training-event",
    name: "Schulungstermin erstellen",
    table: "training_events",
    component: "app/training/page.tsx",
    fields: [
      { name: "title", type: "string", required: true, label: "Titel" },
      { name: "description", type: "string", required: false, label: "Beschreibung" },
      { name: "event_type", type: "string", required: false, label: "Veranstaltungstyp" },
      { name: "location", type: "string", required: false, label: "Ort" },
      { name: "start_date", type: "string", required: false, label: "Startdatum" },
      { name: "end_date", type: "string", required: false, label: "Enddatum" },
      { name: "max_participants", type: "number", required: false, label: "Max. Teilnehmer" },
      { name: "cost_per_person", type: "number", required: false, label: "Kosten pro Person" },
      { name: "is_mandatory", type: "boolean", required: false, label: "Pflicht" },
      { name: "status", type: "string", required: false, label: "Status" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
  {
    id: "create-inventory-bill",
    name: "Rechnung hochladen",
    table: "inventory_bills",
    component: "app/inventory/bills/page.tsx",
    fields: [
      { name: "file_name", type: "string", required: true, label: "Dateiname" },
      { name: "file_url", type: "string", required: false, label: "Datei-URL" },
      { name: "file_type", type: "string", required: false, label: "Dateityp" },
      { name: "supplier_name", type: "string", required: false, label: "Lieferant" },
      { name: "bill_date", type: "string", required: false, label: "Rechnungsdatum" },
      { name: "bill_number", type: "string", required: false, label: "Rechnungsnummer" },
      { name: "total_amount", type: "number", required: false, label: "Gesamtbetrag" },
      { name: "status", type: "string", required: false, label: "Status" },
      { name: "practice_id", type: "string", required: true, label: "Praxis-ID" },
    ],
  },
]

interface FormField {
  name: string
  type: string
  required: boolean
  label: string
}

interface FormSchema {
  id: string
  name: string
  table: string
  component: string
  fields: FormField[]
}

interface DbColumn {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
  udt_name: string
}

interface FieldIssue {
  field: string
  label: string
  severity: "error" | "warning"
  message: string
  fix?: string
}

interface FormResult {
  id: string
  name: string
  table: string
  component: string
  status: "ok" | "warning" | "error" | "missing_table"
  issues: FieldIssue[]
  fields: {
    name: string
    label: string
    type: string
    required: boolean
    existsInDb: boolean
    dbType?: string
    dbNullable?: boolean
  }[]
}

// Map form types to compatible Postgres types
const TYPE_COMPAT: Record<string, string[]> = {
  string: ["text", "character varying", "varchar", "char", "uuid", "character", "name", "citext", "USER-DEFINED"],
  number: ["integer", "bigint", "smallint", "numeric", "real", "double precision", "int4", "int8", "float4", "float8"],
  boolean: ["boolean", "bool"],
  json: ["jsonb", "json"],
  date: ["date", "timestamp without time zone", "timestamp with time zone", "timestamptz", "timestamp"],
}

function isTypeCompatible(formType: string, dbDataType: string, dbUdtName: string): boolean {
  const compatible = TYPE_COMPAT[formType] || []
  return compatible.some(
    (t) => dbDataType.toLowerCase().includes(t.toLowerCase()) || dbUdtName.toLowerCase().includes(t.toLowerCase()),
  )
}

export async function GET() {
  await cookies()

  try {
    const supabase = await createServerClient()

    // Collect all unique table names
    const tableNames = [...new Set(FORM_SCHEMAS.map((s) => s.table))]

    // Use RPC to introspect the database schema
    const { data: columnsData, error: rpcError } = await supabase.rpc("get_table_columns", {
      table_names: tableNames,
    })

    // If RPC fails, try direct query via admin client
    let dbColumns: Record<string, DbColumn[]> = {}

    if (rpcError || !columnsData) {
      // Fallback: try each table individually via .from() to see if it exists
      for (const table of tableNames) {
        try {
          const { data, error } = await supabase.from(table).select("*").limit(0)
          if (!error) {
            // Table exists but we can't get column info without RPC
            dbColumns[table] = []
          }
        } catch {
          // Table doesn't exist
        }
      }
    } else {
      // Group columns by table
      for (const col of columnsData as any[]) {
        const table = col.table_name
        if (!dbColumns[table]) dbColumns[table] = []
        dbColumns[table].push({
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
          udt_name: col.udt_name,
        })
      }
    }

    // Validate each form schema against DB
    const results: FormResult[] = FORM_SCHEMAS.map((schema) => {
      const tableCols = dbColumns[schema.table]

      if (!tableCols) {
        return {
          id: schema.id,
          name: schema.name,
          table: schema.table,
          component: schema.component,
          status: "missing_table" as const,
          issues: [
            {
              field: "*",
              label: "Tabelle",
              severity: "error" as const,
              message: `Tabelle "${schema.table}" existiert nicht in der Datenbank`,
              fix: `CREATE TABLE ${schema.table} (\n  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,\n  ${schema.fields.map((f) => `${f.name} ${f.type === "json" ? "jsonb" : f.type === "number" ? "numeric" : f.type === "boolean" ? "boolean" : "text"}${f.required ? " NOT NULL" : ""}`).join(",\n  ")},\n  created_at timestamp DEFAULT now(),\n  updated_at timestamp DEFAULT now()\n);`,
            },
          ],
          fields: schema.fields.map((f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required,
            existsInDb: false,
          })),
        }
      }

      if (tableCols.length === 0) {
        // Table exists but we couldn't get column info (RPC failed)
        return {
          id: schema.id,
          name: schema.name,
          table: schema.table,
          component: schema.component,
          status: "warning" as const,
          issues: [
            {
              field: "*",
              label: "Schema",
              severity: "warning" as const,
              message: "Spalteninformationen konnten nicht abgerufen werden (RPC-Funktion fehlt)",
            },
          ],
          fields: schema.fields.map((f) => ({
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required,
            existsInDb: true,
          })),
        }
      }

      const colMap = new Map(tableCols.map((c) => [c.column_name, c]))
      const issues: FieldIssue[] = []

      const fields = schema.fields.map((f) => {
        const dbCol = colMap.get(f.name)
        if (!dbCol) {
          const pgType = f.type === "json" ? "jsonb" : f.type === "number" ? "numeric" : f.type === "boolean" ? "boolean" : "text"
          issues.push({
            field: f.name,
            label: f.label,
            severity: "error",
            message: `Spalte "${f.name}" fehlt in Tabelle "${schema.table}"`,
            fix: `ALTER TABLE ${schema.table} ADD COLUMN IF NOT EXISTS ${f.name} ${pgType};`,
          })
          return {
            name: f.name,
            label: f.label,
            type: f.type,
            required: f.required,
            existsInDb: false,
          }
        }

        // Check type compatibility
        if (!isTypeCompatible(f.type, dbCol.data_type, dbCol.udt_name)) {
          issues.push({
            field: f.name,
            label: f.label,
            severity: "warning",
            message: `Typ-Mismatch: Form erwartet "${f.type}", DB hat "${dbCol.data_type}" (${dbCol.udt_name})`,
          })
        }

        // Check required vs nullable
        if (f.required && dbCol.is_nullable === "YES" && !dbCol.column_default) {
          issues.push({
            field: f.name,
            label: f.label,
            severity: "warning",
            message: `Feld ist Pflicht im Formular, aber NULL-bar in der DB ohne Default-Wert`,
          })
        }

        return {
          name: f.name,
          label: f.label,
          type: f.type,
          required: f.required,
          existsInDb: true,
          dbType: `${dbCol.data_type} (${dbCol.udt_name})`,
          dbNullable: dbCol.is_nullable === "YES",
        }
      })

      const hasErrors = issues.some((i) => i.severity === "error")
      const hasWarnings = issues.some((i) => i.severity === "warning")

      return {
        id: schema.id,
        name: schema.name,
        table: schema.table,
        component: schema.component,
        status: hasErrors ? "error" : hasWarnings ? "warning" : "ok",
        issues,
        fields,
      }
    })

    // Summary stats
    const summary = {
      total: results.length,
      ok: results.filter((r) => r.status === "ok").length,
      warnings: results.filter((r) => r.status === "warning").length,
      errors: results.filter((r) => r.status === "error" || r.status === "missing_table").length,
    }

    return NextResponse.json({ results, summary })
  } catch (error) {
    console.error("[v0] Form-DB sync check error:", error)
    return NextResponse.json(
      { error: "Fehler beim Prüfen der Form-DB-Synchronisation" },
      { status: 500 },
    )
  }
}
