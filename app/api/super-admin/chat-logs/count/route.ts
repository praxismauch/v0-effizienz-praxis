import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase
      .from("chat_logs")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting chat logs:", error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error loading chat logs count:", error)
    return NextResponse.json({ count: 0 })
  }
}
