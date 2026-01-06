import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

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
      .select("*")
      .eq("practice_id", practiceId)
      .order("name")

    if (error) {
      console.error("Error fetching arbeitsplaetze:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
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
        practice_id: practiceId,
        created_by: user.id,
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
