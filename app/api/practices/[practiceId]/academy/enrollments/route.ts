import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createAdminClient()

    const { data: enrollments, error } = await supabase
      .from("academy_enrollments")
      .select(`
        *,
        course:academy_courses(*)
      `)
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("last_accessed_at", { ascending: false })

    if (error) {
      console.error("[v0] Academy enrollments error:", error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(enrollments || [])
  } catch (error: any) {
    console.error("[v0] Error fetching enrollments:", error)
    return NextResponse.json([])
  }
}
