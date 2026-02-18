import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_SETTINGS = {
  auto_stop_enabled: true,
  auto_stop_hours: 12,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("practice_settings")
      .select("time_tracking_settings")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (error) throw error

    const settings = data?.time_tracking_settings || DEFAULT_SETTINGS

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error("Error fetching time tracking settings:", error)
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const { settings } = await request.json()

    // Check if practice_settings row exists
    const { data: existing } = await supabase
      .from("practice_settings")
      .select("id")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from("practice_settings")
        .update({
          time_tracking_settings: settings,
          updated_at: new Date().toISOString(),
        })
        .eq("practice_id", practiceId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from("practice_settings")
        .insert({
          practice_id: practiceId,
          time_tracking_settings: settings,
        })

      if (error) throw error
    }

    return NextResponse.json({ success: true, settings })
  } catch (error: any) {
    console.error("Error saving time tracking settings:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
