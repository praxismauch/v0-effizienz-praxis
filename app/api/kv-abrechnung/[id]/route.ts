import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: abrechnung, error } = await supabase.from("kv_abrechnung").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("[v0] Failed to fetch KV-Abrechnung:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!abrechnung) {
      return NextResponse.json({ error: "KV-Abrechnung nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(abrechnung)
  } catch (error) {
    console.error("[v0] Error in GET /api/kv-abrechnung/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
