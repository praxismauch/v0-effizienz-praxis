import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id: responsibilityId } = await params

    const supabase = await createAdminClient()

    const { data: todos, error } = await supabase
      .from("todos")
      .select("id, title, description, completed, priority, due_date, created_at")
      .eq("practice_id", practiceId)
      .eq("responsibility_id", responsibilityId)
      .order("completed", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching responsibility todos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(todos || [])
  } catch (error) {
    console.error("[v0] Error in responsibility todos route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
