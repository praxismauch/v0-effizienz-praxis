import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
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
        parameter:analytics_parameters(id, name, category, unit, data_type)
      `,
      )
      .eq("practice_id", practiceId)
      .order("recorded_date", { ascending: false })

    if (parameterId) {
      query = query.eq("parameter_id", parameterId)
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

    // Fetch user names from practice_members
    const { data: members } = await supabase
      .from("practice_members")
      .select("user_id, first_name, last_name")
      .eq("practice_id", practiceId)

    const userMap: Record<string, string> = {}
    members?.forEach((m) => {
      if (m.user_id) {
        userMap[m.user_id] = `${m.first_name || ""} ${m.last_name || ""}`.trim() || "Unbekannt"
      }
    })

    // Enrich data with user names
    const enrichedData = (data || []).map((item) => ({
      ...item,
      user: item.recorded_by ? { id: item.recorded_by, name: userMap[item.recorded_by] || "Unbekannt" } : null,
    }))

    return NextResponse.json(enrichedData)
  } catch (error) {
    console.error("[v0] Error fetching parameter values:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch parameter values"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
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
        parameter:analytics_parameters(id, name, category, unit, data_type)
      `,
      )
      .single()

    if (error) {
      console.error("[v0] Parameter value insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user name from practice_members
    const { data: member } = await supabase
      .from("practice_members")
      .select("first_name, last_name")
      .eq("user_id", recordedBy)
      .eq("practice_id", practiceId)
      .single()

    const enrichedData = {
      ...data,
      user: {
        id: recordedBy,
        name: member ? `${member.first_name || ""} ${member.last_name || ""}`.trim() : "Unbekannt",
      },
    }

    return NextResponse.json({ value: enrichedData })
  } catch (error) {
    console.error("[v0] Error creating parameter value:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create parameter value"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
