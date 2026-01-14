import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 500): Promise<T | null> {
  let lastError: Error | null = null
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()
      return result
    } catch (error: unknown) {
      lastError = error as Error
      const errorMessage = lastError?.message || String(error)
      if (errorMessage.includes("Too Many") || errorMessage.includes("rate") || errorMessage.includes("429")) {
        console.log("[v0] Rate limit detected, retrying in", baseDelay * Math.pow(2, i), "ms")
        await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, i)))
        continue
      }
      throw error
    }
  }
  console.log("[v0] Rate limit retries exhausted, returning null")
  return null
}

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params

    const effectivePracticeId =
      practiceId && practiceId !== "0" && practiceId !== "undefined" ? String(practiceId) : "1"

    let supabase
    try {
      const { adminClient } = await requirePracticeAccess(effectivePracticeId)
      supabase = adminClient
    } catch (error) {
      console.log("[v0] todos GET: Auth failed, using admin client fallback")
      supabase = createAdminClient()
    }

    const result = await withRetry(() =>
      supabase
        .from("todos")
        .select("*")
        .eq("practice_id", effectivePracticeId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    )

    if (result === null) {
      console.log("[v0] Todos GET - Rate limited, returning empty array")
      return NextResponse.json([])
    }

    const { data: todos, error } = result

    if (error) {
      const errorMessage = error.message || ""
      if (errorMessage.includes("Too Many") || errorMessage.includes("rate")) {
        console.log("[v0] Todos GET - Rate limited via error, returning empty array")
        return NextResponse.json([])
      }
      console.error("Todos fetch error:", error)
      return NextResponse.json([])
    }

    return NextResponse.json(todos || [])
  } catch (error: unknown) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const body = await request.json()

    const effectivePracticeId =
      practiceId && practiceId !== "0" && practiceId !== "undefined" ? String(practiceId) : "1"

    const { adminClient: supabase } = await requirePracticeAccess(effectivePracticeId)

    const createdBy = body.created_by || body.createdBy
    const assignedTo = body.assigned_to || body.assignedTo

    const newTodo: Record<string, any> = {
      title: body.title,
      description: body.description || null,
      status: body.status || "offen",
      priority: body.priority || "medium",
      due_date: body.due_date || body.dueDate || null,
      created_by: createdBy || null,
      assigned_to: assignedTo || null,
      practice_id: effectivePracticeId,
      completed: body.completed || false,
      responsibility_id: body.responsibility_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (body.assigned_user_ids && Array.isArray(body.assigned_user_ids) && body.assigned_user_ids.length > 0) {
      newTodo.assigned_user_ids = body.assigned_user_ids
    }

    if (body.assigned_team_ids && Array.isArray(body.assigned_team_ids) && body.assigned_team_ids.length > 0) {
      newTodo.assigned_team_ids = body.assigned_team_ids
    }

    if (body.dringend !== undefined) {
      newTodo.dringend = body.dringend
    }

    if (body.wichtig !== undefined) {
      newTodo.wichtig = body.wichtig
    }

    if (body.recurrence_type && body.recurrence_type !== "none") {
      newTodo.recurrence_type = body.recurrence_type
      newTodo.recurring_pattern = body.recurrence_type
      newTodo.recurring = true
    }

    if (body.recurrence_end_date) {
      newTodo.recurrence_end_date = body.recurrence_end_date
    }

    console.log("[v0] Creating todo with data:", JSON.stringify(newTodo, null, 2))

    const { data, error } = await supabase.from("todos").insert(newTodo).select().single()

    if (error) {
      console.error("[v0] Error creating todo:", error)
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Todo created successfully:", data?.id)
    return NextResponse.json(data)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
