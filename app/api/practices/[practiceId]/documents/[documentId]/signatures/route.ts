import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ practiceId: string; documentId: string }> },
) {
  try {
    const { practiceId, documentId } = await params
    const supabase = await createClient()

    const { data: signatures, error } = await supabase
      .from("document_signatures")
      .select("*")
      .eq("document_id", documentId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("signed_at", { ascending: false })

    if (error) {
      console.error("Error fetching signatures:", error)
      return NextResponse.json({ error: "Failed to fetch signatures" }, { status: 500 })
    }

    return NextResponse.json(signatures || [])
  } catch (error) {
    console.error("Error in get signatures:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
