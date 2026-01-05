import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json(null)
      }
      throw err
    }

    const { data, error } = await supabase
      .from("practice_templates")
      .select(`
        *,
        template_skills (*)
      `)
      .eq("id", templateId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Template GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Template GET error:", error)
    return NextResponse.json({ error: "Fehler beim Laden der Vorlage" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params
    const body = await request.json()

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("practice_templates")
      .update({
        name: body.name,
        description: body.description,
        specialty_ids: body.specialty_ids,
        is_active: body.is_active,
        display_order: body.display_order,
        updated_at: new Date().toISOString(),
      })
      .eq("id", templateId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Template PUT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Template PUT error:", error)
    return NextResponse.json({ error: "Fehler beim Aktualisieren der Vorlage" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await params

    let supabase
    try {
      supabase = createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { error } = await supabase
      .from("practice_templates")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", templateId)

    if (error) {
      console.error("[v0] Template DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Template DELETE error:", error)
    return NextResponse.json({ error: "Fehler beim Löschen der Vorlage" }, { status: 500 })
  }
}
