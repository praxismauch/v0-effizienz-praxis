import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { id: checklistId, itemId } = await params

    const updateData: any = {}

    if ("is_completed" in body) {
      updateData.completed = body.is_completed
      if (body.is_completed) {
        updateData.completed_at = new Date().toISOString()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          updateData.completed_by = user.id
        }
      } else {
        updateData.completed_at = null
        updateData.completed_by = null
      }
    }

    if ("notes" in body) {
      updateData.notes = body.notes
    }

    const { data, error } = await supabase
      .from("test_checklist_items")
      .update(updateData)
      .eq("id", itemId)
      .select()
      .single()

    if (error) throw error

    // Update checklist progress
    const { data: allItems } = await supabase
      .from("test_checklist_items")
      .select("completed")
      .eq("checklist_id", checklistId)

    if (allItems) {
      const total = allItems.length
      const completedCount = allItems.filter((i: any) => i.completed).length
      const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0
      const status = completedCount === total ? "completed" : completedCount > 0 ? "in_progress" : "open"

      await supabase
        .from("test_checklists")
        .update({
          completed_items: completedCount,
          progress,
          status,
          updated_at: new Date().toISOString(),
          ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
        })
        .eq("id", checklistId)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating checklist item:", error)
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 })
  }
}
