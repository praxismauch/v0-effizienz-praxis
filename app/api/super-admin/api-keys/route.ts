import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch all API keys from system_settings
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch system settings
    const { data: settings } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["google_places_api_key"])

    const keys: Record<string, string> = {}
    settings?.forEach((s) => {
      keys[s.key] = s.value || ""
    })

    return NextResponse.json({ keys })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Save an API key
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { key, value } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 })
    }

    // Upsert the setting
    const { error } = await supabase.from("system_settings").upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    )

    if (error) {
      console.error("Error saving API key:", error)
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving API key:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
