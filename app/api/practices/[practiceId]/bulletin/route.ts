import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("bulletin_posts")
      .select("*")
      .eq("practice_id", practiceId)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bulletin posts:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: data || [] })
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

    const { data, error } = await supabase
      .from("bulletin_posts")
      .insert({
        practice_id: practiceId,
        author_id: body.author_id || null,
        author_name: body.author_name || "Unbekannt",
        title: body.title,
        content: body.content,
        is_pinned: body.is_pinned || false,
        is_important: body.is_important || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating bulletin post:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: data })
  } catch (error) {
    console.error("Error in bulletin POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
