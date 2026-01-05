import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("approval_status", "pending")

    if (error) throw error

    return NextResponse.json(
      { count: count || 0 },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Error counting pending users:", error)
    return NextResponse.json(
      { count: 0 },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
