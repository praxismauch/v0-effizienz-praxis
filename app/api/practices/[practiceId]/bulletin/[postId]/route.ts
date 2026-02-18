import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; postId: string }> }
) {
  try {
    const { practiceId, postId } = await params
    const body = await request.json()

    const supabase = await createAdminClient()

    const allowedFields = ["title", "content", "is_pinned", "is_important"]
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from("bulletin_posts")
      .update(updateData)
      .eq("id", postId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("Error updating bulletin post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error("Error in bulletin PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; postId: string }> }
) {
  try {
    const { practiceId, postId } = await params

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("bulletin_posts")
      .delete()
      .eq("id", postId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("Error deleting bulletin post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in bulletin DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
