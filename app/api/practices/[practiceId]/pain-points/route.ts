import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

interface PainPoint {
  id: string
  title: string
  description: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const { painPoints } = (await request.json()) as { painPoints: PainPoint[] }

    if (!painPoints || !Array.isArray(painPoints)) {
      return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get current practice settings
    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("settings")
      .eq("id", practiceId)
      .single()

    if (practiceError) {
      console.error("Error fetching practice:", practiceError)
      return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
    }

    // Update settings with pain points
    const currentSettings = practice?.settings || {}
    const updatedSettings = {
      ...currentSettings,
      painPoints: painPoints.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        createdAt: new Date().toISOString(),
      })),
      painPointsUpdatedAt: new Date().toISOString(),
    }

    const { error: updateError } = await adminClient
      .from("practices")
      .update({ settings: updatedSettings })
      .eq("id", practiceId)

    if (updateError) {
      console.error("Error updating practice:", updateError)
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving pain points:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data: practice, error: practiceError } = await adminClient
      .from("practices")
      .select("settings")
      .eq("id", practiceId)
      .single()

    if (practiceError) {
      return NextResponse.json({ error: "Praxis nicht gefunden" }, { status: 404 })
    }

    const painPoints = practice?.settings?.painPoints || []

    return NextResponse.json({ painPoints })
  } catch (error) {
    console.error("Error fetching pain points:", error)
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 })
  }
}
