import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: specialtyGroups, error } = await supabase
      .from("specialty_groups")
      .select("*")
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("display_order")
      .order("name")

    if (error) throw error

    return NextResponse.json({ specialtyGroups })
  } catch (error: any) {
    console.error("[v0] Error fetching specialty groups:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
