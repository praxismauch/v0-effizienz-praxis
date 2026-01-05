import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get("teamMemberId")

    const supabase = await createAdminClient()

    let query = supabase
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string } }) {
  try {
    const { practiceId } = params
    const body = await request.json()

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        practice_id: practiceId,
        ...body,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
