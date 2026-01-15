import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      if (error?.message?.includes("Too Many") || error?.message?.includes("fetch")) {
        if (i < retries - 1) {
          await new Promise((r) => setTimeout(r, 500 * (i + 1)))
          continue
        }
      }
      throw error
    }
  }
  throw new Error("Max retries exceeded")
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createAdminClient()
    const { id } = params

    console.log("[v0] Fetching candidate details for ID:", id)

    const { data: candidate, error: candidateError } = await withRetry(() =>
      supabase.from("candidates").select("*").eq("id", id).is("deleted_at", null).maybeSingle(),
    )

    if (candidateError) {
      console.error("[v0] Error fetching candidate:", candidateError)
      if (candidateError.message?.includes("Too Many")) {
        return NextResponse.json({ error: "Rate limited", retryable: true }, { status: 429 })
      }
      return NextResponse.json({ error: candidateError.message }, { status: 500 })
    }

    if (!candidate) {
      console.log("[v0] Candidate not found for ID:", id)
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 })
    }

    console.log("[v0] Found candidate:", candidate.first_name, candidate.last_name || candidate.id)

    // Fetch applications for this candidate
    const { data: applications, error: applicationsError } = await withRetry(() =>
      supabase
        .from("applications")
        .select(`
          *,
          job_postings:job_posting_id (
            id,
            title,
            department,
            employment_type
          )
        `)
        .eq("candidate_id", id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    )

    if (applicationsError) {
      console.error("[v0] Error fetching applications:", applicationsError)
    }

    console.log("[v0] Found applications:", applications?.length || 0)

    // Interviews functionality can be added later when the interviews table is created

    return NextResponse.json({
      candidate,
      applications: applications || [],
      interviews: [], // Return empty array for now - interviews table doesn't exist
    })
  } catch (error: any) {
    console.error("[v0] Error in candidate details API:", error)
    if (error?.message?.includes("Too Many") || error?.message?.includes("fetch")) {
      return NextResponse.json({ error: "Rate limited", retryable: true }, { status: 429 })
    }
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
