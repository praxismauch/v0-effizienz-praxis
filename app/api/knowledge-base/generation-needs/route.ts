import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - List all knowledge generation needs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const category = searchParams.get("category")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    let query = supabase
      .from("knowledge_generation_needs")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (priority) {
      query = query.eq("priority", priority)
    }

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching knowledge generation needs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ needs: data || [] })
  } catch (error) {
    console.error("Error in knowledge generation needs GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new knowledge generation need
export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    if (!body.practice_id || !body.title || !body.created_by) {
      return NextResponse.json(
        { error: "Missing required fields: practice_id, title, and created_by are required" },
        { status: 400 }
      )
    }

    const insertData = {
      practice_id: body.practice_id,
      title: body.title,
      description: body.description || null,
      category: body.category || null,
      subcategory: body.subcategory || null,
      priority: body.priority || "normal",
      status: body.status || "pending",
      target_audience: body.target_audience || null,
      content_type: body.content_type || null,
      keywords: body.keywords || [],
      tone: body.tone || "professional",
      min_word_count: body.min_word_count || 200,
      max_word_count: body.max_word_count || 2000,
      include_examples: body.include_examples ?? true,
      include_checklist: body.include_checklist ?? false,
      include_references: body.include_references ?? false,
      context_notes: body.context_notes || null,
      related_documents: body.related_documents || [],
      external_references: body.external_references || [],
      created_by: body.created_by,
      assigned_to: body.assigned_to || null,
      due_date: body.due_date || null,
    }

    const { data, error } = await supabase
      .from("knowledge_generation_needs")
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error("Error creating knowledge generation need:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in knowledge generation needs POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
