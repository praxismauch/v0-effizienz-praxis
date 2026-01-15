import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

// GET a single appraisal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; appraisalId: string }> },
) {
  try {
    const { practiceId, appraisalId } = await params

    if (!practiceId || !appraisalId) {
      return NextResponse.json({ error: "Missing practiceId or appraisalId" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("employee_appraisals")
      .select(`
        *,
        employee:team_members!employee_id(id, first_name, last_name, email, role, avatar_url),
        appraiser:team_members!appraiser_id(id, first_name, last_name, email, role, avatar_url)
      `)
      .eq("id", appraisalId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Gespräch nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT update an appraisal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; appraisalId: string }> },
) {
  try {
    const { practiceId, appraisalId } = await params
    const body = await request.json()

    if (!practiceId || !appraisalId) {
      return NextResponse.json({ error: "Missing practiceId or appraisalId" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const allowedFields = [
      "appraisal_type",
      "appraisal_date",
      "scheduled_date",
      "status",
      "overall_rating",
      "performance_rating",
      "potential_rating",
      "strengths",
      "areas_for_improvement",
      "goals_set",
      "development_plan",
      "employee_comments",
      "manager_comments",
      "notes",
      "attachments",
      "appraiser_id",
      // Additional fields from POST route
      "period_start",
      "period_end",
      "performance_areas",
      "competencies",
      "goals_review",
      "new_goals",
      "achievements",
      "challenges",
      "employee_self_rating",
      "employee_goals",
      "employee_development_wishes",
      "manager_summary",
      "manager_recommendations",
      "career_aspirations",
      "promotion_readiness",
      "succession_potential",
      "salary_review_notes",
      "salary_recommendation",
      "bonus_recommendation",
      "next_review_date",
      "follow_up_actions",
      "summary",
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .update(updateData)
      .eq("id", appraisalId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select(`
        *,
        employee:team_members!employee_id(id, first_name, last_name, email, role, avatar_url),
        appraiser:team_members!appraiser_id(id, first_name, last_name, email, role, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Error updating appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Gespräch nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE an appraisal (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; appraisalId: string }> },
) {
  try {
    const { practiceId, appraisalId } = await params

    if (!practiceId || !appraisalId) {
      return NextResponse.json({ error: "Missing practiceId or appraisalId" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Soft delete per PROJECT_RULES
    const { error } = await supabase
      .from("employee_appraisals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", appraisalId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)

    if (error) {
      console.error("Error deleting appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Gespräch gelöscht" })
  } catch (error) {
    console.error("Error in DELETE appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
