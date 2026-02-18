import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { hasSupabaseAdminConfig } from "@/lib/supabase/config"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const priority = searchParams.get("priority")
    const unreadOnly = searchParams.get("unread") === "true"
    const archived = searchParams.get("archived") === "true"
    const sortBy = searchParams.get("sort") || "newest"
    const search = searchParams.get("search")
    const userId = searchParams.get("userId")

    const supabase = hasSupabaseAdminConfig() ? createAdminClient() : await createClient()

    let query = supabase
      .from("bulletin_posts")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .eq("is_archived", archived)

    // Filter by category
    if (category && category !== "all") {
      query = query.eq("category", category)
    }

    // Filter by priority
    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }

    // Full-text search on title and content
    if (search?.trim()) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
    }

    // Only show published posts (publish_at <= now)
    if (!archived) {
      query = query.lte("publish_at", new Date().toISOString())
    }

    // Sorting
    if (sortBy === "priority") {
      // urgent > important > normal
      query = query.order("is_pinned", { ascending: false })
        .order("priority", { ascending: true })
        .order("created_at", { ascending: false })
    } else if (sortBy === "category") {
      query = query.order("category", { ascending: true })
        .order("created_at", { ascending: false })
    } else {
      // newest first, pinned always on top
      query = query.order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
    }

    const { data: posts, error } = await query

    if (error) {
      console.error("Error fetching bulletin posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get read status for the requesting user
    let readStatuses: Record<string, boolean> = {}
    if (userId && posts && posts.length > 0) {
      const postIds = posts.map((p: { id: string }) => p.id)
      const { data: readData } = await supabase
        .from("bulletin_read_status")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds)

      if (readData) {
        readStatuses = Object.fromEntries(readData.map((r: { post_id: string }) => [r.post_id, true]))
      }
    }

    // Get read counts per post
    const enrichedPosts = await Promise.all(
      (posts || []).map(async (post: { id: string }) => {
        const { count } = await supabase
          .from("bulletin_read_status")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id)

        return {
          ...post,
          is_read: !!readStatuses[post.id],
          read_count: count || 0,
        }
      })
    )

    // Filter unread only
    const finalPosts = unreadOnly
      ? enrichedPosts.filter((p: { is_read: boolean }) => !p.is_read)
      : enrichedPosts

    return NextResponse.json({ posts: finalPosts })
  } catch (error) {
    console.error("Error in bulletin GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!body.title?.trim() || !body.content?.trim()) {
      return NextResponse.json({ error: "Titel und Inhalt sind erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const insertData = {
      practice_id: practiceId,
      author_id: body.author_id || null,
      author_name: body.author_name || "Unbekannt",
      title: body.title,
      content: body.content,
      category: body.category || "allgemein",
      priority: body.priority || "normal",
      visibility: body.visibility || "all",
      visible_roles: body.visible_roles || [],
      visible_user_ids: body.visible_user_ids || [],
      is_pinned: body.is_pinned || false,
      is_important: body.priority === "urgent" || body.is_important || false,
      publish_at: body.publish_at || new Date().toISOString(),
      expires_at: body.expires_at || null,
      requires_confirmation: body.requires_confirmation || false,
    }

    const { data, error } = await supabase
      .from("bulletin_posts")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Error creating bulletin post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: { ...data, is_read: false, read_count: 0 } })
  } catch (error) {
    console.error("Error in bulletin POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
