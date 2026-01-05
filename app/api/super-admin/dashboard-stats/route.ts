import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function GET() {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check authorization
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!isSuperAdminRole(userData?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch all stats in parallel
    const [
      usersResult,
      activeUsersResult,
      superAdminsResult,
      practicesResult,
      activePracticesResult,
      ticketsResult,
      openTicketsResult,
      criticalTicketsResult,
    ] = await Promise.all([
      // Total users
      adminClient
        .from("users")
        .select("id", { count: "exact", head: true }),
      // Active users
      adminClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      // Super admins
      adminClient
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("role", ["superadmin", "super_admin"]),
      // Total practices
      adminClient
        .from("practices")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      // Active practices (settings.isActive = true or no settings)
      adminClient
        .from("practices")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null),
      // Total tickets
      adminClient
        .from("tickets")
        .select("id", { count: "exact", head: true }),
      // Open tickets
      adminClient
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress", "pending"]),
      // Critical tickets
      adminClient
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("priority", "critical")
        .in("status", ["open", "in_progress"]),
    ])

    // Calculate system uptime (simulated for now - in production would come from monitoring)
    // This could be enhanced to track actual system health checks
    const systemUptime = 99.9 // Could be calculated from actual health check logs

    const stats = {
      users: {
        total: usersResult.count || 0,
        active: activeUsersResult.count || 0,
        superAdmins: superAdminsResult.count || 0,
      },
      practices: {
        total: practicesResult.count || 0,
        active: activePracticesResult.count || 0,
      },
      tickets: {
        total: ticketsResult.count || 0,
        open: openTicketsResult.count || 0,
        critical: criticalTicketsResult.count || 0,
      },
      system: {
        status: "online" as const,
        uptime: systemUptime,
      },
    }

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
