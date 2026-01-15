import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

function transformAppraisalResponse(appraisal: any) {
  // Spread notes JSONB fields to top level for UI compatibility
  const notes = appraisal.notes || {}
  return {
    ...appraisal,
    // Spread notes fields to top level
    performance_areas: notes.performance_areas || [],
    competencies: notes.competencies || [],
    goals_review: notes.goals_review || [],
    new_goals: notes.new_goals || [],
    follow_up_actions: notes.follow_up_actions || [],
    achievements: notes.achievements || null,
    challenges: notes.challenges || null,
    career_aspirations: notes.career_aspirations || null,
    promotion_readiness: notes.promotion_readiness || null,
    salary_recommendation: notes.salary_recommendation || null,
    // Transform employee/appraiser to include computed name
    employee: appraisal.employee
      ? {
          ...appraisal.employee,
          name: `${appraisal.employee.first_name || ""} ${appraisal.employee.last_name || ""}`.trim() || "Unbekannt",
        }
      : null,
    appraiser: appraisal.appraiser
      ? {
          ...appraisal.appraiser,
          name: `${appraisal.appraiser.first_name || ""} ${appraisal.appraiser.last_name || ""}`.trim() || "Unbekannt",
        }
      : null,
  }
}

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
        employee:team_members!fk_employee_appraisals_employee(id, first_name, last_name, email, role),
        appraiser:team_members!fk_employee_appraisals_appraiser(id, first_name, last_name, email, role)
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

    return NextResponse.json(transformAppraisalResponse(data))
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

    const allowedDbFields = [
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
      "attachments",
      "appraiser_id",
    ]

    for (const field of allowedDbFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (body.overall_rating !== undefined) {
      updateData.overall_rating = body.overall_rating != null ? Math.round(body.overall_rating) : null
    }
    if (body.performance_rating !== undefined) {
      updateData.performance_rating = body.performance_rating != null ? Math.round(body.performance_rating) : null
    }
    if (body.potential_rating !== undefined) {
      updateData.potential_rating = body.potential_rating != null ? Math.round(body.potential_rating) : null
    }

    const notesFields = [
      "performance_areas",
      "competencies",
      "goals_review",
      "new_goals",
      "follow_up_actions",
      "achievements",
      "challenges",
      "career_aspirations",
      "promotion_readiness",
      "salary_recommendation",
      "period_start",
      "period_end",
      "employee_self_rating",
      "employee_goals",
      "employee_development_wishes",
      "manager_summary",
      "manager_recommendations",
      "succession_potential",
      "salary_review_notes",
      "bonus_recommendation",
      "next_review_date",
      "summary",
    ]

    // Build notes object from body
    const existingNotes = body.notes || {}
    const newNotes: Record<string, unknown> = { ...existingNotes }

    for (const field of notesFields) {
      if (body[field] !== undefined) {
        newNotes[field] = body[field]
      }
    }

    // Only update notes if we have content
    if (Object.keys(newNotes).length > 0) {
      updateData.notes = newNotes
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .update(updateData)
      .eq("id", appraisalId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select(`
        *,
        employee:team_members!fk_employee_appraisals_employee(id, first_name, last_name, email, role),
        appraiser:team_members!fk_employee_appraisals_appraiser(id, first_name, last_name, email, role)
      `)
      .single()

    if (error) {
      console.error("Error updating appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Gespräch nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(transformAppraisalResponse(data))
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
