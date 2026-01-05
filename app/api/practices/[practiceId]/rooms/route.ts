import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: rooms, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("practice_id", practiceId)
      .order("name", { ascending: true })

    if (error) {
      const errorMsg = error.message || String(error)
      if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit")) {
        return NextResponse.json([])
      }
      console.error("Error fetching rooms:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(rooms || [])
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit")) {
      return NextResponse.json([])
    }
    console.error("Error in rooms GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const body = await request.json()
    const { name, beschreibung } = body

    if (!practiceId) {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        name: name.trim(),
        beschreibung: beschreibung?.trim() || null,
        practice_id: practiceId,
      })
      .select()
      .single()

    if (error) {
      const errorMsg = error.message || String(error)
      if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit")) {
        return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
      }
      console.error("Error creating room:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    if (errorMsg.includes("Too Many") || errorMsg.includes("rate limit")) {
      return NextResponse.json({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }, { status: 429 })
    }
    console.error("Error in rooms POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
