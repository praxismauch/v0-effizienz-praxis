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

    let data = null
    let error = null

    try {
      let query = supabase.from("skill_definitions").select("*").eq("practice_id", practiceId).is("deleted_at", null)

      // Filter by team if specified, otherwise get all skills for the practice
      if (teamId && teamId !== "all") {
        // Get skills for specific team OR practice-wide skills (team_id IS NULL)
        query = query.or(`team_id.eq.${teamId},team_id.is.null`)
      }

      const result = await query
        .order("team_id", { ascending: true, nullsFirst: true })
        .order("category", { ascending: true })
        .order("display_order", { ascending: true })

      data = result.data
      error = result.error
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json([])
      }
      throw err
    }

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
