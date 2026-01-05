import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createAdminClient()

    const { searchParams } = new URL(request?.url || "")
    const practiceId = searchParams.get("practice_id") || "1"

    const { data, error } = await supabase
      .from("wunschpatient_profiles")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching wunschpatient profiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in GET /api/wunschpatient:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAdminClient()

    const body = await request.json()

    const practiceId = body.practice_id || "1"
    const createdBy = body.created_by || body.user_id || body.userId

    if (!createdBy) {
      return NextResponse.json({ error: "created_by or user_id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("wunschpatient_profiles")
      .insert({
        ...body,
        practice_id: practiceId,
        created_by: createdBy,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating wunschpatient profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in POST /api/wunschpatient:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
