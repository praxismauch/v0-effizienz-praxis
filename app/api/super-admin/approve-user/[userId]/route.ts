import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const body = await request.json()
    const { approve } = body

    const supabase = await createAdminClient()

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    const currentUserId = currentUser?.id

    if (approve) {
      const { error } = await supabase
        .from("users")
        .update({
          is_active: true,
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: currentUserId,
        })
        .eq("id", userId)

      if (error) {
        console.error("[v0] Error approving user:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`[v0] User ${userId} approved by ${currentUserId}`)
      return NextResponse.json({ success: true, message: "User approved" })
    } else {
      const { error } = await supabase
        .from("users")
        .update({
          is_active: false,
          approval_status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected_by: currentUserId,
        })
        .eq("id", userId)

      if (error) {
        console.error("[v0] Error rejecting user:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      console.log(`[v0] User ${userId} rejected by ${currentUserId}`)
      return NextResponse.json({ success: true, message: "User rejected" })
    }
  } catch (error) {
    console.error("[v0] Error in POST /api/super-admin/approve-user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process user approval" },
      { status: 500 },
    )
  }
}
