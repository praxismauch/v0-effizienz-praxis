import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

// This endpoint should be called by a cron job daily
export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    // Find all recurring todos that need new instances generated
    const { data: recurringTodos, error } = await supabase
      .from("todos")
      .select("*")
      .eq("is_recurring_instance", false)
      .neq("recurrence_type", "none")
      .or(`last_generated_date.is.null,last_generated_date.lt.${todayStr}`)

    if (error) {
      console.error("[v0] Error fetching recurring todos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let generatedCount = 0

    for (const todo of recurringTodos || []) {
      // Check if recurrence has ended
      if (todo.recurrence_end_date && todo.recurrence_end_date < todayStr) {
        continue
      }

      // Calculate next due date based on recurrence type
      const lastGenerated = todo.last_generated_date ? new Date(todo.last_generated_date) : new Date(todo.created_at)
      const nextDueDate = calculateNextDueDate(lastGenerated, todo.recurrence_type, todo.due_date)

      // Only generate if next due date is today or in the past
      if (nextDueDate > today) {
        continue
      }

      // Create new todo instance
      const { error: insertError } = await supabase.from("todos").insert({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        due_date: nextDueDate.toISOString().split("T")[0],
        assigned_to: todo.assigned_to,
        practice_id: todo.practice_id,
        completed: false,
        dringend: todo.dringend,
        wichtig: todo.wichtig,
        parent_todo_id: todo.id,
        is_recurring_instance: true,
        recurrence_type: "none",
      })

      if (insertError) {
        console.error(`[v0] Error creating instance for todo ${todo.id}:`, insertError)
        continue
      }

      // Update last_generated_date on parent
      await supabase.from("todos").update({ last_generated_date: todayStr }).eq("id", todo.id)

      generatedCount++
    }

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      message: `Generated ${generatedCount} recurring todo instances`,
    })
  } catch (error: any) {
    console.error("[v0] Error in generate-recurring:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateNextDueDate(lastGenerated: Date, recurrenceType: string, originalDueDate?: string): Date {
  const nextDate = new Date(lastGenerated)

  switch (recurrenceType) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
  }

  return nextDate
}
