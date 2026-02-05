import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get("teamMemberId")

    let query = adminClient
      .from("contracts")
      .select("*")
      .eq("practice_id", practiceId)
      .order("start_date", { ascending: false })

    if (teamMemberId) {
      query = query.eq("team_member_id", teamMemberId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { adminClient } = await requirePracticeAccess(practiceId)

    const body = await request.json()

    // Known columns in the contracts table
    const knownColumns = [
      'team_member_id', 'contract_type', 'start_date', 'end_date',
      'hours_per_week', 'salary', 'salary_currency', 'bonus_personal_goal',
      'bonus_practice_goal', 'bonus_employee_discussion', 'notes', 'is_active',
      'has_13th_salary', 'holiday_days_fulltime', 'working_days_fulltime',
      'vacation_bonus', 'additional_payments'
    ]

    // Filter out unknown columns to prevent database errors
    const sanitizedBody = Object.keys(body).reduce((acc: any, key) => {
      if (!knownColumns.includes(key)) {
        return acc
      }
      const value = body[key]
      if ((key.includes("_date") || key.includes("_time")) && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const { data, error } = await adminClient
      .from("contracts")
      .insert({
        practice_id: practiceId,
        ...sanitizedBody,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
