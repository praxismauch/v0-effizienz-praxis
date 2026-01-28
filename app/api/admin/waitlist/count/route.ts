import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    let supabase
    try {
      supabase = await createAdminClient()
    } catch (clientError) {
      return NextResponse.json({ count: 0 })
    }

    const { count, error } = await supabase
      .from("waitlist")
      .select("*", { count: "exact", head: true })

    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ count: 0 })
      }
      console.error("[v0] Waitlist count API - Database error:", error)
      return NextResponse.json({ count: 0 })
    }

    const finalCount = count || 0

    return NextResponse.json(
      { count: finalCount },
      {
        headers: {
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}
