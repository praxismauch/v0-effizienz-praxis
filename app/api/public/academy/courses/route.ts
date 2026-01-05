import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Public endpoint - no authentication required
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Fetch all published/active courses
    const { data: courses, error } = await supabase
      .from("academy_courses")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching public courses:", error)
      // Return empty array instead of error for public endpoint
      return NextResponse.json([])
    }

    return NextResponse.json(courses || [])
  } catch (error) {
    console.error("[v0] Error in public courses endpoint:", error)
    return NextResponse.json([])
  }
}
