import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Check if we're in a preview environment
    const isV0Preview = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) || false

    const supabase = isV0Preview ? await createAdminClient() : await createClient()

    const { data: comments, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching comments:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to fetch comments"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error("[v0] Error in ticket comments GET:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch comments"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const isV0Preview = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) || false

    const supabase = isV0Preview ? await createAdminClient() : await createClient()
    const { id } = await params
    const body = await request.json()

    const { data: userData } = await supabase.auth.getUser()

    const commentData = {
      ticket_id: id,
      user_id: userData?.user?.id || null,
      user_name: body.user_name || userData?.user?.user_metadata?.name,
      user_email: body.user_email || userData?.user?.email,
      comment: body.comment,
      is_internal: body.is_internal || false,
      attachments: body.attachments || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("ticket_comments").insert([commentData]).select().single()

    if (error) {
      console.error("[v0] Error creating comment:", error)
      const errorMessage = error?.message || error?.toString() || "Failed to create comment"
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    // Update ticket's updated_at timestamp
    await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", id)

    return NextResponse.json({ comment: data })
  } catch (error) {
    console.error("[v0] Error in ticket comment POST:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create comment"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
