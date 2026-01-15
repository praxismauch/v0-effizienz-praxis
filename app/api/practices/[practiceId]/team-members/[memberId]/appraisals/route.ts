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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Missing practiceId or memberId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("employee_appraisals")
      .select(`
        *,
        employee:team_members!fk_employee_appraisals_employee(id, first_name, last_name, email, role),
        appraiser:team_members!fk_employee_appraisals_appraiser(id, first_name, last_name, email, role)
      `)
      .eq("practice_id", practiceId)
      .eq("employee_id", memberId)
      .is("deleted_at", null)
      .order("appraisal_date", { ascending: false })

    if (error) {
      console.error("Error fetching appraisals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedData = (data || []).map(transformAppraisalResponse)

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error("Error in GET appraisals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Missing practiceId or memberId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const appraisalData = {
      practice_id: practiceId,
      employee_id: memberId,
      appraiser_id: body.appraiser_id || null,
      appraisal_type: body.appraisal_type || "annual",
      appraisal_date: body.appraisal_date || new Date().toISOString().split("T")[0],
      scheduled_date: body.scheduled_date || null,
      status: body.status || "scheduled",
      overall_rating: body.overall_rating || null,
      performance_rating: body.performance_rating || null,
      potential_rating: body.potential_rating || null,
      strengths: body.strengths || null,
      areas_for_improvement: body.areas_for_improvement || null,
      goals_set: body.goals_set || body.new_goals?.map((g: any) => g.title || g).join(", ") || null,
      development_plan: body.development_plan || null,
      employee_comments: body.employee_comments || null,
      manager_comments: body.manager_comments || body.manager_summary || null,
      notes: {
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
      },
      attachments: body.attachments || [],
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const body = await request.json()

    if (!practiceId || !memberId || !body.id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, employee, appraiser, ...restBody } = body

    const notes = {
      performance_areas: restBody.performance_areas || [],
      competencies: restBody.competencies || [],
      goals_review: restBody.goals_review || [],
      new_goals: restBody.new_goals || [],
      follow_up_actions: restBody.follow_up_actions || [],
      achievements: restBody.achievements || restBody.key_achievements || null,
      challenges: restBody.challenges || null,
      career_aspirations: restBody.career_aspirations || null,
      promotion_readiness: restBody.promotion_readiness || null,
      salary_recommendation: restBody.salary_recommendation || null,
      period_start: restBody.period_start || null,
      period_end: restBody.period_end || null,
      employee_self_assessment: restBody.employee_self_assessment || null,
      summary: restBody.summary || null,
      next_review_date: restBody.next_review_date || null,
    }

    const updateData = {
      appraisal_type: restBody.appraisal_type,
      appraisal_date: restBody.appraisal_date,
      scheduled_date: restBody.scheduled_date || null,
      status: restBody.status,
      overall_rating: restBody.overall_rating || null,
      performance_rating: restBody.performance_rating || null,
      potential_rating: restBody.potential_rating || null,
      strengths: restBody.strengths || null,
      areas_for_improvement: restBody.areas_for_improvement || null,
      goals_set: restBody.goals_set || restBody.new_goals?.map((g: any) => g.title || g).join(", ") || null,
      development_plan: restBody.development_plan || null,
      employee_comments: restBody.employee_comments || null,
      manager_comments: restBody.manager_comments || restBody.manager_summary || null,
      notes,
      attachments: restBody.attachments || [],
      updated_at: new Date().toISOString(),
      updated_by: userData.user.id,
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .eq("employee_id", memberId)
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

    return NextResponse.json(transformAppraisalResponse(data))
  } catch (error) {
    console.error("Error in PUT appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; memberId: string }> },
) {
  try {
    const { practiceId, memberId } = await params
    const { searchParams } = new URL(request.url)
    const appraisalId = searchParams.get("id")

    if (!practiceId || !memberId || !appraisalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from("employee_appraisals")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", appraisalId)
      .eq("practice_id", practiceId)
      .eq("employee_id", memberId)

    if (error) {
      console.error("Error deleting appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
