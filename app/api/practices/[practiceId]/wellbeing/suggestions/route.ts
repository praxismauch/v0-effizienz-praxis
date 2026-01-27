import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  const { practiceId } = await params
  const supabase = await createClient()

  try {
    const { data: suggestions, error } = await supabase
      .from("wellbeing_suggestions")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ suggestions: suggestions || [] })
  } catch (error) {
    console.error("Error fetching suggestions:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
