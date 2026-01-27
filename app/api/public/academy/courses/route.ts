import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Public endpoint - no authentication required
export async function GET() {
  try {
    const supabase = await createAdminClient()

    const { count } = await supabase.from("academy_courses").select("*", { count: "exact", head: true })

    console.log("[v0] Total academy_courses in DB:", count)

    const { data: courses, error } = await supabase
      .from("academy_courses")
      .select("*")
      .or("is_published.eq.true,is_published.is.null")
      .order("is_featured", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching public courses:", error)
      // Return empty array instead of error for public endpoint
      return NextResponse.json([])
    }

    console.log("[v0] Fetched courses count:", courses?.length || 0)

    return NextResponse.json(courses || [])
  } catch (error) {
    console.error("[v0] Error in public courses endpoint:", error)
    return NextResponse.json([])
  }
}
