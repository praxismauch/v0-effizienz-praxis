import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string; fileIndex: string }> },
) {
  try {
    const supabase = await createAdminClient()
    const { practiceId, id, fileIndex } = await params
    const index = Number.parseInt(fileIndex)

    const { data: existing, error: fetchError } = await supabase
      .from("kv_abrechnung")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError) {
      console.error("[v0] Error fetching KV Abrechnung:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!existing) {
      console.error("[v0] KV Abrechnung not found")
      return NextResponse.json({ error: "KV Abrechnung nicht gefunden" }, { status: 404 })
    }

    if (String(existing.practice_id) !== String(practiceId)) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 })
    }

    // Get files array and remove the specified file
    const files = Array.isArray(existing.files) ? existing.files : []

    if (index < 0 || index >= files.length) {
      return NextResponse.json({ error: "Ungültiger Datei-Index" }, { status: 400 })
    }

    const updatedFiles = files.filter((_, i) => i !== index)

    // If no files left, delete the entire entry
    if (updatedFiles.length === 0) {
      const { error: deleteError } = await supabase.from("kv_abrechnung").delete().eq("id", id)

      if (deleteError) {
        console.error("[v0] Error deleting KV Abrechnung:", deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, deleted_entry: true })
    }

    // Update with remaining files
    const { error: updateError } = await supabase
      .from("kv_abrechnung")
      .update({
        files: updatedFiles,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("[v0] Error updating KV Abrechnung:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting file:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, { status: 500 })
  }
}
