import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")
    const status = searchParams.get("status")

    let query = supabase.from("job_postings").select("*").order("created_at", { ascending: false })

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205") {
        return NextResponse.json([])
      }
      console.error("[v0] Error fetching job postings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("[v0] Error in job postings GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("job_postings")
      .insert([
        {
          ...body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205") {
        return NextResponse.json(
          { error: "Hiring tables not set up. Please run the SQL migration script." },
          { status: 503 },
        )
      }
      console.error("[v0] Error creating job posting:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error in job postings POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
