import { createAdminClient } from "@/lib/supabase/admin"
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
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ budgets: [], usage: [] })
      }
      throw err
    }

    // Fetch budgets
    const { data: budgets, error: budgetsError } = await supabase
      .from("training_budgets")
      .select(`
        *,
        team_member:team_members(id, first_name, last_name),
        team:teams(id, name, color)
      `)
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

    // Fetch usage for these budgets
    const budgetIds = (budgets || []).map((b) => b.id)
    let usage: unknown[] = []

    if (budgetIds.length > 0) {
      const { data: usageData, error: usageError } = await supabase
        .from("training_budget_usage")
        .select("*")
        .in("budget_id", budgetIds)

      if (usageError) {
        console.error("Error fetching usage:", usageError)
      } else {
        usage = usageData || []
      }
    }

    // Calculate remaining budget for each
    const budgetsWithRemaining = (budgets || []).map((budget) => {
      const budgetUsage = (usage as { budget_id: string; amount: number }[]).filter(
        (u) => u.budget_id === budget.id,
      )
      const totalUsed = budgetUsage.reduce((sum, u) => sum + (u.amount || 0), 0)
      return {
        ...budget,
        used_amount: totalUsed,
        remaining_amount: budget.budget_amount - totalUsed,
      }
    })

    return NextResponse.json({ budgets: budgetsWithRemaining, usage })
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
      supabase = await createAdminClient()
    } catch (err) {
      if (isRateLimitError(err)) {
        return NextResponse.json({ error: "Zu viele Anfragen" }, { status: 429 })
      }
      throw err
    }

    const { data, error } = await supabase
      .from("training_budgets")
      .insert({
        practice_id: practiceId,
        team_member_id: body.team_member_id || body.teamMemberId || null,
        team_id: body.team_id || body.teamId || null,
        year: body.year || new Date().getFullYear(),
        budget_amount: body.budget_amount || body.budgetAmount,
        currency: body.currency || "EUR",
        notes: body.notes,
        created_by: createdBy,
      })
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
