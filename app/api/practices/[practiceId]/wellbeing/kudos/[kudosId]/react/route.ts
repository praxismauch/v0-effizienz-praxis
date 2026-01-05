import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; kudosId: string }> },
) {
  const { kudosId } = await params
  const supabase = await createClient()
  const body = await request.json()

  try {
    // Get current reactions
    const { data: kudos, error: fetchError } = await supabase
      .from("kudos")
      .select("reactions")
      .eq("id", kudosId)
      .single()

    if (fetchError) throw fetchError

    // Update reactions
    const reactions = kudos?.reactions || {}
    reactions[body.emoji] = (reactions[body.emoji] || 0) + 1

    const { error } = await supabase.from("kudos").update({ reactions }).eq("id", kudosId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error reacting to kudos:", error)
    return NextResponse.json({ error: "Failed to react" }, { status: 500 })
  }
}
