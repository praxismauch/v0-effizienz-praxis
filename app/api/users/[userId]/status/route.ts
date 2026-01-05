import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const supabase = await createServerClient()
    const { is_active } = await request.json()

    const { error } = await supabase.from("users").update({ is_active }).eq("id", params.userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
  }
}
