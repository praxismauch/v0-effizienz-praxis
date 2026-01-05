import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { data: popups, error } = await supabase.from("popups").select("id, is_active").eq("is_active", true)

    if (error) {
      console.error("[v0] Error fetching active popups count:", error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: popups?.length || 0 })
  } catch (error) {
    console.error("[v0] Error in popups count API:", error)
    return NextResponse.json({ count: 0 })
  }
}
