import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export async function GET(request: NextRequest, { params }: { params: { practiceId: string; moduleId: string } }) {
  try {
    const { practiceId, moduleId } = params
    const practiceIdInt = practiceId === "0" || !practiceId ? 1 : Number.parseInt(practiceId) || 1

    console.log("[v0] GET /api/practices/[practiceId]/academy/modules/[moduleId] - moduleId:", moduleId)

    const { data, error } = await supabase
      .from("academy_modules")
      .select("*")
      .eq("id", moduleId)
      .is("deleted_at", null)
      .single()

    if (error) {
      console.error("[v0] Error fetching module:", error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.log("[v0] Fetched module:", data.id)

    return NextResponse.json({ module: data })
  } catch (error: any) {
    console.error("[v0] Unexpected error in GET module:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { practiceId: string; moduleId: string } }) {
  try {
    const { practiceId, moduleId } = params
    const practiceIdInt = practiceId === "0" || !practiceId ? 1 : Number.parseInt(practiceId) || 1

    console.log("[v0] PUT /api/practices/[practiceId]/academy/modules/[moduleId] - moduleId:", moduleId)

    const body = await request.json()
    console.log("[v0] Update data:", body)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.display_order !== undefined) {
      updateData.display_order = body.display_order
      updateData.order_index = body.display_order
    }
    if (body.is_published !== undefined) updateData.is_published = body.is_published
    if (body.estimated_minutes !== undefined) {
      updateData.estimated_minutes = body.estimated_minutes
      updateData.duration_minutes = body.estimated_minutes
    }
    if (body.xp_reward !== undefined) updateData.xp_reward = body.xp_reward

    const { data, error } = await supabase
      .from("academy_modules")
      .update(updateData)
      .eq("id", moduleId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating module:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Module updated successfully:", data.id)

    return NextResponse.json({ module: data })
  } catch (error: any) {
    console.error("[v0] Unexpected error in PUT module:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { practiceId: string; moduleId: string } }) {
  try {
    const { practiceId, moduleId } = params
    const practiceIdInt = practiceId === "0" || !practiceId ? 1 : Number.parseInt(practiceId) || 1

    console.log("[v0] DELETE /api/practices/[practiceId]/academy/modules/[moduleId] - moduleId:", moduleId)

    const { data, error } = await supabase
      .from("academy_modules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", moduleId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error deleting module:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Module deleted successfully:", moduleId)

    return NextResponse.json({ success: true, module: data })
  } catch (error: any) {
    console.error("[v0] Unexpected error in DELETE module:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
