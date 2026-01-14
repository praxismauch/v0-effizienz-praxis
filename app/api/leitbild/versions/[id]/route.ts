import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Version ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Check if this is the active version
    const { data: versionData, error: fetchError } = await supabase
      .from("leitbild")
      .select("is_active, practice_id")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching version:", fetchError)
      throw fetchError
    }

    if (!versionData) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    if (versionData.is_active) {
      return NextResponse.json(
        { error: "Cannot delete the active version. Please activate another version first." },
        { status: 400 },
      )
    }

    // Delete the version
    const { error: deleteError } = await supabase.from("leitbild").delete().eq("id", id)

    if (deleteError) {
      console.error("[v0] Error deleting version:", deleteError)
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting leitbild version:", error)
    return NextResponse.json({ error: error.message || "Failed to delete version" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { activate } = body

    if (!id) {
      return NextResponse.json({ error: "Version ID is required" }, { status: 400 })
    }

    if (!activate) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get the practice_id for this version
    const { data: versionData, error: fetchError } = await supabase
      .from("leitbild")
      .select("practice_id")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching version:", fetchError)
      throw fetchError
    }

    if (!versionData) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 })
    }

    // Deactivate all versions for this practice
    const { error: deactivateError } = await supabase
      .from("leitbild")
      .update({ is_active: false })
      .eq("practice_id", versionData.practice_id)

    if (deactivateError) {
      console.error("[v0] Error deactivating versions:", deactivateError)
      throw deactivateError
    }

    // Activate the selected version
    const { error: activateError } = await supabase.from("leitbild").update({ is_active: true }).eq("id", id)

    if (activateError) {
      console.error("[v0] Error activating version:", activateError)
      throw activateError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error activating leitbild version:", error)
    return NextResponse.json({ error: error.message || "Failed to activate version" }, { status: 500 })
  }
}
