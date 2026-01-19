import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string }> }
) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()
    
    const body = await request.json()
    const { userId, location, comment } = body

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Insert time stamp
    const { data: stamp, error: stampError } = await supabase
      .from("time_stamps")
      .insert({
        user_id: userId,
        practice_id: practiceId,
        location,
        comment,
      })
      .select()
      .maybeSingle()

    if (stampError) {
      console.error("[v0] Error creating time stamp:", stampError)
      return NextResponse.json(
        { error: "Failed to create time stamp", details: stampError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ stamp })
  } catch (error) {
    console.error("[v0] Error in time stamps API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
