import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Delete related data first (cascade)
    await supabase.from("todos").delete().eq("user_id", userId)
    await supabase.from("user_preferences").delete().eq("user_id", userId)
    await supabase.from("parameter_values").delete().eq("user_id", userId)

    // Delete user account
    const { error: deleteError } = await supabase.from("users").delete().eq("id", userId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: "Account and all associated data have been permanently deleted",
    })
  } catch (error) {
    console.error("[v0] Error deleting account:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
