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
      .order("training_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ trainings: trainings || [] })
  } catch (error: any) {
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

    const insertData = {
      device_id: deviceId,
      team_member_id: body.team_member_id,
      team_member_name: body.team_member_name || null,
      training_date: body.training_date,
      trainer: body.trainer_name || body.trainer || null,
      zertifikat_vorhanden: body.zertifikat_vorhanden || false,
      ablaufdatum: body.valid_until || body.ablaufdatum || null,
      notizen: body.notes || body.notizen || null,
    }

    const { data: training, error } = await adminClient
      .from("device_trainings")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ training })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { deviceId } = await params
    const { searchParams } = new URL(request.url)
    const trainingId = searchParams.get("trainingId")

    if (!trainingId) {
      return NextResponse.json({ error: "trainingId is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from("device_trainings")
      .delete()
      .eq("id", trainingId)
      .eq("device_id", deviceId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { deviceId } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const adminClient = await createAdminClient()

    const updateData: any = {}
    if (body.training_date) updateData.training_date = body.training_date
    if (body.trainer_name !== undefined) updateData.trainer = body.trainer_name
    if (body.training_type) updateData.training_type = body.training_type
    if (body.valid_until !== undefined) updateData.ablaufdatum = body.valid_until || null
    if (body.notes !== undefined) updateData.notizen = body.notes || null

    const { data: training, error } = await adminClient
      .from("device_trainings")
      .update(updateData)
      .eq("id", body.id)
      .eq("device_id", deviceId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ training })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
