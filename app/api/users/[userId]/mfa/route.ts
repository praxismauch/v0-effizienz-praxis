import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createServerClient()
    const { mfa_enabled } = await request.json()

    const { error } = await supabase.from("users").update({ mfa_enabled }).eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating MFA:", error)
    return NextResponse.json({ error: "Failed to update MFA" }, { status: 500 })
  }
}
