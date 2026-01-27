import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from("weekly_summary_settings")
      .select("*")
      .eq("practice_id", practiceId)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching weekly summary settings:", error)
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error in weekly summary settings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    // Check if settings exist
    const { data: existing } = await supabase
      .from("weekly_summary_settings")
      .select("id")
      .eq("practice_id", practiceId)
      .maybeSingle()

    const settingsData = {
      practice_id: practiceId,
      is_enabled: body.is_enabled,
      send_day: body.send_day,
      send_time: body.send_time,
      timezone: body.timezone,
      recipients: body.recipients,
      send_to_admins: body.send_to_admins,
      send_to_managers: body.send_to_managers,
      include_todos: body.include_todos,
      include_appointments: body.include_appointments,
      include_team_updates: body.include_team_updates,
      include_documents: body.include_documents,
      include_goals: body.include_goals,
      include_workflows: body.include_workflows,
      include_inventory_alerts: body.include_inventory_alerts,
      include_device_maintenance: body.include_device_maintenance,
      include_financial_summary: body.include_financial_summary,
      include_ai_insights: body.include_ai_insights,
      include_weekly_forecast: body.include_weekly_forecast,
      custom_intro: body.custom_intro,
      custom_footer: body.custom_footer,
      branding_color: body.branding_color,
      include_logo: body.include_logo,
      updated_at: new Date().toISOString(),
    }

    let result
    if (existing) {
      result = await supabase
        .from("weekly_summary_settings")
        .update(settingsData)
        .eq("id", existing.id)
        .select()
        .single()
    } else {
      result = await supabase.from("weekly_summary_settings").insert(settingsData).select().single()
    }

    if (result.error) {
      console.error("Error saving weekly summary settings:", result.error)
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
    }

    return NextResponse.json({ settings: result.data })
  } catch (error) {
    console.error("Error in weekly summary settings PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
