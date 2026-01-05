import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; todoId: string }> },
) {
  try {
    const { practiceId, todoId } = await params
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("todo_attachments")
      .select("*")
      .eq("todo_id", todoId)
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching todo attachments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error in todo attachments GET:", error)
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; todoId: string }> },
) {
  try {
    const { practiceId, todoId } = await params
    const body = await request.json()
    const { attachments } = body

    const supabase = await createAdminClient()

    // Prepare attachments for insertion
    const attachmentsToInsert = attachments.map((att: any) => ({
      ...att,
      id: att.id.startsWith("temp-") ? undefined : att.id, // Remove temp IDs
      todo_id: todoId,
      practice_id: practiceId,
    }))

    const { data, error } = await supabase.from("todo_attachments").insert(attachmentsToInsert).select()

    if (error) {
      console.error("[v0] Error saving todo attachments:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in todo attachments POST:", error)
    return NextResponse.json({ error: "Failed to save attachments" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; todoId: string }> },
) {
  try {
    const { practiceId, todoId } = await params
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get("id")

    if (!attachmentId) {
      return NextResponse.json({ error: "Attachment ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { error } = await supabase
      .from("todo_attachments")
      .delete()
      .eq("id", attachmentId)
      .eq("todo_id", todoId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting todo attachment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in todo attachments DELETE:", error)
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 })
  }
}
