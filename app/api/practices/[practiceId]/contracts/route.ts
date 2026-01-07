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

    const { data, error } = await adminClient
      .from("contracts")
      .insert({
        practice_id: practiceId,
        ...body,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    return handleApiError(error)
  }
}
