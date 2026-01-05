import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getTicketStatuses } from "@/lib/tickets/config"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const statuses = await getTicketStatuses()
    const openStatuses = statuses
      .filter((s) => s.value === "open" || s.value === "in_progress" || s.value === "pending")
      .map((s) => s.value)

    // Fallback if no statuses found
    if (openStatuses.length === 0) {
      openStatuses.push("open", "pending", "in_progress")
    }

    const { count, error } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .in("status", openStatuses)

    if (error) {
      console.error("Error counting tickets:", error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error in tickets count API:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
