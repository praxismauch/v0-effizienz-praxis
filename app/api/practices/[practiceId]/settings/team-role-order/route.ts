import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { DEFAULT_ROLE_ORDER } from "@/lib/team-role-order"

export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: settings, error } = await supabase
      .from("practice_settings")
      .select("system_settings")
      .eq("practice_id", practiceId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching role order:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const roleOrder = settings?.system_settings?.team_member_role_order || DEFAULT_ROLE_ORDER

    return NextResponse.json({
      roleOrder,
      isCustom: !!settings?.system_settings?.team_member_role_order,
      defaultOrder: DEFAULT_ROLE_ORDER,
    })
  } catch (error) {
    console.error("[v0] Exception in team role order GET:", error)
    return NextResponse.json({ error: "Failed to fetch role order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { roleOrder } = body

    if (!Array.isArray(roleOrder)) {
      return NextResponse.json({ error: "roleOrder must be an array" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get existing settings
    const { data: existingSettings } = await supabase
      .from("practice_settings")
      .select("id, system_settings")
      .eq("practice_id", practiceId)
      .single()

    const updatedSystemSettings = {
      ...(existingSettings?.system_settings || {}),
      team_member_role_order: roleOrder,
    }

    if (existingSettings?.id) {
      // Update existing settings
      const { error: updateError } = await supabase
        .from("practice_settings")
        .update({
          system_settings: updatedSystemSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSettings.id)

      if (updateError) {
        console.error("[v0] Error updating role order:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // Create new settings
      const { error: insertError } = await supabase.from("practice_settings").insert({
        practice_id: practiceId,
        system_settings: updatedSystemSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("[v0] Error creating role order settings:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      roleOrder,
      message: "Rollen-Reihenfolge erfolgreich gespeichert",
    })
  } catch (error) {
    console.error("[v0] Exception in team role order PUT:", error)
    return NextResponse.json({ error: "Failed to update role order" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params

    if (!practiceId || practiceId === "undefined") {
      return NextResponse.json({ error: "Practice ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get existing settings
    const { data: existingSettings } = await supabase
      .from("practice_settings")
      .select("id, system_settings")
      .eq("practice_id", practiceId)
      .single()

    if (existingSettings?.id) {
      const updatedSystemSettings = { ...(existingSettings.system_settings || {}) }
      delete updatedSystemSettings.team_member_role_order

      const { error: updateError } = await supabase
        .from("practice_settings")
        .update({
          system_settings: updatedSystemSettings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSettings.id)

      if (updateError) {
        console.error("[v0] Error resetting role order:", updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      roleOrder: DEFAULT_ROLE_ORDER,
      message: "Rollen-Reihenfolge auf Standard zurückgesetzt",
    })
  } catch (error) {
    console.error("[v0] Exception in team role order DELETE:", error)
    return NextResponse.json({ error: "Failed to reset role order" }, { status: 500 })
  }
}
