import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const practiceId = Number.parseInt(params.practiceId)

    // Get practice details
    const { data: practice, error: practiceError } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .single()

    if (practiceError || !practice) {
      return NextResponse.json({ error: "Practice not found" }, { status: 404 })
    }

    // Get member counts
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)

    const { count: adminCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("practice_id", practiceId)
      .eq("role", "admin")

    // Get last activity (most recent updated_at from team_members)
    const { data: lastActivityData } = await supabase
      .from("team_members")
      .select("updated_at")
      .eq("practice_id", practiceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      id: practice.id,
      name: practice.name,
      email: practice.email || "",
      type: practice.practice_type || "Allgemeinmedizin",
      isActive: practice.is_active ?? true,
      memberCount: memberCount || 0,
      adminCount: adminCount || 0,
      lastActivity: lastActivityData?.updated_at || practice.updated_at || practice.created_at,
      createdAt: practice.created_at,
      address: practice.address || "",
      phone: practice.phone || "",
      website: practice.website || "",
    })
  } catch (error) {
    console.error("[v0] Error fetching practice details:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
