import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest) {
  try {
    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

    const { data, error } = await supabase
      .from("practice_templates")
      .select(`
        *,
        template_skills (*)
      `)
      .is("deleted_at", null)
      .order("display_order", { ascending: true })

    if (error) {
      // Return empty array if table doesn't exist
      if (error.code === "42P01") {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Fehler beim Laden der Vorlagen" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data: maxOrderData } = await supabase
      .from("practice_templates")
      .select("display_order")
      .is("deleted_at", null)
      .order("display_order", { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data, error } = await supabase
      .from("practice_templates")
      .insert({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        specialty_ids: body.specialty_ids || [],
        is_active: body.is_active ?? true,
        is_system_template: body.is_system_template ?? false,
        display_order: nextOrder,
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || "Datenbankfehler beim Erstellen" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
    return NextResponse.json({ error: `Fehler beim Erstellen der Vorlage: ${errorMessage}` }, { status: 500 })
  }
}
