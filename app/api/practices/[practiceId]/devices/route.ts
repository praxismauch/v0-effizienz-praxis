import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { adminClient, user } = await requirePracticeAccess(practiceId)
    
    const { data: devices, error } = await adminClient
      .from("medical_devices")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching devices:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const deviceIds = devices?.map((d) => d.id) || []
    let deviceRooms: any[] = []
    if (deviceIds.length > 0) {
      const { data: roomData } = await adminClient
        .from("device_rooms")
        .select("device_id, room_id, rooms(id, name, beschreibung)")
        .in("device_id", deviceIds)

      deviceRooms = roomData || []
    }

    // Map rooms to devices
    const devicesWithRooms = devices?.map((device) => {
      const rooms = deviceRooms
        .filter((dr) => dr.device_id === device.id)
        .map((dr) => dr.rooms)
        .filter(Boolean)
      const room_ids = deviceRooms.filter((dr) => dr.device_id === device.id).map((dr) => dr.room_id)
      return { ...device, rooms, room_ids }
    })

    return NextResponse.json({ devices: devicesWithRooms || [] })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID required" }, { status: 400 })
    }

    const { user, adminClient } = await requirePracticeAccess(practiceId)
    const userId = user.id

    const body = await request.json()

    // Calculate next maintenance date if interval is provided
    let nextMaintenanceDate = body.next_maintenance_date
    if (body.maintenance_interval_days && body.last_maintenance_date) {
      const lastMaint = new Date(body.last_maintenance_date)
      lastMaint.setDate(lastMaint.getDate() + body.maintenance_interval_days)
      nextMaintenanceDate = lastMaint.toISOString().split("T")[0]
    } else if (body.maintenance_interval_days && !body.last_maintenance_date) {
      const today = new Date()
      today.setDate(today.getDate() + body.maintenance_interval_days)
      nextMaintenanceDate = today.toISOString().split("T")[0]
    }

    const { room_ids, ...deviceData } = body

    const responsibleUserId = deviceData.responsible_user_id === "" ? null : deviceData.responsible_user_id

    const { data: device, error } = await adminClient
      .from("medical_devices")
      .insert({
        practice_id: practiceId,
        name: deviceData.name,
        description: deviceData.description,
        category: deviceData.category,
        manufacturer: deviceData.manufacturer,
        model: deviceData.model,
        serial_number: deviceData.serial_number,
        inventory_number: deviceData.inventory_number,
        purchase_date: deviceData.purchase_date,
        purchase_price: deviceData.purchase_price,
        currency: deviceData.currency || "EUR",
        supplier_name: deviceData.supplier_name,
        supplier_contact: deviceData.supplier_contact,
        warranty_end_date: deviceData.warranty_end_date,
        location: deviceData.location,
        room: deviceData.room,
        responsible_user_id: responsibleUserId,
        image_url: deviceData.image_url,
        handbook_url: deviceData.handbook_url,
        ce_certificate_url: deviceData.ce_certificate_url,
        maintenance_interval_days: deviceData.maintenance_interval_days,
        last_maintenance_date: deviceData.last_maintenance_date,
        next_maintenance_date: nextMaintenanceDate,
        maintenance_service_partner: deviceData.maintenance_service_partner,
        maintenance_service_contact: deviceData.maintenance_service_contact,
        maintenance_service_phone: deviceData.maintenance_service_phone,
        maintenance_service_email: deviceData.maintenance_service_email,
        consumables_supplier: deviceData.consumables_supplier,
        consumables_order_url: deviceData.consumables_order_url,
        consumables_notes: deviceData.consumables_notes,
        cleaning_instructions: deviceData.cleaning_instructions,
        maintenance_instructions: deviceData.maintenance_instructions,
        short_sop: deviceData.short_sop,
        software_version: deviceData.software_version || null,
        status: deviceData.status || "active",
        is_active: deviceData.is_active !== false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating device:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0 && device) {
      const roomAssociations = room_ids.map((roomId: string) => ({
        device_id: device.id,
        room_id: roomId,
        practice_id: practiceId,
        created_by: userId,
      }))

      await adminClient.from("device_rooms").insert(roomAssociations)
    }

    return NextResponse.json({ device })
  } catch (error) {
    return handleApiError(error)
  }
}
