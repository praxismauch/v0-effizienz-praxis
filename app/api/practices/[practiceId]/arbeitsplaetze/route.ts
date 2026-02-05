import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] Arbeitsplaetze API - GET called with practiceId:", practiceId)

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.log("[v0] Arbeitsplaetze API - user:", user?.id)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Fetch arbeitsplaetze without the rooms join (foreign key may not exist)
    const { data: arbeitsplaetzeData, error } = await adminClient
      .from("arbeitsplaetze")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name")

    console.log("[v0] Arbeitsplaetze API - fetched count:", arbeitsplaetzeData?.length, "error:", error)

    if (error) {
      console.error("Error fetching arbeitsplaetze:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch rooms separately to enrich arbeitsplaetze data
    const roomIds = arbeitsplaetzeData
      ?.map((a) => a.raum_id)
      .filter((id): id is string => id !== null) || []

    let roomsMap: Record<string, { id: string; name: string; color: string | null }> = {}

    if (roomIds.length > 0) {
      const { data: roomsData } = await adminClient
        .from("rooms")
        .select("id, name, color")
        .in("id", roomIds)

      if (roomsData) {
        roomsMap = roomsData.reduce((acc, room) => {
          acc[room.id] = room
          return acc
        }, {} as Record<string, { id: string; name: string; color: string | null }>)
      }
    }

    // Enrich arbeitsplaetze with room data
    const data = arbeitsplaetzeData?.map((arbeitsplatz) => ({
      ...arbeitsplatz,
      room: arbeitsplatz.raum_id ? roomsMap[arbeitsplatz.raum_id] || null : null,
    })) || []

    console.log("[v0] Arbeitsplaetze API - enriched with rooms, final count:", data.length)

    return NextResponse.json({ arbeitsplaetze: data })
  } catch (error: any) {
    console.error("Error in arbeitsplaetze GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("arbeitsplaetze")
      .insert({
        name: body.name,
        beschreibung: body.beschreibung || null,
        raum_id: body.raum_id || null,
        image_url: body.image_url || null,
        color: body.color || null,
        use_room_color: body.use_room_color !== undefined ? body.use_room_color : true,
        practice_id: practiceId,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating arbeitsplatz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in arbeitsplaetze POST:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
