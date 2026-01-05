import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params

    const { data, error } = await supabase.from("knowledge_base").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("[v0] Error fetching knowledge base article:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in knowledge base GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params
    const body = await request.json()

    const { data, error } = await supabase.from("knowledge_base").update(body).eq("id", id).select().single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }
      console.error("[v0] Error updating knowledge base article:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in knowledge base PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params

    const { error } = await supabase
      .from("knowledge_base")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error deleting knowledge base article:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in knowledge base DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
