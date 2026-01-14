import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { practiceId: string; memberId: string } }) {
  try {
    const { practiceId, memberId } = params

    if (!practiceId || !memberId) {
      return NextResponse.json({ error: "Missing practiceId or memberId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("employee_appraisals")
      .select("*")
      .eq("practice_id", practiceId)
      .eq("employee_id", memberId)
      .is("deleted_at", null)
      .order("appraisal_date", { ascending: false })

    if (error) {
      console.error("Error fetching appraisals:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET appraisals:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { practiceId: string; memberId: string } }) {
  try {
    const { practiceId, memberId } = params
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

    const { data, error } = await supabase.from("employee_appraisals").insert(appraisalData).select().single()

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

export async function PUT(request: NextRequest, { params }: { params: { practiceId: string; memberId: string } }) {
  try {
    const { practiceId, memberId } = params
    const body = await request.json()

    if (!practiceId || !memberId || !body.id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Remove id from body for update
    const { id, ...updateData } = body

    const { data, error } = await supabase
      .from("employee_appraisals")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .eq("employee_id", memberId)
      .select()
      .single()

    if (error) {
      console.error("Error updating appraisal:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT appraisal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string; memberId: string } }) {
  try {
    const { practiceId, memberId } = params
    const { searchParams } = new URL(request.url)
    const appraisalId = searchParams.get("id")

    if (!practiceId || !memberId || !appraisalId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    // Soft delete
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
