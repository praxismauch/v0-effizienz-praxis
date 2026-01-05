import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { broadcastNotification, type NotificationType } from "@/lib/notifications"
import { isSuperAdminRole } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is super admin
    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!userData || !isSuperAdminRole(userData.role)) {
      return NextResponse.json({ error: "Forbidden - Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { title, message, type, link, practiceId } = body

    if (!title || !message) {
      return NextResponse.json({ error: "Missing required fields: title, message" }, { status: 400 })
    }

    const result = await broadcastNotification({
      title,
      message,
      type: (type as NotificationType) || "system_announcement",
      link,
      practiceId,
      metadata: { sentBy: user.id },
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to broadcast" }, { status: 500 })
    }

    return NextResponse.json({ success: true, sentCount: result.sentCount })
  } catch (error) {
    console.error("[v0] Error broadcasting notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
