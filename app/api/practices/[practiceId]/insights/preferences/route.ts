import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET - Fetch journal preferences
export async function GET(request: NextRequest, { params }: { params: Promise<{ practiceId: string }> }) {
  try {
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await adminClient
      .from("journal_preferences")
      .select("*")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    // Handle missing column gracefully
    if (result.error?.code === "42703" || result.error?.message?.includes("does not exist")) {
      return NextResponse.json(null)
    }
    if (result.error && result.error.code !== "PGRST205" && result.error.code !== "42P01") {
      throw result.error
    }

    return NextResponse.json(result.data)
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
    const { practiceId } = await params
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const dataToSave = {
      ...body,
      practice_id: practiceId,
      updated_at: new Date().toISOString(),
    }

    // Check if preferences exist
    const { data: existing } = await adminClient
      .from("journal_preferences")
      .select("id")
      .eq("practice_id", practiceId)
      .is("deleted_at", null)
      .maybeSingle()

    let result
    if (existing?.id) {
      const { data, error } = await adminClient
        .from("journal_preferences")
        .update(dataToSave)
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      const { data, error } = await adminClient
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
