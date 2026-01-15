import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const { data, error } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching job posting:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Job posting not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in job posting GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const body = await request.json()

    const sanitizedBody = Object.keys(body).reduce((acc: any, key) => {
      const value = body[key]
      if ((key.includes("_date") || key.includes("_time") || key === "deadline") && value === "") {
        acc[key] = null
      } else {
        acc[key] = value
      }
      return acc
    }, {})

    const { data, error } = await supabase
      .from("job_postings")
      .update({
        ...sanitizedBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating job posting:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in job posting PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createAdminClient()
    const { id } = await params
    const { error } = await supabase.from("job_postings").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting job posting:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error in job posting DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
