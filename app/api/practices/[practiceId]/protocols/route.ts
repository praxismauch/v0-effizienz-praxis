import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data: protocols, error } = await supabase
      .from("practice_journals")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[API] Error fetching protocols:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ protocols: protocols || [] })
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("[API] Error in protocols route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    console.log("[v0] Creating protocol for practice:", practiceId, "by user:", access.user.id)

    const { title, description, content, category, status, protocol_date, action_items, attendees } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { data: protocols, error } = await supabase
      .from("practice_journals")
      .insert({
        practice_id: practiceId,
        title: title.trim(),
        description: description || null,
        content: content || null,
        category: category || "general",
        status: status || "draft",
        protocol_date: protocol_date || new Date().toISOString(),
        action_items: action_items || [],
        attendees: attendees || [],
        created_by: access.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("[v0] Error creating protocol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const protocol = protocols?.[0]
    if (!protocol) {
      console.error("[v0] Protocol was not created - no data returned")
      return NextResponse.json({ error: "Failed to create protocol" }, { status: 500 })
    }

    console.log("[v0] Protocol created successfully:", protocol?.id)
    return NextResponse.json(protocol)
  } catch (error: any) {
    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    console.error("[v0] Error in protocols POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
