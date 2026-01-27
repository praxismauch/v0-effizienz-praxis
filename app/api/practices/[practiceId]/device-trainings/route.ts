import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()

    // Get all trainings for the practice
    const { data: trainings, error } = await adminClient
      .from("device_trainings")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("training_date", { ascending: false })

    if (error) {
      console.error("Error fetching trainings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trainings: trainings || [] })
  } catch (error) {
    console.error("Error in device-trainings GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const adminClient = await createAdminClient()

    // Bulk create trainings
    if (Array.isArray(body.trainings)) {
      const trainingsToInsert = body.trainings.map((t: any) => ({
        practice_id: practiceId,
        device_id: t.device_id,
        team_member_id: t.team_member_id,
        team_member_name: t.team_member_name,
        training_date: t.training_date,
        trainer_name: t.trainer_name,
        trainer_role: t.trainer_role || "internal",
        training_type: t.training_type || "initial",
        valid_until: t.valid_until,
        notes: t.notes,
        is_valid: true,
        created_by: user.id,
      }))

      const { data: trainings, error } = await adminClient.from("device_trainings").insert(trainingsToInsert).select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ trainings })
    }

    // Single training create
    const { data: training, error } = await adminClient
      .from("device_trainings")
      .insert({
        practice_id: practiceId,
        device_id: body.device_id,
        team_member_id: body.team_member_id,
        team_member_name: body.team_member_name,
        training_date: body.training_date,
        trainer_name: body.trainer_name,
        trainer_role: body.trainer_role || "internal",
        training_type: body.training_type || "initial",
        valid_until: body.valid_until,
        notes: body.notes,
        is_valid: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ training })
  } catch (error) {
    console.error("Error in device-trainings POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
