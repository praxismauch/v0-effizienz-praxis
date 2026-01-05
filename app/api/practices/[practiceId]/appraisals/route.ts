import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// GET all appraisals for a practice (with team member info)
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Missing practiceId" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get all appraisals for the practice with employee info
    const { data: appraisals, error } = await supabase
      .from("employee_appraisals")
      .select(`
        *,
        employee:practice_users!employee_id(id, name, email, role, avatar_url),
        appraiser:practice_users!appraiser_id(id, name, email, role, avatar_url)
      `)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("appraisal_date", { ascending: false })

    if (error) {
      console.error("Error fetching practice appraisals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(appraisals || [])
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

    const appraisalData = {
      practice_id: Number.parseInt(practiceId),
      employee_id: body.employee_id,
      appraiser_id: userData.user.id,
      appraisal_type: body.appraisal_type || "annual",
      appraisal_date: body.appraisal_date || new Date().toISOString().split("T")[0],
      period_start: body.period_start,
      period_end: body.period_end,
      status: body.status || "draft",
      overall_rating: body.overall_rating,
      performance_areas: body.performance_areas || [],
      competencies: body.competencies || [],
      goals_review: body.goals_review || [],
      new_goals: body.new_goals || [],
      development_plan: body.development_plan || [],
      strengths: body.strengths,
      areas_for_improvement: body.areas_for_improvement,
      achievements: body.achievements,
      challenges: body.challenges,
      employee_self_rating: body.employee_self_rating,
      employee_comments: body.employee_comments,
      employee_goals: body.employee_goals,
      employee_development_wishes: body.employee_development_wishes,
      manager_summary: body.manager_summary,
      manager_recommendations: body.manager_recommendations,
      career_aspirations: body.career_aspirations,
      promotion_readiness: body.promotion_readiness,
      succession_potential: body.succession_potential,
      salary_review_notes: body.salary_review_notes,
      salary_recommendation: body.salary_recommendation,
      bonus_recommendation: body.bonus_recommendation,
      next_review_date: body.next_review_date,
      follow_up_actions: body.follow_up_actions || [],
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .insert(appraisalData)
      .select(`
        *,
        employee:practice_users!employee_id(id, name, email, role, avatar_url),
        appraiser:practice_users!appraiser_id(id, name, email, role, avatar_url)
      `)
      .single()

    if (error) {
      console.error("Error creating appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
