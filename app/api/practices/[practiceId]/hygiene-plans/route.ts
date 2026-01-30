import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    console.log("[v0] GET hygiene-plans for practice:", practiceId)
    const supabase = await createClient()

    const { data: hygienePlans, error } = await supabase
      .from("hygiene_plans")
      .select("*")
      .eq("practice_id", practiceId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching hygiene plans:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", hygienePlans?.length || 0, "hygiene plans")
    return NextResponse.json({ hygienePlans })
  } catch (error) {
    console.error("[v0] Error in hygiene plans GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const body = await request.json()

    const {
      title,
      description,
      category,
      frequency,
      responsible_role,
      content,
      is_rki_template,
      rki_reference_url,
      status,
      tags,
      created_by,
    } = body

    const { data: hygienePlan, error } = await supabase
      .from("hygiene_plans")
      .insert({
        practice_id: parseInt(practiceId),
        title,
        description,
        category,
        frequency,
        responsible_role,
        content,
        is_rki_template: is_rki_template || false,
        rki_reference_url,
        status: status || "active",
        tags: tags || [],
        created_by,
        updated_by: created_by,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating hygiene plan:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created hygiene plan:", hygienePlan.id)
    return NextResponse.json({ hygienePlan }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in hygiene plans POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
