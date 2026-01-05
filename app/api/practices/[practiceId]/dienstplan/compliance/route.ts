import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const { searchParams } = new URL(request.url)
    const resolved = searchParams.get("resolved")
    const supabase = await createClient()

    let query = supabase.from("compliance_violations").select("*").eq("practice_id", practiceId)

    if (resolved === "false") {
      query = query.eq("resolved", false)
    }

    const { data: violations, error } = await query.order("created_at", { ascending: false })

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ violations: [] })
      }
      throw error
    }

    return NextResponse.json({ violations })
  } catch (error) {
    console.error("Error fetching compliance violations:", error)
    return NextResponse.json({ violations: [] })
  }
}
