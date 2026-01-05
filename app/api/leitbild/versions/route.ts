import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("leitbild")
      .select("*")
      .eq("practice_id", practiceId)
      .order("version", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching leitbild versions:", error)
      throw error
    }

    return NextResponse.json({ versions: data || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching leitbild versions:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch versions" }, { status: 500 })
  }
}
