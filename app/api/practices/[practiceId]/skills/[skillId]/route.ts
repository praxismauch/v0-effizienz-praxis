import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

// and correct column names per PROJECT_RULES.md

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Rate limited" }, { status: 429 })
      }
      throw err
    }

    // TODO: skill_definitions table doesn't exist yet
    // Return 404 until table is created
    const { data, error } = await supabase
      .from("skill_definitions")
      .select()
      .eq("id", skillId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[v0] Skill GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Skill GET error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Laden des Skills" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params
    const body = await request.json()

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    // skill_definitions has: name, category, description, level_X_description, is_active, display_order, team_id
    // NOT: level_X_title, level_X_criteria, color (those don't exist)
    const { data, error } = await supabase
      .from("skill_definitions")
      .update({
        name: body.name,
        category: body.category,
        description: body.description,
        level_0_description: body.level_0_description,
        level_1_description: body.level_1_description,
        level_2_description: body.level_2_description,
        level_3_description: body.level_3_description,
        is_active: body.is_active,
        display_order: body.display_order,
        team_id: body.team_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", skillId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Skill PUT error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Skill PUT error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Aktualisieren des Skills" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    // Using soft delete with deleted_at per PROJECT_RULES.md
    const { error } = await supabase
      .from("skill_definitions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", skillId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Skill DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Skill DELETE error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Löschen des Skills" }, { status: 500 })
  }
}
