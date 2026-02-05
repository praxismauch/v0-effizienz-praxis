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

    // Fetch all badge counts in parallel
    const [
      waitlistResult,
      ticketsResult,
      pendingUsersResult,
      practicesResult,
      usersResult,
      subscriptionsResult,
    ] = await Promise.allSettled([
      supabase.from("waitlist").select("id", { count: "exact", head: true }),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("approved", false),
      supabase.from("practices").select("id", { count: "exact", head: true }),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    ])

    return NextResponse.json({
      waitlist: waitlistResult.status === "fulfilled" ? waitlistResult.value.count || 0 : 0,
      tickets: ticketsResult.status === "fulfilled" ? ticketsResult.value.count || 0 : 0,
      pendingUsers: pendingUsersResult.status === "fulfilled" ? pendingUsersResult.value.count || 0 : 0,
      practices: practicesResult.status === "fulfilled" ? practicesResult.value.count || 0 : 0,
      totalUsers: usersResult.status === "fulfilled" ? usersResult.value.count || 0 : 0,
      subscriptions: subscriptionsResult.status === "fulfilled" ? subscriptionsResult.value.count || 0 : 0,
    })
  } catch (error) {
    console.error("Error fetching super-admin badge counts:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
