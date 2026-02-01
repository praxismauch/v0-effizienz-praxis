import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")

    let query = supabase
      .from("time_blocks")
      .select("*")
      .eq("practice_id", practiceId)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (startDate) {
      query = query.gte("date", startDate)
    }

    if (endDate) {
      query = query.lte("date", endDate)
    }

    query = query.order("date", { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error("Error fetching time blocks:", error)
      return NextResponse.json({ timeBlocks: [] })
    }

    return NextResponse.json({ timeBlocks: data || [] })
  } catch (error) {
    console.error("Error in time blocks GET:", error)
    return NextResponse.json({ timeBlocks: [] })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const timeBlockData = {
      ...body,
      practice_id: practiceId,
      user_id: body.user_id || user.id,
    }

    const { data, error } = await supabase
      .from("time_blocks")
      .insert(timeBlockData)
      .select()
      .single()

    if (error) {
      console.error("Error creating time block:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ timeBlock: data })
  } catch (error) {
    console.error("Error in time blocks POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
