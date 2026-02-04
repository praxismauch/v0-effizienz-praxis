import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contractId: string }> },
) {
  try {
    const { contractId } = await params
    const contractIdText = String(contractId)
    const body = await request.json()

    const supabase = await createAdminClient()

    // Known columns in the contracts table
    const knownColumns = [
      'team_member_id', 'contract_type', 'start_date', 'end_date',
      'hours_per_week', 'salary', 'salary_currency', 'bonus_personal_goal',
      'bonus_practice_goal', 'bonus_employee_discussion', 'notes', 'is_active',
      'has_13th_salary', 'holiday_days_fulltime', 'working_days_fulltime'
    ]

    const sanitizedBody = Object.keys(body).reduce((acc: any, key) => {
      // Skip unknown columns to prevent database errors
      if (!knownColumns.includes(key)) {
        return acc
      }
      const value = body[key]
      if ((key.includes("_date") || key.includes("_time") || key === "birthday") && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const { data, error } = await supabase
      .from("contracts")
      .update({
        ...sanitizedBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractIdText)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Vertrag nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; contractId: string }> },
) {
  try {
    const { contractId } = await params
    const contractIdText = String(contractId)

    const supabase = await createAdminClient()

    const { error } = await supabase.from("contracts").delete().eq("id", contractIdText)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
