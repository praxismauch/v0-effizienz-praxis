import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Missing practiceId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: files, error } = await supabase
      .from("imported_files")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("[v0] Failed to load history:", error)
      return NextResponse.json({ files: [] })
    }

    return NextResponse.json({
      files: files.map((file) => ({
        id: file.id,
        name: file.file_name,
        size: file.file_size,
        type: file.file_type,
        source: file.source,
        category: file.category,
        targetSection: file.target_section,
        status: file.status,
        error: file.error_message,
        createdAt: file.created_at,
        aiConfidence: file.ai_confidence,
      })),
    })
  } catch (error) {
    console.error("[v0] History load error:", error)
    return NextResponse.json({ files: [] })
  }
}
