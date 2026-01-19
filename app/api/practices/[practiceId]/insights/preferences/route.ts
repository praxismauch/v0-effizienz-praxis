import { NextRequest, NextResponse } from "next/server"
import { requirePracticeAccess, getEffectivePracticeId } from "@/lib/auth-helpers"

// GET - Fetch journal preferences
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const { data, error } = await supabase
      .from("journal_preferences")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[v0] Error fetching journal preferences:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to fetch preferences" }, { status: 500 })
  }
}

// POST - Create or update journal preferences
export async function POST(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId: rawPracticeId } = await params
    const practiceId = getEffectivePracticeId(rawPracticeId)

    const access = await requirePracticeAccess(practiceId)
    const supabase = access.adminClient

    const body = await request.json()

    const dataToSave = {
      ...body,
      practice_id: practiceId,
      updated_at: new Date().toISOString(),
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from("journal_preferences")
      .select("id")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    let result
    if (existing?.id) {
      const { data, error } = await supabase
        .from("journal_preferences")
        .update(dataToSave)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await supabase
        .from("journal_preferences")
        .insert(dataToSave)
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[v0] Error saving journal preferences:", error)

    if (error.message?.includes("Not authenticated") || error.message?.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Failed to save preferences" }, { status: 500 })
  }
}
