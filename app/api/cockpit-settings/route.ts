import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Public endpoint for users to get cockpit card settings
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from("cockpit_card_settings")
      .select(
        "widget_id, label, description, icon, column_span, row_span, min_height, is_enabled_by_default, display_order, card_style",
      )
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching cockpit settings:", error)
      // Return default settings if table doesn't exist
      return NextResponse.json({ settings: [] })
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error("Error in GET /api/cockpit-settings:", error)
    return NextResponse.json({ settings: [] })
  }
}
