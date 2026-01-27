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
    const { data: reports, error } = await adminClient
      .from("device_maintenance_reports")
      .select("*")
      .eq("device_id", deviceId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("maintenance_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reports: reports || [] })
  } catch (error) {
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

    // Create maintenance report
    const { data: report, error } = await adminClient
      .from("device_maintenance_reports")
      .insert({
        practice_id: practiceId,
        device_id: deviceId,
        maintenance_type: body.maintenance_type,
        maintenance_date: body.maintenance_date,
        performed_by: body.performed_by,
        performed_by_company: body.performed_by_company,
        title: body.title,
        description: body.description,
        findings: body.findings,
        actions_taken: body.actions_taken,
        parts_replaced: body.parts_replaced,
        cost: body.cost,
        currency: body.currency || "EUR",
        invoice_number: body.invoice_number,
        invoice_url: body.invoice_url,
        next_maintenance_date: body.next_maintenance_date,
        next_maintenance_notes: body.next_maintenance_notes,
        status: body.status || "completed",
        report_url: body.report_url,
        photos: body.photos || [],
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update device's maintenance dates
    if (body.maintenance_date) {
      await adminClient
        .from("medical_devices")
        .update({
          last_maintenance_date: body.maintenance_date,
          next_maintenance_date: body.next_maintenance_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", deviceId)
    }

    return NextResponse.json({ report })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
