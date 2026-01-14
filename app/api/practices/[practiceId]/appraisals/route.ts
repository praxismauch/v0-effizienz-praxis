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

    const { data: appraisals, error } = await supabase
      .from("employee_appraisals")
      .select(`
        *,
        employee:team_members!employee_id(id, first_name, last_name, email, role, avatar_url),
        appraiser:team_members!appraiser_id(id, first_name, last_name, email, role, avatar_url)
      `)
      .eq("practice_id", practiceId) // practice_id is TEXT, not Integer
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
      practice_id: practiceId,
      employee_id: body.employee_id,
      appraiser_id: body.appraiser_id || userData.user.id,
      appraisal_type: body.appraisal_type || "annual",
      appraisal_date: body.appraisal_date || new Date().toISOString().split("T")[0],
      scheduled_date: body.scheduled_date,
      status: body.status || "scheduled",
      overall_rating: body.overall_rating,
      performance_rating: body.performance_rating,
      potential_rating: body.potential_rating,
      strengths: body.strengths,
      areas_for_improvement: body.areas_for_improvement,
      goals_set: body.goals_set,
      development_plan: body.development_plan,
      employee_comments: body.employee_comments,
      manager_comments: body.manager_comments,
      notes: body.notes,
      attachments: body.attachments,
    }

    const { data, error } = await supabase
      .from("employee_appraisals")
      .insert(appraisalData)
      .select(`
        *,
        employee:team_members!employee_id(id, first_name, last_name, email, role, avatar_url),
        appraiser:team_members!appraiser_id(id, first_name, last_name, email, role, avatar_url)
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
