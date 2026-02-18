import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; postId: string }> }
) {
  try {
    const { postId } = await params
    const body = await request.json()
    const userId = body.user_id

    if (!userId) {
      return NextResponse.json({ error: "user_id ist erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("bulletin_read_status")
      .upsert(
        { post_id: postId, user_id: userId, read_at: new Date().toISOString() },
        { onConflict: "post_id,user_id" }
      )

    if (error) {
      console.error("Error marking post as read:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in read status POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
