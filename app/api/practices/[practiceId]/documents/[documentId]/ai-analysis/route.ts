import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const supabase = await createAdminClient()

    const body = await request.json()

    const { data, error } = await supabase
      .from("documents")
      .update({
        ai_analysis: body.ai_analysis,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] AI Analysis POST - Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] AI Analysis POST - Exception:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
