import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

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
      appraiser_id: userData.user.id,
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
        achievements: body.achievements || null,
        challenges: body.challenges || null,
        career_aspirations: body.career_aspirations || null,
        promotion_readiness: body.promotion_readiness || null,
        salary_recommendation: body.salary_recommendation || null,
      },
      attachments: body.attachments || [],
      created_by: userData.user.id,
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
