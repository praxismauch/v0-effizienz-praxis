import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; blockId: string }> }
) {
  try {
    const { practiceId, blockId } = await params
    const supabase = await createAdminClient()
    
    const body = await request.json()

    // Update time block
    const { data: block, error } = await supabase
      .from("time_blocks")
      .update(body)
      .eq("id", blockId)
      .eq("practice_id", practiceId)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating time block:", error)
      return NextResponse.json(
        { error: "Failed to update time block", details: error.message },
        { status: 500 }
      )
    }

    if (!block) {
      return NextResponse.json(
        { error: "Time block not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ block })
  } catch (error) {
    console.error("[v0] Error in time block PATCH API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; blockId: string }> }
) {
  try {
    const { practiceId, blockId } = await params
    const supabase = await createAdminClient()

    // Delete time block
    const { error } = await supabase
      .from("time_blocks")
      .delete()
      .eq("id", blockId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting time block:", error)
      return NextResponse.json(
        { error: "Failed to delete time block", details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in time block DELETE API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
