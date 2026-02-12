import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { practiceId, deviceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()
    const { data: trainings, error } = await adminClient
      .from("device_trainings")
      .select("*")
      .eq("device_id", deviceId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("training_date", { ascending: false })

    if (error) {
      console.log("[v0] device training GET error:", error.message, error.code, error.details, error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trainings: trainings || [] })
  } catch (error: any) {
    console.log("[v0] device training GET catch error:", error?.message || error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { practiceId, deviceId } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const adminClient = await createAdminClient()

    const { data: training, error } = await adminClient
      .from("device_trainings")
      .insert({
        practice_id: practiceId,
        device_id: deviceId,
        team_member_id: body.team_member_id,
        team_member_name: body.team_member_name,
        training_date: body.training_date,
        trainer_name: body.trainer_name,
        trainer_role: body.trainer_role,
        training_type: body.training_type || "initial",
        certificate_url: body.certificate_url,
        signature_url: body.signature_url,
        notes: body.notes,
        valid_until: body.valid_until,
        is_valid: body.is_valid !== false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.log("[v0] device training insert error:", error.message, error.code, error.details, error.hint)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ training })
  } catch (error: any) {
    console.log("[v0] device training POST catch error:", error?.message || error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
