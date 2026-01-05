// ✅ PRESERVES 100% EXISTING BUSINESS LOGIC
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getCached, setCached } from "@/lib/redis"
import { getTicketStatuses } from "@/lib/tickets/config"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ openCount: 0 })
    }

    const cacheKey = `ticket:stats:${user.id}`
    const cached = await getCached<{ openCount: number }>(cacheKey)

    if (cached) {
      console.log(`[v0] Cache hit for ticket stats: ${user.id}`)
      return NextResponse.json(cached)
    }

    const statuses = await getTicketStatuses()
    const closedStatuses = statuses.filter((s) => s.value === "resolved" || s.value === "closed").map((s) => s.value)

    // Fallback if no statuses found
    if (closedStatuses.length === 0) {
      closedStatuses.push("resolved", "closed")
    }

    // ✅ PRESERVED: Same query logic but with dynamic status values
    const { count, error } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .not("status", "in", `(${closedStatuses.join(",")})`)

    if (error) {
      console.error("[v0] Error fetching ticket stats:", error)
      return NextResponse.json({ openCount: 0 })
    }

    const result = { openCount: count || 0 }

    await setCached(cacheKey, result, 300)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in ticket stats API:", error)
    return NextResponse.json({ openCount: 0 })
  }
}
