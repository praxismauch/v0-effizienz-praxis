import { createAdminClient } from "@/lib/supabase/admin"
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    let userId: string | null = user?.id || null

    // Fallback to session if getUser fails
    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      userId = session?.user?.id || null
    }

    if (!userId) {
      return NextResponse.json({ error: "Nicht authentifiziert. Bitte melden Sie sich erneut an." }, { status: 401 })
    }

    const body = await request.json()
    const { name, beschreibung, practice_id } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 })
    }

    if (!practice_id) {
      return NextResponse.json({ error: "Praxis-ID ist erforderlich" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("rooms")
      .insert({
        name: name.trim(),
        beschreibung: beschreibung?.trim() || null,
        practice_id,
        created_by: userId,
      })
      .select()
      .single()

    if (error) {
      console.error("Supabase error creating room:", error)
      return NextResponse.json({ error: error.message || "Raum konnte nicht erstellt werden" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Ein unerwarteter Fehler ist aufgetreten" }, { status: 500 })
  }
}
