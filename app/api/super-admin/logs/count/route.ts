export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
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
