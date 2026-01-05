import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data: courses, error } = await supabase
      .from("academy_courses")
      .select("*")
      .eq("is_published", true)
      .order("display_order", { ascending: true })

    if (error) {
      console.error("[v0] Academy courses error:", error.message)
      // Handle rate limiting or any other error - return empty array
      return NextResponse.json([])
    }

    return NextResponse.json(courses || [])
  } catch (error: any) {
    console.error("[v0] Error fetching academy courses:", error)
    return NextResponse.json([])
  }
}
