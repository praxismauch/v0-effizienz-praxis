export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    const { count, error } = await supabase
      .from("system_logs")
      .select("*", { count: "exact", head: true })
      .eq("level", "critical")

    if (error) {
      console.error("Error fetching critical logs count:", error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error in logs count endpoint:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
