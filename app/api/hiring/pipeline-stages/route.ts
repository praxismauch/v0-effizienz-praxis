import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { defaultPipelineStages } from "@/lib/recruiting-defaults"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const practiceId = searchParams.get("practiceId")
    const jobPostingId = searchParams.get("jobPostingId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    let query = supabase
      .from("hiring_pipeline_stages")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("stage_order", { ascending: true })

    if (jobPostingId) {
      query = query.eq("job_posting_id", jobPostingId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching pipeline stages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (jobPostingId && (!data || data.length === 0)) {
      const stagesToCreate = defaultPipelineStages.map((stage) => ({
        ...stage,
        practice_id: practiceId,
        job_posting_id: jobPostingId,
        is_active: true,
      }))

      const { data: newStages, error: createError } = await supabase
        .from("hiring_pipeline_stages")
        .insert(stagesToCreate)
        .select()

      if (createError) {
        console.error("[v0] Error creating default pipeline stages:", createError)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json(newStages)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in pipeline stages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, color, description, stage_order, practice_id, job_posting_id } = body

    if (!name || !practice_id) {
      return NextResponse.json({ error: "Name and practice_id are required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("hiring_pipeline_stages")
      .insert({
        name,
        color: color || "#6b7280",
        description,
        stage_order: stage_order || 0,
        practice_id,
        job_posting_id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating pipeline stage:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in pipeline stages POST API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
