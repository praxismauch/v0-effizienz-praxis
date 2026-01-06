import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.user.id).single()

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: settings, error } = await supabase
      .from("cockpit_card_settings")
      .select("*")
      .order("display_order", { ascending: true })

    if (error) {
      console.error("Error fetching cockpit settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error("Error in GET /api/super-admin/cockpit-settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: profile } = await supabase.from("profiles").select("is_super_admin").eq("id", user.user.id).single()

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { settings } = await request.json()

    if (!Array.isArray(settings)) {
      return NextResponse.json({ error: "Settings must be an array" }, { status: 400 })
    }

    // Update each setting
    for (const setting of settings) {
      const { error } = await supabase.from("cockpit_card_settings").upsert(
        {
          widget_id: setting.widget_id,
          label: setting.label,
          description: setting.description,
          icon: setting.icon,
          column_span: setting.column_span,
          row_span: setting.row_span,
          min_height: setting.min_height,
          is_enabled_by_default: setting.is_enabled_by_default,
          display_order: setting.display_order,
          card_style: setting.card_style,
        },
        { onConflict: "widget_id" },
      )

      if (error) {
        console.error("Error updating cockpit setting:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in PUT /api/super-admin/cockpit-settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
