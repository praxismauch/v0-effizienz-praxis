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

    const newTodo = {
      title: body.title,
      description: body.description,
      status: body.status || "pending",
      priority: body.priority || "medium",
      due_date: body.due_date || body.dueDate,
      created_by: createdBy,
      assigned_to: assignedTo,
      practice_id: practiceId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("todos").insert(newTodo).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    return handleApiError(error)
  }
}
