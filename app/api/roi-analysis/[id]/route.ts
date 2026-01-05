import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { data: analysis, error } = await supabase.from("roi_analyses").select("*").eq("id", id).maybeSingle()

    if (error) {
      console.error("Error fetching ROI analysis:", error)
      return NextResponse.json({ error: "Failed to fetch ROI analysis" }, { status: 500 })
    }

    if (!analysis) {
      return NextResponse.json({ error: "ROI Analyse nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("Error fetching ROI analysis:", error)
    return NextResponse.json({ error: "Failed to fetch ROI analysis" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params

    const { error } = await supabase.from("roi_analyses").delete().eq("id", id)

    if (error) {
      console.error("Error deleting ROI analysis:", error)
      return NextResponse.json({ error: "Failed to delete ROI analysis" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting ROI analysis:", error)
    return NextResponse.json({ error: "Failed to delete ROI analysis" }, { status: 500 })
  }
}
