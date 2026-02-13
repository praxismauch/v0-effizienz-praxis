import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Users count API - Error:", error)
      return NextResponse.json({ count: 0 }, { status: 200 })
    }

    return NextResponse.json({ count: count || 0 })
  } catch (error) {
    console.error("Users count API - Exception:", error)
    return NextResponse.json({ count: 0 }, { status: 200 })
  }
}
