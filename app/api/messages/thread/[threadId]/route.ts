import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const supabase = await createClient()
    const { threadId } = await params

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:users!messages_sender_id_fkey(id, name, email, avatar, first_name, last_name)
      `)
      .eq("thread_id", threadId)
      .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching thread:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
