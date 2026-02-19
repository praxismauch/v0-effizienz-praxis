import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { isRateLimitError } from "@/lib/supabase/safe-query"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Analysis ID required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createServerClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        )
      }
      throw clientError
    }

    const { error } = await supabase
      .from("roi_analyses")
      .delete()
      .eq("id", id)

    if (error) {
      // If table doesn't exist, return success (nothing to delete)
      if (error.code === "42P01" || error.code === "PGRST204") {
        return NextResponse.json({ success: true })
      }
      console.error("[v0] Error deleting AI analysis:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] AI Analysis DELETE error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Analysis ID required" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createServerClient()
    } catch (clientError) {
      if (isRateLimitError(clientError)) {
        return NextResponse.json(
          { error: "Service temporarily unavailable" },
          { status: 503 }
        )
      }
      throw clientError
    }

    const { data, error } = await supabase
      .from("roi_analyses")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      if (error.code === "42P01" || error.code === "PGRST204") {
        return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
      }
      console.error("[v0] Error fetching AI analysis:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ analysis: data })
  } catch (error: any) {
    console.error("[v0] AI Analysis GET error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
