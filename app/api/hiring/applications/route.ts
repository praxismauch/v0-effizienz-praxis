import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { validateRequest, createApplicationSchema, uuidSchema } from "@/lib/api/schemas"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")
    const jobPostingId = searchParams.get("jobPostingId")
    const candidateId = searchParams.get("candidateId")

    let query = supabase
      .from("applications")
      .select(
        `
        *,
        job_posting:job_postings(*),
        candidate:candidates(*)
      `,
      )
      .order("applied_at", { ascending: false })

    if (practiceId) {
      query = query.eq("practice_id", practiceId)
    }

    if (jobPostingId) {
      query = query.eq("job_posting_id", jobPostingId)
    }

    if (candidateId) {
      query = query.eq("candidate_id", candidateId)
    }

    const { data, error } = await query

    if (error) {
      if (error.message.includes("Could not find the table") || error.code === "PGRST205") {
        return NextResponse.json([])
      }
      console.error("Error fetching applications:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error("Error in applications GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateRequest(createApplicationSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const validatedData = validation.data

    const supabase = await createClient()
    const { data: existing } = await supabase
      .from("applications")
      .select("id")
      .eq("candidate_id", validatedData.candidate_id)
      .eq("job_posting_id", validatedData.job_posting_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(existing)
    }

    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from("applications")
      .insert([
        {
          ...validatedData,
          applied_at: new Date().toISOString(),
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in applications POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const candidateId = searchParams.get("candidateId")
    const jobPostingId = searchParams.get("jobPostingId")

    // Validate UUIDs
    const candidateValidation = uuidSchema.safeParse(candidateId)
    const jobPostingValidation = uuidSchema.safeParse(jobPostingId)

    if (!candidateValidation.success || !jobPostingValidation.success) {
      return NextResponse.json({ error: "Invalid candidate ID or job posting ID" }, { status: 400 })
    }

    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from("applications")
      .delete()
      .eq("candidate_id", candidateId)
      .eq("job_posting_id", jobPostingId)

    if (error) {
      console.error("Applications DELETE error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in applications DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
