import { getApiClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const errorString = String(error)
  return (
    error instanceof SyntaxError ||
    errorString.includes("Too Many") ||
    errorString.includes("Unexpected token") ||
    errorString.includes("is not valid JSON")
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year") || new Date().getFullYear().toString()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ budgets: [], usage: [] })
      }
      throw err
    }

    // Fetch budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from("training_budgets")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("year", Number.parseInt(year))
      .is("deleted_at", null)

    if (budgetsError) {
      if (isRateLimitError(budgetsError)) {
        return NextResponse.json({ budgets: [], usage: [] })
      }
      console.error("Error fetching budgets:", budgetsError)
      return NextResponse.json({ error: budgetsError.message }, { status: 500 })
    }

    // Calculate remaining budget using spent_amount from the budget record itself
    const budgetsWithRemaining = (budgets || []).map((budget) => {
      const spentAmount = budget.spent_amount || 0
      return {
        ...budget,
        used_amount: spentAmount,
        remaining_amount: (budget.budget_amount || 0) - spentAmount,
      }
    })

    return NextResponse.json({ budgets: budgetsWithRemaining })
  } catch (error) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ budgets: [], usage: [] })
    }
    console.error("Error in budgets GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const createdBy = body.created_by || body.createdBy
    if (!createdBy) {
      return NextResponse.json({ error: "created_by is required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await getApiClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    // Build insert payload, only include team_member_id if explicitly provided (must be a valid team_members FK)
    const insertData: Record<string, unknown> = {
      practice_id: practiceId,
      team_id: body.team_id || body.teamId || null,
      year: body.year || new Date().getFullYear(),
      budget_amount: body.budget_amount || body.budgetAmount,
      currency: body.currency || "EUR",
      notes: body.notes || null,
      created_by: createdBy,
    }
    // Only set team_member_id if explicitly provided and not the auth user ID
    if (body.team_member_id && body.team_member_id !== createdBy) {
      insertData.team_member_id = body.team_member_id
    }

    const { data, error } = await supabase
      .from("training_budgets")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Error creating budget:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ budget: data })
  } catch (error) {
    console.error("Error in budgets POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
