export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin()

    // Count unresolved errors (new, acknowledged, investigating) with error or critical level
    const { count, error } = await supabase
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .in("status", ["new", "acknowledged", "investigating"])
      .in("level", ["error", "critical"])

    if (error) {
      console.error("[v0] Error fetching error logs count:", error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("[v0] Error in logs count endpoint:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
