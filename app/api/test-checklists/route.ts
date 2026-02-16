export const dynamic = "force-dynamic"

import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { data: checklists, error } = await supabase
      .from("test_checklists")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(checklists)
  } catch (error) {
    console.error("[v0] Error fetching test checklists:", error)
    return NextResponse.json({ error: "Failed to fetch test checklists" }, { status: 500 })
  }
}
