import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const supabase = await createClient()

    // Try with practice_id first, fall back to document_id only if column doesn't exist
    let signatures
    const result = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", documentId)
      .eq("practice_id", practiceId)
      .order("signed_at", { ascending: false })

    if (result.error?.code === "42703" || result.error?.message?.includes("does not exist")) {
      // Column doesn't exist, query without it
      const fallback = await supabase
        .from("document_signatures")
        .select("*")
        .eq("document_id", documentId)
        .order("signed_at", { ascending: false })

      if (fallback.error) {
        // Table may not exist at all
        if (fallback.error.code === "PGRST205" || fallback.error.code === "42P01") {
          return NextResponse.json([])
        }
        console.error("Error fetching signatures:", fallback.error)
        return NextResponse.json({ error: "Failed to fetch signatures" }, { status: 500 })
      }
      signatures = fallback.data
    } else if (result.error) {
      if (result.error.code === "PGRST205" || result.error.code === "42P01") {
        return NextResponse.json([])
      }
      console.error("Error fetching signatures:", result.error)
      return NextResponse.json({ error: "Failed to fetch signatures" }, { status: 500 })
    } else {
      signatures = result.data
    }

    return NextResponse.json(signatures || [])
  } catch (error) {
    console.error("Error in get signatures:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
