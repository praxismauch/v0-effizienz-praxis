import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { practiceId, deviceId } = await params
    if (!practiceId || !deviceId) {
      return NextResponse.json({ error: "Practice ID and Device ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()
    const { data: device, error } = await adminClient
      .from("medical_devices")
      .select("*")
      .eq("id", deviceId)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: deviceRooms } = await adminClient
      .from("device_rooms")
      .select("room_id, rooms(id, name, beschreibung)")
      .eq("device_id", deviceId)

    const rooms = deviceRooms?.map((dr) => dr.rooms).filter(Boolean) || []
    const room_ids = deviceRooms?.map((dr) => dr.room_id) || []

    return NextResponse.json({ device: { ...device, rooms, room_ids } })
  } catch (error) {
    console.error("[v0] Error in GET /devices/[deviceId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { practiceId, deviceId } = await params
    if (!practiceId || !deviceId) {
      return NextResponse.json({ error: "Practice ID and Device ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const adminClient = createAdminClient()

    const { room_ids, ...deviceData } = body

    // Calculate next maintenance date if interval is provided
    let nextMaintenanceDate = deviceData.next_maintenance_date
    if (deviceData.maintenance_interval_days && deviceData.last_maintenance_date) {
      const lastMaint = new Date(deviceData.last_maintenance_date)
      lastMaint.setDate(lastMaint.getDate() + deviceData.maintenance_interval_days)
      nextMaintenanceDate = lastMaint.toISOString().split("T")[0]
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only include fields that are provided
    const fields = [
      "name",
      "description",
      "category",
      "manufacturer",
      "model",
      "serial_number",
      "inventory_number",
      "purchase_date",
      "purchase_price",
      "currency",
      "supplier_name",
      "supplier_contact",
      "warranty_end_date",
      "location",
      "room",
      "responsible_user_id",
      "image_url",
      "handbook_url",
      "ce_certificate_url",
      "maintenance_interval_days",
      "last_maintenance_date",
      "maintenance_service_partner",
      "maintenance_service_contact",
      "maintenance_service_phone",
      "maintenance_service_email",
      "consumables_supplier",
      "consumables_order_url",
      "consumables_notes",
      "cleaning_instructions",
      "maintenance_instructions",
      "short_sop",
      "status",
      "is_active",
    ]

    fields.forEach((field) => {
      if (deviceData[field] !== undefined) {
        updateData[field] = deviceData[field]
      }
    })

    if (nextMaintenanceDate) {
      updateData.next_maintenance_date = nextMaintenanceDate
    }

    const { data: device, error } = await adminClient
      .from("medical_devices")
      .update(updateData)
      .eq("id", deviceId)
      .eq("practice_id", practiceId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (room_ids !== undefined) {
      // Delete existing room associations
      await adminClient.from("device_rooms").delete().eq("device_id", deviceId)

      // Insert new room associations
      if (room_ids.length > 0) {
        const roomAssociations = room_ids.map((roomId: string) => ({
          device_id: deviceId,
          room_id: roomId,
          practice_id: practiceId,
          created_by: user.id,
        }))

        await adminClient.from("device_rooms").insert(roomAssociations)
      }
    }

    // Fetch updated rooms
    const { data: deviceRooms } = await adminClient
      .from("device_rooms")
      .select("room_id, rooms(id, name, beschreibung)")
      .eq("device_id", deviceId)

    const rooms = deviceRooms?.map((dr) => dr.rooms).filter(Boolean) || []
    const updatedRoomIds = deviceRooms?.map((dr) => dr.room_id) || []

    return NextResponse.json({ device: { ...device, rooms, room_ids: updatedRoomIds } })
  } catch (error) {
    console.error("[v0] Error in PATCH /devices/[deviceId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; deviceId: string }> },
) {
  try {
    const { practiceId, deviceId } = await params
    if (!practiceId || !deviceId) {
      return NextResponse.json({ error: "Practice ID and Device ID required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    await adminClient.from("device_rooms").delete().eq("device_id", deviceId)

    const { error } = await adminClient
      .from("medical_devices")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", deviceId)
      .eq("practice_id", practiceId)

    if (error) {
      console.error("[v0] Error deleting device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /devices/[deviceId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
