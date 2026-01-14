import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET single arbeitsplatz
export async function GET(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

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
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("Error fetching arbeitsplatz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Arbeitsplatz nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in arbeitsplatz GET:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT update arbeitsplatz
export async function PUT(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params
    const body = await request.json()

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.beschreibung !== undefined) updateData.beschreibung = body.beschreibung
    if (body.raum_id !== undefined) updateData.raum_id = body.raum_id
    if (body.image_url !== undefined) updateData.image_url = body.image_url
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await adminClient
      .from("arbeitsplaetze")
      .update(updateData)
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("Error updating arbeitsplatz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Arbeitsplatz nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error in arbeitsplatz PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE arbeitsplatz (soft delete per PROJECT_RULES)
export async function DELETE(request: Request, { params }: { params: Promise<{ practiceId: string; id: string }> }) {
  try {
    const { practiceId, id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Soft delete per PROJECT_RULES - never hard delete user data
    const { data, error } = await adminClient
      .from("arbeitsplaetze")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", id)
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("Error deleting arbeitsplatz:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Arbeitsplatz nicht gefunden" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Arbeitsplatz gelöscht" })
  } catch (error: any) {
    console.error("Error in arbeitsplatz DELETE:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
