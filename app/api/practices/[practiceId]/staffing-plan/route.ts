import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

async function retryOnRateLimit<T>(
  fn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delayMs = 500,
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()

      // Check if error is rate limit related
      if (result.error) {
        const errorMsg =
          typeof result.error === "string" ? result.error : result.error?.message || JSON.stringify(result.error)

        if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit") || errorMsg.includes("429")) {
          lastError = result.error
          await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
          continue
        }
      }

      return result
    } catch (e: any) {
      const errorMsg = e?.message || String(e)
      if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit") || errorMsg.includes("429")) {
        lastError = e
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)))
        continue
      }
      return { data: null, error: e }
    }
  }

  return { data: null, error: lastError }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")

    const supabase = await createAdminClient()

    let query = supabase
      .from("staffing_plan")
      .select(
        `
        *,
        team:teams(id, name, color)
      `,
      )
      .eq("practice_id", practiceId)

    if (planId) {
      query = query.eq("plan_id", planId)
    }

    const { data, error } = await retryOnRateLimit(() =>
      query.order("day_of_week").order("time_slot").order("display_order", { ascending: true }),
    )

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const supabase = await createAdminClient()

    const { data: existingEntries, error: countError } = await retryOnRateLimit(() =>
      supabase
        .from("staffing_plan")
        .select("display_order")
        .eq("practice_id", practiceId)
        .eq("day_of_week", body.day_of_week)
        .eq("time_slot", body.time_slot)
        .order("display_order", { ascending: false })
        .limit(1),
    )

    if (countError) {
      console.error(
        "[v0] Error fetching max display_order (using default):",
        typeof countError === "object" ? countError.message : countError,
      )
    }

    const nextDisplayOrder =
      existingEntries && existingEntries.length > 0 ? (existingEntries[0].display_order || 0) + 1 : 1

    const { data, error } = await retryOnRateLimit(() =>
      supabase
        .from("staffing_plan")
        .insert({
          practice_id: practiceId,
          plan_id: body.plan_id,
          day_of_week: body.day_of_week,
          time_slot: body.time_slot,
          team_id: body.team_id,
          hours: body.hours,
          name: body.name || null,
          notes: body.notes || null,
          created_by: body.created_by || null,
          calculate_from_timespan: body.calculate_from_timespan || false,
          start_time: body.start_time || null,
          end_time: body.end_time || null,
          display_order: nextDisplayOrder,
          updated_at: new Date().toISOString(),
        })
        .select(
          `
          *,
          team:teams(id, name, color)
        `,
        )
        .single(),
    )

    if (error) {
      console.error("[v0] Error creating staffing plan entry:", error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Staffing plan POST error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
