import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Get devices with maintenance due in the next 90 days
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 90)

    const { data: devices, error } = await adminClient
      .from("medical_devices")
      .select("id, name, next_maintenance_date, maintenance_service_partner")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("next_maintenance_date", "is", null)
      .lte("next_maintenance_date", futureDate.toISOString().split("T")[0])
      .order("next_maintenance_date", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to calendar events format
    const maintenanceEvents = (devices || []).map((device) => ({
      id: `maintenance-${device.id}`,
      title: `Wartung: ${device.name}`,
      description: device.maintenance_service_partner
        ? `Servicepartner: ${device.maintenance_service_partner}`
        : "Planmäßige Wartung fällig",
      startDate: device.next_maintenance_date,
      endDate: device.next_maintenance_date,
      startTime: "09:00",
      endTime: "10:00",
      type: "maintenance",
      priority: "high",
      isAllDay: false,
      deviceId: device.id,
    }))

    return NextResponse.json({ events: maintenanceEvents })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
