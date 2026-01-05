import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase.from("backups").select("*", { count: "exact", head: true })

    if (error) throw error

    return NextResponse.json({ count: count || 0 })
  } catch (error: any) {
    console.error("[v0] Error fetching backup count:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
