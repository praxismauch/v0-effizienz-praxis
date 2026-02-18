import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

type Params = { practiceId: string; postId: string }

export async function GET(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { practiceId, postId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("bulletin_posts")
      .select("*")
      .eq("id", postId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      return NextResponse.json({ error: "Beitrag nicht gefunden" }, { status: 404 })
    }

    // Get read count
    const { count } = await supabase
      .from("bulletin_read_status")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId)

    return NextResponse.json({ post: { ...data, read_count: count || 0 } })
  } catch (error) {
    console.error("Error in bulletin GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<Params> }
) {
  try {
    const { practiceId, postId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const allowedFields = [
      "title", "content", "category", "priority", "visibility",
      "visible_roles", "visible_user_ids", "is_pinned", "is_important",
      "publish_at", "expires_at", "requires_confirmation", "is_archived",
    ]
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
  { params }: { params: Promise<Params> }
) {
  try {
    const { practiceId, postId } = await params
    const supabase = await createAdminClient()

    // Soft delete (DSGVO-compliant)
    const { error } = await supabase
      .from("bulletin_posts")
      .update({ deleted_at: new Date().toISOString(), is_archived: true })
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
