import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; breakId: string }> }
) {
  try {
    const { breakId } = await params
    const supabase = await createAdminClient()
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Datenbankverbindung nicht verfügbar", success: false },
        { status: 503 }
      )
    }
    
    const body = await request.json()

    // Update break
    const { data: breakRecord, error } = await supabase
      .from("time_block_breaks")
      .update(body)
      .eq("id", breakId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating break:", error)
      return NextResponse.json(
        { error: "Failed to update break", details: error.message },
        { status: 500 }
      )
    }

    if (!breakRecord) {
      return NextResponse.json(
        { error: "Break not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ break: breakRecord })
  } catch (error) {
    console.error("[v0] Error in break PATCH API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
