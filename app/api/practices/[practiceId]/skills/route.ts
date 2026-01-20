import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("team_id")

    if (!practiceId || practiceId === "0" || practiceId === "undefined") {
      return NextResponse.json([])
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

    // TODO: skill_definitions table doesn't exist yet
    // Return empty array until table is created
    const { data, error } = await supabase.from("skill_definitions").select()

    if (error) {
      console.error("Skills GET error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Skills GET error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: "Fehler beim Laden der Skills" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId || practiceId === "0") {
      return NextResponse.json({ error: "Practice ID erforderlich" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("skill_definitions")
      .insert({
        practice_id: practiceId,
        team_id: body.team_id || null,
        name: body.name,
        category: body.category || null,
        description: body.description || null,
        level_0_description: body.level_0_description || "Keine Erfahrung, benötigt vollständige Anleitung",
        level_1_description: body.level_1_description || "Kann einfache Aufgaben mit Anleitung ausführen",
        level_2_description: body.level_2_description || "Beherrscht Aufgaben sicher und zuverlässig ohne Hilfe",
        level_3_description:
          body.level_3_description || "Beherrscht komplexe Situationen, kann andere anleiten, optimiert Prozesse",
        is_active: body.is_active ?? true,
        display_order: body.display_order || 0,
        created_by: body.created_by || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Skills POST error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Skills POST error:", error)
    if (isRateLimitError(error)) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
    }
    return NextResponse.json({ error: "Fehler beim Erstellen des Skills" }, { status: 500 })
  }
}
