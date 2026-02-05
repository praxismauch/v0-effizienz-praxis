import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle()

    if (userData?.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch sidebar preferences
    const { data, error } = await supabase
      .from("user_sidebar_preferences")
      .select("expanded_groups, sidebar_collapsed, expanded_items, favorites")
      .eq("user_id", user.id)
      .eq("practice_id", "super-admin")
      .maybeSingle()

    if (error) {
      console.error("Error fetching sidebar preferences:", error)
      return NextResponse.json({
        expanded_groups: ["overview", "management"],
        sidebar_collapsed: false,
        expanded_items: [],
        favorites: [],
      })
    }

    return NextResponse.json(data || {
      expanded_groups: ["overview", "management"],
      sidebar_collapsed: false,
      expanded_items: [],
      favorites: [],
    })
  } catch (error) {
    console.error("Error in sidebar preferences API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
