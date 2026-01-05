import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const adminClient = await createAdminClient()

    const { data, error } = await adminClient
      .from("wunschpatient_profiles")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/wunschpatient/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const body = await request.json().catch((parseError) => {
      console.error("[v0] Failed to parse request body for DELETE wunschpatient:", parseError)
      return {}
    })
    const { practiceId } = body

    const adminClient = await createAdminClient()

    const { data: profile, error: fetchError } = await adminClient
      .from("wunschpatient_profiles")
      .select("practice_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: "Profil nicht gefunden" }, { status: 404 })
    }

    if (practiceId && practiceId !== profile.practice_id) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Soft delete the profile
    const { error } = await adminClient
      .from("wunschpatient_profiles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error deleting wunschpatient profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/wunschpatient/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
