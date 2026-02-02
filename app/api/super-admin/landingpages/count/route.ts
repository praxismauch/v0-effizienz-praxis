import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase
      .from("landingpages")
      .select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error counting landingpages:", error)
      return NextResponse.json({ count: 0 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Error loading landingpages count:", error)
    return NextResponse.json({ count: 0 })
  }
}
