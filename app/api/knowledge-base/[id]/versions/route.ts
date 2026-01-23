import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch version history for an article
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { data: versions, error } = await supabase
      .from("knowledge_base_versions")
      .select("*")
      .eq("article_id", id)
      .order("version", { ascending: false })

    if (error) {
      console.error("Error fetching versions:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(versions || [])
  } catch (error) {
    console.error("Error in versions GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Restore a specific version
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const { version_id } = await request.json()

    // Get the version to restore
    const { data: versionToRestore, error: fetchError } = await supabase
      .from("knowledge_base_versions")
      .select("*")
      .eq("id", version_id)
      .single()

    if (fetchError || !versionToRestore) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    // Get current article to save as version before restoring
    const { data: currentArticle } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("id", id)
      .single()

    if (currentArticle) {
      // Save current state as a version
      await supabase.from("knowledge_base_versions").insert({
        article_id: id,
        version: currentArticle.version || 1,
        title: currentArticle.title,
        content: currentArticle.content,
        category: currentArticle.category,
        subcategory: currentArticle.subcategory,
        tags: currentArticle.tags,
        status: currentArticle.status,
        attachments: currentArticle.attachments,
        related_articles: currentArticle.related_articles,
        created_by: currentArticle.last_edited_by || currentArticle.created_by,
        change_summary: `Vor Wiederherstellung von Version ${versionToRestore.version}`,
        change_type: "update",
        practice_id: currentArticle.practice_id,
      })
    }

    // Restore the selected version
    const newVersion = (currentArticle?.version || 1) + 1
    const { data, error } = await supabase
      .from("knowledge_base")
      .update({
        title: versionToRestore.title,
        content: versionToRestore.content,
        category: versionToRestore.category,
        subcategory: versionToRestore.subcategory,
        tags: versionToRestore.tags,
        attachments: versionToRestore.attachments,
        related_articles: versionToRestore.related_articles,
        version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error restoring version:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, article: data })
  } catch (error) {
    console.error("Error in versions POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
