import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

function transformAppraisalResponse(appraisal: any) {
  const notes = appraisal.notes || {}
  return {
    ...appraisal,
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
    period_start: notes.period_start || null,
    period_end: notes.period_end || null,
    employee_self_assessment: notes.employee_self_assessment || null,
    summary: notes.summary || null,
    next_review_date: notes.next_review_date || appraisal.next_review_date || null,
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

// GET all appraisals for a practice (with team member info)
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Missing practiceId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: appraisals, error } = await supabase
      .from("employee_appraisals")
      .select(`
        *,
        employee:team_members!fk_employee_appraisals_employee(id, first_name, last_name, email, role),
        appraiser:team_members!fk_employee_appraisals_appraiser(id, first_name, last_name, email, role)
      `)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("appraisal_date", { ascending: false })

    if (error) {
      console.error("Error fetching practice appraisals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedAppraisals = (appraisals || []).map(transformAppraisalResponse)

    return NextResponse.json(transformedAppraisals)
  } catch (error) {
    console.error("Error in GET practice appraisals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST create a new appraisal
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    if (!practiceId || !body.employee_id) {
      return NextResponse.json({ error: "Missing practiceId or employee_id" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notes = {
      performance_areas: body.performance_areas || [],
      competencies: body.competencies || [],
      goals_review: body.goals_review || [],
      new_goals: body.new_goals || [],
      follow_up_actions: body.follow_up_actions || [],
      achievements: body.achievements || body.key_achievements || null,
      challenges: body.challenges || null,
      career_aspirations: body.career_aspirations || null,
      promotion_readiness: body.promotion_readiness || null,
      salary_recommendation: body.salary_recommendation || null,
      period_start: body.period_start || null,
      period_end: body.period_end || null,
      employee_self_assessment: body.employee_self_assessment || null,
      summary: body.summary || null,
      next_review_date: body.next_review_date || null,
    }

    const appraisalData = {
      practice_id: practiceId,
      employee_id: body.employee_id,
      appraiser_id: body.appraiser_id || null,
      appraisal_type: body.appraisal_type || "annual",
      appraisal_date: body.appraisal_date || new Date().toISOString().split("T")[0],
      scheduled_date: body.scheduled_date,
      status: body.status || "scheduled",
      overall_rating: body.overall_rating != null ? Math.round(body.overall_rating) : null,
      performance_rating: body.performance_rating != null ? Math.round(body.performance_rating) : null,
      potential_rating: body.potential_rating != null ? Math.round(body.potential_rating) : null,
      strengths: body.strengths,
      areas_for_improvement: body.areas_for_improvement,
      goals_set: body.goals_set || body.new_goals?.map((g: any) => g.title || g).join(", ") || null,
      development_plan: body.development_plan,
      employee_comments: body.employee_comments,
      manager_comments: body.manager_comments || body.manager_summary || null,
      notes,
      attachments: body.attachments,
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .insert(appraisalData)
      .select(`
        *,
        employee:team_members!fk_employee_appraisals_employee(id, first_name, last_name, email, role),
        appraiser:team_members!fk_employee_appraisals_appraiser(id, first_name, last_name, email, role)
      `)
      .single()

    if (error) {
      console.error("Error creating appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(transformAppraisalResponse(data))
  } catch (error) {
    console.error("Error in POST appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
