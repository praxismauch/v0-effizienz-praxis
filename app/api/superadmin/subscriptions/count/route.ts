import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase
      .from("practice_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")

    if (error) {
      console.error("[v0] Error counting subscriptions:", error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in subscriptions count API:", error)
    return NextResponse.json({ count: 0 })
  }
}
