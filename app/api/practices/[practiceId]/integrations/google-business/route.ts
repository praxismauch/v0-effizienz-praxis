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
      .eq("provider", "google_business")
      .maybeSingle()

    if (error) {
      // If table/column doesn't exist, return default state instead of error
      if (error.code === "42703" || error.code === "42P01" || error.code === "PGRST204") {
        return NextResponse.json({ is_connected: false, is_active: false, settings: {} })
      }
      throw error
    }
    // Map DB field names to what the frontend expects
    const result = data ? { ...data, is_connected: data.is_active } : { is_connected: false, is_active: false }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching Google Business settings:", error)
    return NextResponse.json({ is_connected: false, is_active: false, settings: {} })
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
        provider: "google_business",
        settings: body,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "practice_id,provider" })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error saving Google Business settings:", error)
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 })
  }
}
