import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; todoId: string }> },
) {
  try {
    const { todoId, practiceId } = await params
    const todoIdText = String(todoId)
    const body = await request.json()
    const supabase = await createAdminClient()

    const { id, created_at, practice_id, ...updateFields } = body

    const sanitizedBody = Object.keys(updateFields).reduce((acc: any, key) => {
      const value = updateFields[key]
      // Convert empty strings to null for date fields
      if ((key.includes("_date") || key.includes("_time") || key === "due_date") && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const updates = {
      ...sanitizedBody,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("todos").update(updates).eq("id", todoIdText).select().maybeSingle()

    if (error) {
      console.error("[v0] Error updating todo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Todo nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in todos PUT:", error)
    return NextResponse.json({ error: "Failed to update todo" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; todoId: string }> },
) {
  try {
    const { todoId } = await params
    const todoIdText = String(todoId)
    const supabase = await createAdminClient()

    const { error } = await supabase.from("todos").delete().eq("id", todoIdText)

    if (error) {
      console.error("[v0] Error deleting todo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in todos DELETE:", error)
    return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 })
  }
}
