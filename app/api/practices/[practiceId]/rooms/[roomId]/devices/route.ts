import { type NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, handleApiError } from "@/lib/api-helpers"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; roomId: string }> }
) {
  try {
    const { practiceId, roomId } = await params
    if (!practiceId || !roomId) {
      return NextResponse.json({ error: "Practice ID and Room ID required" }, { status: 400 })
    }

    const { adminClient } = await requirePracticeAccess(practiceId)

    // Get device IDs from the junction table for this room
    const { data: deviceRooms, error: junctionError } = await adminClient
      .from("device_rooms")
      .select("device_id")
      .eq("room_id", roomId)

    if (junctionError) {
      console.error("[v0] Error fetching device_rooms:", junctionError)
      return NextResponse.json({ error: junctionError.message }, { status: 500 })
    }

    if (!deviceRooms || deviceRooms.length === 0) {
      return NextResponse.json({ devices: [] })
    }

    const deviceIds = deviceRooms.map((dr) => dr.device_id)

    // Fetch the actual devices
    const { data: devices, error: devicesError } = await adminClient
      .from("medical_devices")
      .select("id, name, category, manufacturer, model, status, image_url")
      .in("id", deviceIds)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("name", { ascending: true })

    if (devicesError) {
      console.error("[v0] Error fetching devices:", devicesError)
      return NextResponse.json({ error: devicesError.message }, { status: 500 })
    }

    return NextResponse.json({ devices: devices || [] })
  } catch (error) {
    return handleApiError(error)
  }
}
