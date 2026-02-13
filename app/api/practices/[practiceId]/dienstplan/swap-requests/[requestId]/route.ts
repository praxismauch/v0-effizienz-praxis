import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Support both PATCH and PUT for backwards compatibility
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ practiceId: string; requestId: string }> },
) {
  return PUT(request, context)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; requestId: string }> },
) {
  try {
    const { practiceId, requestId } = await params
    const body = await request.json()
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Update the swap request status
    const { data: swapRequest, error: updateError } = await supabase
      .from("shift_swap_requests")
      .update({
        status: body.status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (updateError) throw updateError

    // If approved, swap the shifts
    if (body.status === "approved" && swapRequest) {
      const { requester_shift_id, target_shift_id, requester_id, target_id } = swapRequest

      // Get both shifts
      const { data: shifts } = await supabase
        .from("shift_schedules")
        .select("*")
        .in("id", [requester_shift_id, target_shift_id])

      if (shifts && shifts.length === 2) {
        const requesterShift = shifts.find((s) => s.id === requester_shift_id)
        const targetShift = shifts.find((s) => s.id === target_shift_id)

        // Swap the team_member_ids
        await supabase.from("shift_schedules").update({ team_member_id: target_id }).eq("id", requester_shift_id)

        await supabase.from("shift_schedules").update({ team_member_id: requester_id }).eq("id", target_shift_id)
      }
    }

    return NextResponse.json({ swapRequest })
  } catch (error) {
    console.error("Error updating swap request:", error)
    return NextResponse.json({ error: "Failed to update swap request" }, { status: 500 })
  }
}
