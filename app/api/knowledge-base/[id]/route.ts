import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    // Get current article to save as version before updating
    const { data: currentArticle, error: fetchError } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json({ error: "Article not found" }, { status: 404 })
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Save current version to history table before updating
    const currentVersion = currentArticle.version || 1
    await supabase.from("knowledge_base_versions").insert({
      article_id: id,
      version: currentVersion,
      title: currentArticle.title,
      content: currentArticle.content,
      category: currentArticle.category,
      subcategory: currentArticle.subcategory,
      tags: currentArticle.tags,
      status: currentArticle.status,
      attachments: currentArticle.attachments,
      related_articles: currentArticle.related_articles,
      created_by: currentArticle.last_edited_by || currentArticle.created_by,
      change_summary: body.change_summary || "Automatische Versionierung",
      change_type: "update",
      practice_id: currentArticle.practice_id,
    })

    // Update article with incremented version
    const newVersion = currentVersion + 1
    const { data, error } = await supabase
      .from("knowledge_base")
      .update({
        ...body,
        version: newVersion,
        previous_version_id: id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating knowledge base article:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in knowledge base PUT:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

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
