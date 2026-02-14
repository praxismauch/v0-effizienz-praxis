import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (userData?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    const adminClient = await createAdminClient()

    const { data: teamMembers, error } = await adminClient
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching team members:", error)
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 })
    }

    return NextResponse.json({ teamMembers: teamMembers || [] })
  } catch (error) {
    console.error("Error in team members API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
