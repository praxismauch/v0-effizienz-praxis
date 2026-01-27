import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - Fetch arbeitsplätze associations for a skill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params

    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from("skill_arbeitsplaetze")
      .select("arbeitsplatz_id")
      .eq("skill_id", skillId)
      .eq("practice_id", practiceId)

    if (error) {
      // If table doesn't exist, return empty array instead of error
      if (error.code === "PGRST205" || error.message?.includes("does not exist")) {
        return NextResponse.json({ arbeitsplaetzeIds: [] })
      }
      console.error("Error fetching skill arbeitsplaetze:", error.message)
      return NextResponse.json({ arbeitsplaetzeIds: [] })
    }

    const arbeitsplaetzeIds = (data || []).map((d: any) => d.arbeitsplatz_id)
    return NextResponse.json({ arbeitsplaetzeIds })
  } catch (error: any) {
    // Return empty array on any error
    return NextResponse.json({ arbeitsplaetzeIds: [] })
  }
}

// PUT - Update arbeitsplätze associations for a skill (replace all)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ practiceId: string; skillId: string }> },
) {
  try {
    const { practiceId, skillId } = await params
    const body = await request.json()
    const { arbeitsplatz_ids } = body

    const supabase = await createAdminClient()

    const { error: checkError } = await supabase.from("skill_arbeitsplaetze").select("skill_id").limit(1)

    if (checkError && (checkError.code === "PGRST205" || checkError.message?.includes("does not exist"))) {
      // Table doesn't exist, return success but don't save
      return NextResponse.json({ success: true, message: "Table not available" })
    }

    // Delete existing associations
    const { error: deleteError } = await supabase
      .from("skill_arbeitsplaetze")
      .delete()
      .eq("skill_id", skillId)
      .eq("practice_id", practiceId)

    if (deleteError && !deleteError.message?.includes("does not exist")) {
      console.error("Error deleting skill arbeitsplaetze:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Insert new associations if any
    if (arbeitsplatz_ids && arbeitsplatz_ids.length > 0) {
      const insertData = arbeitsplatz_ids.map((arbeitsplatz_id: string) => ({
        skill_id: skillId,
        arbeitsplatz_id,
        practice_id: Number(practiceId),
      }))

      const { error: insertError } = await supabase.from("skill_arbeitsplaetze").insert(insertData)

      if (insertError && !insertError.message?.includes("does not exist")) {
        console.error("Error inserting skill arbeitsplaetze:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in skill arbeitsplaetze PUT:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
