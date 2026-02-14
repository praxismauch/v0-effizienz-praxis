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

    // Super-admin sidebar preferences are handled via localStorage
    // because "super-admin" is not a valid practice_id FK
    return NextResponse.json({
      expanded_groups: ["overview", "praxen-benutzer"],
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
