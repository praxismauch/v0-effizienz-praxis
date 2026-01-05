import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const parameterId = searchParams.get("parameterId")

    console.log("[v0] Fetching parameter values for practice:", practiceId, "parameterId:", parameterId)

    let query = supabase
      .from("parameter_values")
      .select(
        `
        *,
        parameter:analytics_parameters(id, name, category, unit, data_type),
        user:users(id, name)
      `,
      )
      .eq("practice_id", practiceId)
      .order("recorded_date", { ascending: false })

    if (parameterId) {
      query = query.eq("parameter_id", parameterId)
      console.log("[v0] Filtering by parameter ID:", parameterId)
    }

    if (month && year) {
      const startDate = `${year}-${month.padStart(2, "0")}-01`
      const endDate = new Date(Number.parseInt(year), Number.parseInt(month), 0).toISOString().split("T")[0]
      query = query.gte("recorded_date", startDate).lte("recorded_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Parameter values query error:", error)
      throw error
    }

    console.log("[v0] Fetched parameter values:", data?.length || 0)

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("[v0] Error fetching parameter values:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch parameter values"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const supabase = await createClient()
    const { practiceId } = await params
    const body = await request.json()

    console.log("[v0] Creating parameter value:", { practiceId, body })

    const recordedBy = body.userId || body.user_id || body.recordedBy || body.recorded_by

    if (!recordedBy) {
      console.error("[v0] Missing user_id in request")
      return NextResponse.json({ error: "user_id is required" }, { status: 400 })
    }

    if (!body.parameterId && !body.parameter_id) {
      console.error("[v0] Missing parameter_id in request")
      return NextResponse.json({ error: "parameter_id is required" }, { status: 400 })
    }

    if (body.value === undefined || body.value === null || body.value === "") {
      console.error("[v0] Missing value in request")
      return NextResponse.json({ error: "value is required" }, { status: 400 })
    }

    const valueId = `value-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const insertData = {
      id: valueId,
      practice_id: practiceId,
      parameter_id: body.parameterId || body.parameter_id,
      value: String(body.value),
      recorded_date: body.date || body.recorded_date || new Date().toISOString().split("T")[0],
      recorded_by: recordedBy,
      notes: body.notes || null,
    }

    console.log("[v0] Inserting parameter value:", insertData)

    const { data, error } = await supabase
      .from("parameter_values")
      .insert(insertData)
      .select(
        `
        *,
        parameter:analytics_parameters(id, name, category, unit, data_type),
        user:users(id, name)
      `,
      )
      .single()

    if (error) {
      console.error("[v0] Parameter value insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Parameter value created successfully:", data.id)

    return NextResponse.json({ value: data })
  } catch (error) {
    console.error("[v0] Error creating parameter value:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create parameter value"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
