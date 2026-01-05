import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: practices, error } = await supabase.from("practices").select("id, deleted_at")

    if (error) {
      console.error("Practices count API - Supabase error:", error)
      return NextResponse.json({ error: "Failed to fetch practices count", details: error.message }, { status: 500 })
    }

    if (!practices) {
      return NextResponse.json({ count: 0, total: 0, active: 0 })
    }

    const activeCount = practices.filter((practice: any) => {
      return practice.deleted_at === null
    }).length

    const totalCount = practices.length

    return NextResponse.json({
      count: activeCount,
      total: totalCount,
      active: activeCount,
    })
  } catch (error) {
    console.error("Practices count API - Exception:", error)
    return NextResponse.json(
      { error: "Failed to fetch practices count", count: 0, total: 0, active: 0 },
      { status: 500 },
    )
  }
}
