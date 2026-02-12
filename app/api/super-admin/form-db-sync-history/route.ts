import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  await cookies()

  try {
    const { searchParams } = new URL(request.url)
    const scanType = searchParams.get("type") // 'db-schema' | 'form-scan' | null (all)
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    const supabase = await createServerClient()

    let query = supabase
      .from("form_db_sync_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (scanType) {
      query = query.eq("scan_type", scanType)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] History fetch error:", error)
      return NextResponse.json({ error: "Fehler beim Laden der Historie" }, { status: 500 })
    }

    return NextResponse.json({ history: data || [] })
  } catch (error) {
    console.error("[v0] History API error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Historie" }, { status: 500 })
  }
}

// Called internally by the scan APIs to save a run
export async function POST(request: Request) {
  await cookies()

  try {
    const body = await request.json()
    const { scan_type, summary, total, ok, warnings, errors, duration_ms } = body

    if (!scan_type || !["db-schema", "form-scan"].includes(scan_type)) {
      return NextResponse.json({ error: "Ungueltiger scan_type" }, { status: 400 })
    }

    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from("form_db_sync_history")
      .insert({
        scan_type,
        summary: summary || {},
        total: total || 0,
        ok: ok || 0,
        warnings: warnings || 0,
        errors: errors || 0,
        duration_ms: duration_ms || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] History save error:", error)
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
    }

    return NextResponse.json({ entry: data })
  } catch (error) {
    console.error("[v0] History POST error:", error)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
