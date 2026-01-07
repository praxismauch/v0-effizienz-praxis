import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

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
  // Return null instead of throwing on rate limit exhaustion
  console.log("[v0] Rate limit retries exhausted, returning null")
  return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "0" || practiceId === "undefined") {
      return NextResponse.json([])
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json([])
    }

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const result = await withRetry(() =>
      supabase
        .from("todos")
        .select("*")
        .eq("practice_id", String(practiceId))
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    )

    // If withRetry returned null (rate limited), return empty array
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const { adminClient: supabase } = await requirePracticeAccess(practiceId)

    const createdBy = body.created_by || body.createdBy
    const assignedTo = body.assigned_to || body.assignedTo

    // Also changed default status from "pending" to "offen" to match German frontend values
    const newTodo = {
      title: body.title,
      description: body.description || null,
      status: body.status || "offen", // Changed from "pending" to "offen"
      priority: body.priority || "medium",
      due_date: body.due_date || body.dueDate || null,
      created_by: createdBy || null,
      assigned_to: assignedTo || null,
      assigned_user_ids: body.assigned_user_ids || [], // Added
      practice_id: practiceId,
      dringend: body.dringend || false, // Added
      wichtig: body.wichtig || false, // Added
      completed: body.completed || false, // Added
      recurrence_type: body.recurrence_type || "none", // Added
      recurrence_end_date: body.recurrence_end_date || null, // Added
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Creating todo with data:", JSON.stringify(newTodo, null, 2))

    const { data, error } = await supabase.from("todos").insert(newTodo).select().single()

    if (error) {
      console.error("[v0] Error creating todo:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Todo created successfully:", data?.id)
    return NextResponse.json(data)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
