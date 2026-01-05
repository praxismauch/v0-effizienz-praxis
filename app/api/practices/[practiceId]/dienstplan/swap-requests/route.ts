import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const supabase = await createClient()

    let query = supabase.from("shift_swap_requests").select("*").eq("practice_id", practiceId)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: swapRequests, error } = await query.order("created_at", { ascending: false })

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ swapRequests: [] })
      }
      throw error
    }

    return NextResponse.json({ swapRequests })
  } catch (error) {
    console.error("Error fetching swap requests:", error)
    return NextResponse.json({ swapRequests: [] })
  }
}
