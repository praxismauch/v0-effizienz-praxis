import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data, error } = await supabase
      .from("applications")
      .select(`
        *,
        job_posting:job_postings(*),
        candidate:candidates(*)
      `)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching application:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in application GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    const { data, error } = await supabase
      .from("applications")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .is("deleted_at", null)
      .select()
      .maybeSingle()

    if (error) {
      console.error("[v0] Error updating application:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in application PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
      .from("applications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null)

    if (error) {
      // Check if table doesn't exist
      if (error.code === "PGRST205") {
        return NextResponse.json(
          { error: "Applications table not found. Please run the hiring tables migration script." },
          { status: 404 },
        )
      }
      console.error("[v0] Error deleting application:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Application deleted successfully" })
  } catch (error: any) {
    console.error("[v0] Error in application DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
