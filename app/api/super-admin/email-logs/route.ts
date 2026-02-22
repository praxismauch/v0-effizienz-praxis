import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {

    // Fetch email-related logs from system_logs
    const adminSupabase = await createAdminClient()

    const { data: logs, error } = await adminSupabase
      .from("system_logs")
      .select("created_at, level, message")
      .or("message.ilike.%email%,message.ilike.%resend%,message.ilike.%mail%")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching email logs:", error)
      // Return empty logs instead of failing
      return NextResponse.json({ logs: [] })
    }

    const formattedLogs = (logs || []).map((log: any) => ({
      timestamp: log.created_at,
      level: log.level || "info",
      message: log.message,
    }))

    return NextResponse.json({ logs: formattedLogs })
  } catch (error) {
    console.error("[v0] Error in email logs endpoint:", error)
    return NextResponse.json({ logs: [] })
  }
}
