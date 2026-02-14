import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { emails } = await request.json()

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "No emails provided" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Update users with admin privileges (bypasses RLS)
    const { data, error } = await supabase
      .from("users")
      .update({ 
        is_active: true, 
        updated_at: new Date().toISOString() 
      })
      .in("email", emails)
      .select("email, is_active")

    if (error) {
      console.error("[v0] Error activating users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      activated: data,
      count: data?.length || 0
    })
  } catch (error) {
    console.error("[v0] Error in activation endpoint:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
