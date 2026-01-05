import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { practiceId: string; documentId: string } }) {
  try {
    const { practiceId, documentId } = params

    const body = await request.json()
    const { folder_id } = body

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("documents")
      .update({
        folder_id: folder_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Move Document POST - Supabase error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Move Document POST - Error:", error)
    return NextResponse.json({ error: "Failed to move document" }, { status: 500 })
  }
}
