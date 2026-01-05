import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; id: string }> },
) {
  try {
    const supabase = await createAdminClient()
    const { practiceId, id } = await params

    console.log("[v0] Deleting KV Abrechnung:", { practiceId, id })

    // Verify the KV Abrechnung exists and belongs to the practice
    const { data: existing, error: fetchError } = await supabase
      .from("kv_abrechnung")
      .select("id, practice_id")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("[v0] Error fetching KV Abrechnung:", fetchError)
      return NextResponse.json({ error: "KV Abrechnung nicht gefunden", details: fetchError.message }, { status: 404 })
    }

    if (!existing) {
      return NextResponse.json({ error: "KV Abrechnung nicht gefunden" }, { status: 404 })
    }

    if (String(existing.practice_id) !== String(practiceId)) {
      return NextResponse.json({ error: "Keine Berechtigung für diese KV Abrechnung" }, { status: 403 })
    }

    const { error } = await supabase.from("kv_abrechnung").delete().eq("id", id)

    if (error) {
      console.error("[v0] Supabase error deleting KV Abrechnung:", error)
      throw error
    }

    console.log("[v0] Successfully deleted KV Abrechnung:", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting KV Abrechnung:", error)
    return NextResponse.json(
      {
        error: "Fehler beim Löschen der KV Abrechnung",
        details: error instanceof Error ? error.message : "Unbekannter Fehler",
      },
      { status: 500 },
    )
  }
}
