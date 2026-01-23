import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Get a single knowledge generation need
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("knowledge_generation_needs")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching knowledge generation need:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in knowledge generation need GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update a knowledge generation need
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()
    const body = await request.json()

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Only update fields that are provided
    const allowedFields = [
      "title",
      "description",
      "category",
      "subcategory",
      "priority",
      "status",
      "target_audience",
      "content_type",
      "keywords",
      "tone",
      "min_word_count",
      "max_word_count",
      "include_examples",
      "include_checklist",
      "include_references",
      "context_notes",
      "related_documents",
      "external_references",
      "assigned_to",
      "due_date",
      "generated_article_id",
      "generated_at",
      "generation_attempts",
      "last_generation_error",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from("knowledge_generation_needs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating knowledge generation need:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in knowledge generation need PATCH:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Soft delete a knowledge generation need
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("knowledge_generation_needs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error deleting knowledge generation need:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in knowledge generation need DELETE:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
