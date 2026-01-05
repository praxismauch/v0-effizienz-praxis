import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const parameterId = searchParams.get("parameter_id")

    let query = supabase.from("super_admin_parameter_values").select("*").order("recorded_date", { ascending: false })

    if (parameterId) {
      query = query.eq("parameter_id", parameterId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching super admin parameter values:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ values: data || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/super-admin/parameter-values:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const parameterId = body.parameterId || body.parameter_id
    const recordedDate = body.recordedDate || body.recorded_date
    const recordedBy = body.recordedBy || body.recorded_by

    if (!recordedBy) {
      return NextResponse.json({ error: "recorded_by is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("super_admin_parameter_values")
      .insert({
        parameter_id: parameterId,
        value: body.value,
        recorded_date: recordedDate,
        recorded_by: recordedBy,
        notes: body.notes,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating super admin parameter value:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ value: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/super-admin/parameter-values:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
