import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { isSuperAdminRole } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is super admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isV0Preview = (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && !user) || false

    if (!user && !isV0Preview) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use admin client in preview environment
    const clientToUse = isV0Preview ? await createAdminClient() : supabase

    // Only check role if we have a user
    if (user) {
      const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

      if (!isSuperAdminRole(userData?.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Fetch all waitlist entries
    const { data, error } = await clientToUse.from("waitlist").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching waitlist:", error)
      return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in waitlist GET route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
