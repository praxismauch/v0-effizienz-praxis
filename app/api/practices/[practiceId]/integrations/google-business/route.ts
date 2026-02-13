import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("practice_integrations")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("integration_type", "google_business")
      .maybeSingle()

    if (error) throw error
    return NextResponse.json(data || { is_connected: false })
  } catch (error) {
    console.error("Error fetching Google Business settings:", error)
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> },
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("practice_integrations")
      .upsert({
        practice_id: practiceId,
        integration_type: "google_business",
        settings: body,
        updated_at: new Date().toISOString(),
      }, { onConflict: "practice_id,integration_type" })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving Google Business settings:", error)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
