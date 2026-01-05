export const dynamic = "force-dynamic"

import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()
    const { searchParams } = new URL(request.url)
    const practiceId = searchParams.get("practiceId")

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const [jobPostingsResult, candidatesResult, archivedResult, questionnairesResult, interviewTemplatesResult] =
      await Promise.all([
        supabase.from("job_postings").select("*", { count: "exact", head: true }).eq("practice_id", practiceId),
        supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("practice_id", practiceId)
          .neq("status", "archived"),
        supabase
          .from("candidates")
          .select("*", { count: "exact", head: true })
          .eq("practice_id", practiceId)
          .eq("status", "archived"),
        supabase.from("questionnaires").select("*", { count: "exact", head: true }).eq("practice_id", practiceId),
        supabase.from("interview_templates").select("*", { count: "exact", head: true }).eq("practice_id", practiceId),
      ])

    // Check for errors
    if (
      jobPostingsResult.error ||
      candidatesResult.error ||
      archivedResult.error ||
      questionnairesResult.error ||
      interviewTemplatesResult.error
    ) {
      console.error("[v0] Error fetching counts:", {
        jobPostingsError: jobPostingsResult.error,
        candidatesError: candidatesResult.error,
        archivedError: archivedResult.error,
        questionnairesError: questionnairesResult.error,
        interviewTemplatesError: interviewTemplatesResult.error,
      })
      // Return zeros if tables don't exist yet
      return NextResponse.json({
        jobPostings: 0,
        candidates: 0,
        pipeline: 0,
        archived: 0,
        questionnaires: 0,
        interviews: 0,
      })
    }

    return NextResponse.json({
      jobPostings: jobPostingsResult.count || 0,
      candidates: candidatesResult.count || 0,
      pipeline: candidatesResult.count || 0,
      archived: archivedResult.count || 0,
      questionnaires: questionnairesResult.count || 0,
      interviews: interviewTemplatesResult.count || 0,
    })
  } catch (error: any) {
    console.error("[v0] Error in hiring counts GET:", error)
    return NextResponse.json(
      {
        jobPostings: 0,
        candidates: 0,
        pipeline: 0,
        archived: 0,
        questionnaires: 0,
        interviews: 0,
      },
      { status: 200 },
    )
  }
}
