import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> }
) {
  try {
    const { practiceId, memberId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("vaccination_records")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("team_member_id", memberId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ vaccinations: data })
  } catch (error) {
    console.error("Error fetching vaccinations:", error)
    return NextResponse.json({ error: "Failed to fetch vaccinations" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> }
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("vaccination_records")
      .insert({
        team_member_id: memberId,
        practice_id: practiceId,
        ...body,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ vaccination: data })
  } catch (error) {
    console.error("Error creating vaccination:", error)
    return NextResponse.json({ error: "Failed to create vaccination" }, { status: 500 })
  }
}
